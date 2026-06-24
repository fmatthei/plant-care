import { createClient } from 'npm:@supabase/supabase-js@2';

// Promote / demote a user's admin status by writing app_metadata.is_admin.
// Gated: the caller must themselves be an admin (app_metadata.is_admin === true),
// the same source the main app trusts at src/app.js:398. Writing auth.users metadata
// requires the service-role key, so this runs server-side only.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://plant-care-admin.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // ---- Authenticate the caller from their JWT ----
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return json({ error: 'Missing Authorization bearer token.' }, 401);
  }

  // A service-role client can resolve any JWT to its user; pass the token explicitly.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: caller, error: callerError } = await adminClient.auth.getUser(token);
  if (callerError || !caller?.user) {
    return json({ error: 'Invalid or expired session.' }, 401);
  }
  if (caller.user.app_metadata?.is_admin !== true) {
    return json({ error: 'Forbidden: caller is not an administrator.' }, 403);
  }

  // ---- Parse and validate the request body ----
  let body: { user_id?: unknown; is_admin?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }
  const { user_id, is_admin } = body;
  if (typeof user_id !== 'string' || !user_id) {
    return json({ error: 'user_id is required and must be a string.' }, 400);
  }
  if (typeof is_admin !== 'boolean') {
    return json({ error: 'is_admin is required and must be a boolean.' }, 400);
  }

  // ---- Write the flag with the service-role client ----
  const { error: updateError } = await adminClient.auth.admin.updateUserById(user_id, {
    app_metadata: { is_admin },
  });
  if (updateError) {
    return json({ error: updateError.message }, 500);
  }

  return json({ success: true }, 200);
});
