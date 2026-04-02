import webpush from 'npm:web-push';
import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CARE_VERB: Record<string, string> = {
  water:     'watered',
  refill:    'refilled',
  fertilize: 'fertilized',
  check:     'checked',
  repot:     'repotted',
  prune:     'pruned',
  pest:      'checked pests on',
  rotate:    'rotated',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const { plant_name, task_name, task_type, actor_name, household_id } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Fetch all household members except the actor
  const { data: members, error: membersError } = await supabase
    .from('household_members')
    .select('id, display_name')
    .eq('household_id', household_id)
    .is('deleted_at', null)
    .neq('display_name', actor_name);

  if (membersError) console.error('notify-care-log: members fetch error:', membersError);
  if (!members?.length) return new Response('ok', { headers: CORS_HEADERS });

  // 2. Fetch push subscriptions for those members
  const memberIds = members.map((m) => m.id);
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .in('household_member_id', memberIds);

  if (subsError) console.error('notify-care-log: subscriptions fetch error:', subsError);
  if (!subscriptions?.length) return new Response('ok', { headers: CORS_HEADERS });

  // 3. Configure VAPID
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  // 4. Build notification body
  const verb = CARE_VERB[task_type];
  const body = verb
    ? `${actor_name} ${verb} ${plant_name}`
    : `${actor_name} · ${task_name} — ${plant_name}`;

  const payload = JSON.stringify({
    title: 'Plant Care',
    body,
    icon: '/favicon.ico',
  });

  // 5. Send to all subscriptions; allSettled so one failure doesn't abort others
  await Promise.allSettled(
    subscriptions.map((row) => webpush.sendNotification(row.subscription, payload)),
  );

  return new Response('ok', { headers: CORS_HEADERS });
});
