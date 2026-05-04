import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round(
    (new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / msPerDay,
  );
}

function nextWeekdayOccurrence(days: number[], skipToday = false): string {
  if (!days || days.length === 0) return todayStr();
  const todayDow = new Date(todayStr() + 'T12:00:00').getDay();
  for (let d = skipToday ? 1 : 0; d <= 7; d++) {
    if (days.includes((todayDow + d) % 7)) return addDays(todayStr(), d);
  }
  return todayStr();
}

function computeNextDue(task: any): string | null {
  if (task.next_due_override) return task.next_due_override;
  const recType = task.recurrence?.type ?? 'interval';
  if (recType === 'one-off') {
    return task.last_done ? null : todayStr();
  }
  if (recType === 'weekdays') {
    const skipToday = task.last_done === todayStr();
    return nextWeekdayOccurrence(task.recurrence?.days ?? [], skipToday);
  }
  if (!task.last_done) return todayStr();
  return addDays(task.last_done, task.recurrence?.every ?? 7);
}

function icsDate(dateStr: string): string {
  return dateStr.replaceAll('-', '');
}

function escapeIcsText(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'GET') {
    return new Response('method not allowed', { status: 405, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const memberId = url.searchParams.get('member_id');
  const householdIdParam = url.searchParams.get('household_id');

  if (!memberId && !householdIdParam) {
    return new Response('member_id or household_id required', {
      status: 400,
      headers: CORS_HEADERS,
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Resolve household scope
  let resolvedHouseholdId: string;
  if (memberId) {
    const { data: member, error: memberError } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      console.error('get-calendar-feed: member lookup error:', memberError);
      return new Response('member not found', { status: 404, headers: CORS_HEADERS });
    }
    resolvedHouseholdId = member.household_id;
  } else {
    resolvedHouseholdId = householdIdParam!;
  }

  // Query tasks joined with plants
  let query = supabase
    .from('tasks')
    .select('*, plants!inner(name, emoji, household_id, deleted_at)')
    .eq('plants.household_id', resolvedHouseholdId)
    .is('deleted_at', null)
    .is('plants.deleted_at', null)
    .eq('paused', false);

  if (memberId) {
    query = query.eq('owner_id', memberId);
  }

  const { data: tasks, error: tasksError } = await query;

  if (tasksError) {
    console.error('get-calendar-feed: tasks fetch error:', tasksError);
    return new Response('failed to fetch tasks', { status: 500, headers: CORS_HEADERS });
  }

  const today = todayStr();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plant Care//Calendar Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Plant Care Tasks',
    'X-WR-CALDESC:Upcoming plant care tasks',
  ];

  for (const task of tasks ?? []) {
    const nextDue = computeNextDue(task);
    if (nextDue === null) continue;
    if (daysBetween(today, nextDue) > 60) continue;

    const dtStart = icsDate(nextDue);
    const dtEnd = icsDate(addDays(nextDue, 1));

    const plant = (task as any).plants;
    const plantName = plant?.name ?? '';
    const plantEmoji = plant?.emoji ?? '';
    const taskName =
      (task.custom_name && task.custom_name.length > 0) ? task.custom_name : task.name;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${task.id}@plantcare`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(`${plantEmoji} ${plantName} — ${taskName}`)}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  const icsString = lines.join('\r\n');

  return new Response(icsString, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="plant-care.ics"',
    },
  });
});
