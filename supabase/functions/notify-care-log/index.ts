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

  const {
    event_type = 'task_done',
    plant_name,
    task_name,
    task_type,
    actor_name,
    actor_member_id,
    recipient_member_id,
    household_id,
  } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Resolve recipient household_member ids per event type. Exclusion and
  //    matching are keyed on household_member_id (not display_name) so members
  //    who share a name are handled correctly (#357).
  let recipientIds: string[];

  if (event_type === 'task_reassigned') {
    // Reassignment notifies ONLY the new owner — not a broadcast.
    recipientIds = recipient_member_id ? [recipient_member_id] : [];
  } else {
    // task_done + note_added: broadcast to all household members except the actor.
    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', household_id)
      .is('deleted_at', null)
      .neq('id', actor_member_id);

    if (membersError) console.error('notify-care-log: members fetch error:', membersError);
    recipientIds = (members ?? []).map((m) => m.id);
  }

  if (!recipientIds.length) return new Response('ok', { headers: CORS_HEADERS });

  // 2. Fetch push subscriptions for those members
  const { data: subscriptions, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .in('household_member_id', recipientIds);

  if (subsError) console.error('notify-care-log: subscriptions fetch error:', subsError);
  if (!subscriptions?.length) return new Response('ok', { headers: CORS_HEADERS });

  // 3. Configure VAPID
  webpush.setVapidDetails(
    Deno.env.get('VAPID_SUBJECT')!,
    Deno.env.get('VAPID_PUBLIC_KEY')!,
    Deno.env.get('VAPID_PRIVATE_KEY')!,
  );

  // 4. Build notification body per event type
  let body: string;
  if (event_type === 'note_added') {
    body = `${actor_name} added a note on ${plant_name}`;
  } else if (event_type === 'task_reassigned') {
    body = `You've been assigned ${task_name} for ${plant_name}`;
  } else {
    const verb = CARE_VERB[task_type];
    body = verb
      ? `${actor_name} ${verb} ${plant_name}`
      : `${actor_name} · ${task_name} — ${plant_name}`;
  }

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
