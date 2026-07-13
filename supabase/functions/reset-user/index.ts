import { createClient } from 'npm:@supabase/supabase-js@2';

// Reset a household member's per-user onboarding / notification / calendar state.
// Admin-tool only, service-role. Sibling of reset-household — same auth model and
// GET-preview / POST-execute shape. Never touches plant data (that's
// reset-household), the household_members row itself, role, or auth.users.
//
//   GET  ?household_member_id=…      — preview one member's current field values.
//   GET  ?household_id=…&all=true    — preview every active member in a household.
//   POST { household_member_id, confirm_name }         — reset one member.
//   POST { household_id, all: true, confirm_name }      — reset every active member.
//
// The reset (mirrors src/app.js #405a runOnboardingReset, plus calendar defaults):
//   onboarding_completed_at → null
//   notifications_enabled   → false
//   calendar_time           → '20:00' (schema default)
//   calendar_weekend_time   → null
//   push_subscriptions rows for the member(s) → deleted
//
// Gated: caller must be an admin (app_metadata.is_admin === true). Runs with the
// service-role key because household_members RLS is scoped to the row's own user /
// household members, and an admin is typically not a member of the target household.

const CAL_DEFAULT = '20:00';
const RESET_FIELDS = {
  onboarding_completed_at: null,
  notifications_enabled: false,
  calendar_time: CAL_DEFAULT,
  calendar_weekend_time: null,
};

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

// Map of household_member_id → count of push_subscriptions rows.
async function pushCounts(admin: Admin, memberIds: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (memberIds.length === 0) return out;
  const { data, error } = await admin
    .from('push_subscriptions').select('household_member_id').in('household_member_id', memberIds);
  if (error) throw new Error(`push_subscriptions lookup: ${error.message}`);
  for (const r of data ?? []) {
    out[r.household_member_id] = (out[r.household_member_id] ?? 0) + 1;
  }
  return out;
}

function memberView(m: Record<string, unknown>, push: number) {
  return {
    id: m.id,
    display_name: m.display_name,
    onboarding_completed: m.onboarding_completed_at != null,
    notifications_enabled: m.notifications_enabled === true,
    calendar_time: m.calendar_time,
    calendar_weekend_time: m.calendar_weekend_time,
    push_subscriptions: push,
  };
}

// Apply the reset to a set of member ids: update the columns + delete push subs.
async function resetMembers(admin: Admin, ids: string[]) {
  if (ids.length === 0) return { reset: 0, push_deleted: 0 };
  const { data: updated, error: uErr } = await admin
    .from('household_members').update(RESET_FIELDS).in('id', ids).select('id');
  if (uErr) throw new Error(`member update: ${uErr.message}`);
  const { data: delPush, error: pErr } = await admin
    .from('push_subscriptions').delete().in('household_member_id', ids).select('id');
  if (pErr) throw new Error(`push_subscriptions delete: ${pErr.message}`);
  return { reset: (updated ?? []).length, push_deleted: (delPush ?? []).length };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
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
  if (callerError || !caller?.user) return json({ error: 'Invalid or expired session.' }, 401, cors);
  if (caller.user.app_metadata?.is_admin !== true) {
    return json({ error: 'Forbidden: caller is not an administrator.' }, 403, cors);
  }

  try {
    // ---- GET: preview ----
    if (req.method === 'GET') {
      const params = new URL(req.url).searchParams;
      const memberId = params.get('household_member_id');
      const householdId = params.get('household_id');
      const all = params.get('all') === 'true';

      if (memberId) {
        const { data: m, error } = await admin.from('household_members')
          .select('id, display_name, household_id, onboarding_completed_at, notifications_enabled, calendar_time, calendar_weekend_time')
          .eq('id', memberId).maybeSingle();
        if (error) return json({ error: error.message }, 500, cors);
        if (!m) return json({ error: 'Member not found.' }, 404, cors);
        const { data: hh } = await admin.from('households').select('name').eq('id', m.household_id).maybeSingle();
        const push = (await pushCounts(admin, [m.id]))[m.id] ?? 0;
        return json({ scope: 'single', household_name: hh?.name ?? null, member: memberView(m, push) }, 200, cors);
      }

      if (householdId && all) {
        const { data: hh, error: hhErr } = await admin.from('households').select('id, name').eq('id', householdId).maybeSingle();
        if (hhErr) return json({ error: hhErr.message }, 500, cors);
        if (!hh) return json({ error: 'Household not found.' }, 404, cors);
        const { data: members, error: mErr } = await admin.from('household_members')
          .select('id, display_name, onboarding_completed_at, notifications_enabled, calendar_time, calendar_weekend_time')
          .eq('household_id', householdId).is('deleted_at', null);
        if (mErr) return json({ error: mErr.message }, 500, cors);
        const ids = (members ?? []).map((m: { id: string }) => m.id);
        const pushes = await pushCounts(admin, ids);
        return json({
          scope: 'all', household_id: hh.id, household_name: hh.name,
          count: ids.length,
          members: (members ?? []).map((m: Record<string, unknown>) => memberView(m, pushes[m.id as string] ?? 0)),
        }, 200, cors);
      }

      return json({ error: 'household_member_id, or household_id with all=true, is required.' }, 400, cors);
    }

    // ---- POST: execute ----
    let body: { household_member_id?: unknown; household_id?: unknown; all?: unknown; confirm_name?: unknown };
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Request body must be valid JSON.' }, 400, cors);
    }
    const { household_member_id, household_id, all, confirm_name } = body;

    // Single member.
    if (typeof household_member_id === 'string' && household_member_id) {
      const { data: m, error } = await admin.from('household_members')
        .select('id, display_name').eq('id', household_member_id).maybeSingle();
      if (error) return json({ error: error.message }, 500, cors);
      if (!m) return json({ error: 'Member not found.' }, 404, cors);
      if (typeof confirm_name !== 'string' || confirm_name.trim() !== (m.display_name ?? '')) {
        return json({ error: "Confirmation name does not match the member's display name." }, 400, cors);
      }
      const res = await resetMembers(admin, [m.id]);
      return json({ scope: 'single', members: [m.display_name], reset: res.reset, push_deleted: res.push_deleted }, 200, cors);
    }

    // All members in a household.
    if (typeof household_id === 'string' && household_id && all === true) {
      const { data: hh, error: hhErr } = await admin.from('households').select('id, name').eq('id', household_id).maybeSingle();
      if (hhErr) return json({ error: hhErr.message }, 500, cors);
      if (!hh) return json({ error: 'Household not found.' }, 404, cors);
      if (typeof confirm_name !== 'string' || confirm_name.trim() !== hh.name) {
        return json({ error: 'Confirmation name does not match the household name.' }, 400, cors);
      }
      const { data: members, error: mErr } = await admin.from('household_members')
        .select('id, display_name').eq('household_id', household_id).is('deleted_at', null);
      if (mErr) return json({ error: mErr.message }, 500, cors);
      const ids = (members ?? []).map((m: { id: string }) => m.id);
      const res = await resetMembers(admin, ids);
      return json({
        scope: 'all', reset: res.reset, push_deleted: res.push_deleted,
        members: (members ?? []).map((m: { display_name: string }) => m.display_name),
      }, 200, cors);
    }

    return json({ error: 'household_member_id, or household_id with all=true, is required.' }, 400, cors);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500, cors);
  }
});
