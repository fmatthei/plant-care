import { createClient } from 'npm:@supabase/supabase-js@2';

// Reset a household's PLANT data. Admin-tool only, service-role.
//   GET  ?household_id=…  — preview: counts of what a reset would affect (no writes).
//   POST { household_id, mode: 'shallow'|'deep', confirm_name } — perform the reset.
//     shallow — soft-delete plants (deleted_at = now()). Tasks/notes/care_log/photos
//               stay in the DB, hidden. Reversible. Mirrors the app's "Empty" seed.
//     deep    — hard-delete care_log, plant_photos, notes, tasks, plants (leaf-first)
//               and remove the household's plant-photos storage objects. Irreversible.
// Never touches households, households.name, or household_members — plant data only.
//
// Gated: the caller must be an admin (app_metadata.is_admin === true) — the same
// source the main app (src/app.js) and set-admin-status trust. The reset itself
// runs with the service-role key because plants/tasks/care_log RLS is scoped to
// household MEMBERS, and an admin is typically not a member of the target household.

const ALLOWED_ORIGINS = new Set([
  'https://plant-care-admin.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.has(origin)
    ? origin
    : 'https://plant-care-admin.netlify.app';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

// deno-lint-ignore no-explicit-any
type Admin = any;

// All plant ids for a household, INCLUDING soft-deleted ones — a deep delete removes
// them physically regardless of deleted_at.
async function plantIds(admin: Admin, hid: string): Promise<string[]> {
  const { data, error } = await admin.from('plants').select('id').eq('household_id', hid);
  if (error) throw new Error(`plants lookup: ${error.message}`);
  return (data ?? []).map((r: { id: string }) => r.id);
}

async function countByPlant(admin: Admin, table: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { count, error } = await admin
    .from(table).select('id', { count: 'exact', head: true }).in('plant_id', ids);
  if (error) throw new Error(`${table} count: ${error.message}`);
  return count ?? 0;
}

// Number of plant-photos storage objects under this household's plant prefixes.
async function storageCount(admin: Admin, ids: string[]): Promise<number> {
  let total = 0;
  for (const pid of ids) {
    const { data: files, error } = await admin.storage.from('plant-photos').list(pid, { limit: 1000 });
    if (error) throw new Error(`storage list: ${error.message}`);
    total += (files ?? []).length;
  }
  return total;
}

async function previewCounts(admin: Admin, hid: string) {
  const ids = await plantIds(admin, hid);
  const { count: activeCount, error: aErr } = await admin
    .from('plants').select('id', { count: 'exact', head: true })
    .eq('household_id', hid).is('deleted_at', null);
  if (aErr) throw new Error(`active plants count: ${aErr.message}`);
  return {
    plants: ids.length,
    plants_active: activeCount ?? 0,
    tasks: await countByPlant(admin, 'tasks', ids),
    notes: await countByPlant(admin, 'notes', ids),
    care_log: await countByPlant(admin, 'care_log', ids),
    plant_photos: await countByPlant(admin, 'plant_photos', ids),
    storage_objects: await storageCount(admin, ids),
  };
}

// Delete every plant-photos object under each plant's prefix.
// Returns { listed, removed }:
//   listed  = objects found under the prefixes (what we attempted to remove).
//   removed = objects the Storage API CONFIRMED it deleted — the length of the
//             remove() response `data`, which contains one entry per object that
//             actually existed and was removed. This is NOT `paths.length`: a
//             non-existent path is silently omitted from `data`, so counting
//             attempts would over-report (the bug flagged in #storage-verify).
// A whole-batch failure surfaces as a thrown error (rmErr); a partial removal
// (removed < listed with no error) is logged per-plant and reflected in the counts.
async function removePlantStorage(admin: Admin, ids: string[]): Promise<{ listed: number; removed: number }> {
  let listed = 0;
  let removed = 0;
  for (const pid of ids) {
    const { data: files, error } = await admin.storage.from('plant-photos').list(pid, { limit: 1000 });
    if (error) throw new Error(`storage list: ${error.message}`);
    const paths = (files ?? []).map((f: { name: string }) => `${pid}/${f.name}`);
    if (!paths.length) continue;
    listed += paths.length;
    const { data: removedObjs, error: rmErr } = await admin.storage.from('plant-photos').remove(paths);
    if (rmErr) throw new Error(`storage remove (plant ${pid}): ${rmErr.message}`);
    const confirmed = (removedObjs ?? []).length;
    removed += confirmed;
    if (confirmed !== paths.length) {
      console.warn(
        `reset-household: storage remove MISMATCH for plant ${pid} — attempted ${paths.length}, confirmed ${confirmed}. Paths: ${JSON.stringify(paths)}`,
      );
    }
  }
  return { listed, removed };
}

async function deleteByPlant(admin: Admin, table: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const { data, error } = await admin.from(table).delete().in('plant_id', ids).select('id');
  if (error) throw new Error(`${table} delete: ${error.message}`);
  return (data ?? []).length;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, cors);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ---- Authenticate the caller and require admin (app_metadata.is_admin) ----
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return json({ error: 'Missing Authorization bearer token.' }, 401, cors);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller?.user) {
    return json({ error: 'Invalid or expired session.' }, 401, cors);
  }
  if (caller.user.app_metadata?.is_admin !== true) {
    return json({ error: 'Forbidden: caller is not an administrator.' }, 403, cors);
  }

  try {
    // ---- Resolve the target household (name needed for the typed confirmation) ----
    const householdId = req.method === 'GET'
      ? new URL(req.url).searchParams.get('household_id')
      : undefined;

    // GET: preview only.
    if (req.method === 'GET') {
      if (!householdId) return json({ error: 'household_id query parameter is required.' }, 400, cors);
      const { data: hh, error: hhErr } = await admin
        .from('households').select('id, name').eq('id', householdId).maybeSingle();
      if (hhErr) return json({ error: hhErr.message }, 500, cors);
      if (!hh) return json({ error: 'Household not found.' }, 404, cors);
      return json({ household_id: hh.id, name: hh.name, counts: await previewCounts(admin, hh.id) }, 200, cors);
    }

    // ---- POST: perform the reset ----
    let body: { household_id?: unknown; mode?: unknown; confirm_name?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Request body must be valid JSON.' }, 400, cors);
    }
    const { household_id, mode, confirm_name } = body;
    if (typeof household_id !== 'string' || !household_id) {
      return json({ error: 'household_id is required.' }, 400, cors);
    }
    if (mode !== 'shallow' && mode !== 'deep') {
      return json({ error: "mode must be 'shallow' or 'deep'." }, 400, cors);
    }

    const { data: hh, error: hhErr } = await admin
      .from('households').select('id, name').eq('id', household_id).maybeSingle();
    if (hhErr) return json({ error: hhErr.message }, 500, cors);
    if (!hh) return json({ error: 'Household not found.' }, 404, cors);

    // Server-side re-check of the typed confirmation (defense in depth).
    if (typeof confirm_name !== 'string' || confirm_name.trim() !== hh.name) {
      return json({ error: 'Confirmation name does not match the household name.' }, 400, cors);
    }

    if (mode === 'shallow') {
      const { data, error } = await admin.from('plants')
        .update({ deleted_at: new Date().toISOString() })
        .eq('household_id', household_id).is('deleted_at', null).select('id');
      if (error) return json({ error: `plants soft-delete: ${error.message}` }, 500, cors);
      return json({ mode: 'shallow', counts: { plants: (data ?? []).length } }, 200, cors);
    }

    // Deep: hard-delete leaf-first, then remove storage objects.
    const ids = await plantIds(admin, household_id);
    // Log the household + the exact plant_ids BEFORE any deletion, so a specific
    // execution stays traceable after the fact even once storage.objects / plant
    // rows are gone (Storage is keyed by plant_id, so this is the only key that
    // lets a later audit locate the affected objects). See #storage-verify.
    console.log(
      `reset-household: DEEP reset — household=${household_id} name=${JSON.stringify(hh.name)} plant_ids=${JSON.stringify(ids)}`,
    );
    const care_log = await deleteByPlant(admin, 'care_log', ids);
    const plant_photos = await deleteByPlant(admin, 'plant_photos', ids);
    const notes = await deleteByPlant(admin, 'notes', ids);
    const tasks = await deleteByPlant(admin, 'tasks', ids);
    const { data: delPlants, error: pErr } = ids.length
      ? await admin.from('plants').delete().eq('household_id', household_id).select('id')
      : { data: [], error: null };
    if (pErr) return json({ error: `plants delete: ${pErr.message}` }, 500, cors);
    const storage = await removePlantStorage(admin, ids);
    console.log(
      `reset-household: DEEP reset — household=${household_id} storage listed=${storage.listed} confirmed_removed=${storage.removed}`,
    );

    return json({
      mode: 'deep',
      counts: {
        plants: (delPlants ?? []).length, tasks, notes, care_log, plant_photos,
        // storage_objects = objects the Storage API CONFIRMED removed (not attempted).
        // storage_objects_listed = objects found under the prefixes; a gap between
        // the two means a partial removal (details in the function logs).
        storage_objects: storage.removed,
        storage_objects_listed: storage.listed,
      },
    }, 200, cors);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500, cors);
  }
});
