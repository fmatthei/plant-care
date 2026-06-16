import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function todayStr(): string {
  // Anchor to America/Santiago, NOT the runtime TZ. Supabase Edge runs with
  // TZ=UTC, so a bare toLocaleDateString('en-CA') rolls the date at 00:00 UTC
  // (= 20:00 Santiago, UTC−4) and drops the current local day's events ~4h
  // early. The explicit timeZone makes the anchor independent of TZ=UTC. (The
  // identical helper in src/app.js:600 is intentionally left bare — it runs in
  // the device's local zone, which is already correct. Do not sync this back.)
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
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

function nextWeekdayOccurrence(days: number[], skipToday = false, anchor = todayStr()): string {
  if (!days || days.length === 0) return anchor;
  const anchorDow = new Date(anchor + 'T12:00:00').getDay();
  for (let d = skipToday ? 1 : 0; d <= 7; d++) {
    if (days.includes((anchorDow + d) % 7)) return addDays(anchor, d);
  }
  return anchor;
}

function computeNextDue(task: any): string | null {
  if (task.next_due_override) {
    const recType = task.recurrence?.type ?? 'interval';
    if (recType === 'weekdays') {
      const days = task.recurrence?.days ?? [];
      if (days.includes(new Date(task.next_due_override + 'T12:00:00').getDay())) {
        return task.next_due_override;
      }
      return nextWeekdayOccurrence(days, false, task.next_due_override);
    }
    return task.next_due_override;
  }
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

// Enumerate every occurrence of a task within a window. Computes the first
// occurrence via computeNextDue() once, then steps forward by recurrence type —
// porting the validated steppers in src/app.js (Summary "Upcoming" :2935–2974,
// intervalOccurrencesAfterToday :3739, weekdayOccurrencesAfterToday :3752).
// Returns YYYY-MM-DD strings in ascending order. Windowed mode (`until`) is the
// only mode implemented; `count` is reserved for later.
function enumerateOccurrences(
  task: any,
  opts: { until?: string; from?: string; count?: number },
): string[] {
  const first = computeNextDue(task);
  if (first === null) return [];

  const until = opts.until;
  if (!until) return [];                 // only windowed mode is implemented

  const recType = task.recurrence?.type ?? 'interval';

  // one-off: a single occurrence, emitted iff inside the window. Never step.
  if (recType === 'one-off') {
    return first <= until ? [first] : [];
  }

  if (first > until) return [];

  // weekday: step day-by-day from first, collecting cursors whose weekday is
  // selected. `first` is already a valid selected weekday (the override
  // start-boundary snap was consumed by computeNextDue) — do not re-resolve the
  // override mid-loop.
  if (recType === 'weekdays') {
    const days = task.recurrence?.days ?? [];
    if (days.length === 0) return [];
    const out: string[] = [];
    // Backward pre-pass (#307): linger for the same 2-day trailing window the
    // interval/one-off paths get. Walk back from `first` to `opts.from`
    // (= windowStart), prepending past selected-weekday dates in ascending
    // order. Skipped entirely when next_due_override is set — there `first` is
    // the override-snapped start boundary, and emitting anything before it would
    // surface the task ahead of its start. Floored at last_done (exclusive) so a
    // weekday occurrence already completed inside the window is not resurfaced.
    if (opts.from && !task.next_due_override) {
      const back: string[] = [];
      let cursor = addDays(first, -1);
      while (cursor >= opts.from) {
        if (
          (!task.last_done || cursor > task.last_done) &&
          days.includes(new Date(cursor + 'T12:00:00').getDay())
        ) {
          back.push(cursor);
        }
        cursor = addDays(cursor, -1);
      }
      back.reverse();          // collected newest-first; restore ascending order
      out.push(...back);
    }
    let cursor = first;
    while (cursor <= until) {
      if (days.includes(new Date(cursor + 'T12:00:00').getDay())) out.push(cursor);
      cursor = addDays(cursor, 1);
    }
    return out;
  }

  // interval: step by `every` days from first. addDays anchors at noon
  // (T12:00:00), so the lattice never drifts across DST.
  const every = task.recurrence?.every ?? 7;
  if (every <= 0) return [first];
  const out: string[] = [];
  let cursor = first;
  while (cursor <= until) {
    out.push(cursor);
    cursor = addDays(cursor, every);
  }
  return out;
}

function icsDate(dateStr: string): string {
  return dateStr.replaceAll('-', '');
}

// Normalize a Postgres `time` value ("20:00:00") or HH:MM to HH:MM, with fallback.
function toHHMM(t: string | null | undefined, fallback: string): string {
  if (!t) return fallback;
  return String(t).slice(0, 5);
}

// Build a floating-datetime stamp (YYYYMMDDTHHmmss, no Z) for `dateStr` at `hhmm`
// plus `offsetMin` minutes, rolling the date forward/back across midnight as needed.
function floatingDateTime(dateStr: string, hhmm: string, offsetMin = 0): string {
  const [h, m] = hhmm.split(':').map(Number);
  let total = h * 60 + m + offsetMin;
  let dayOffset = 0;
  while (total >= 1440) { total -= 1440; dayOffset++; }
  while (total < 0) { total += 1440; dayOffset--; }
  const date = dayOffset === 0 ? dateStr : addDays(dateStr, dayOffset);
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${icsDate(date)}T${hh}${mm}00`;
}

// Current UTC instant as YYYYMMDDTHHmmssZ (RFC 5545 DTSTAMP format).
function utcStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
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

  // Resolve household scope + the schedule times that govern event timing.
  let resolvedHouseholdId: string;
  let memberDisplayName = '';
  let calendarTime = '20:00';     // HH:MM, default
  let weekendTime: string | null = null;

  if (memberId) {
    const { data: member, error: memberError } = await supabase
      .from('household_members')
      .select('household_id, display_name, calendar_time, calendar_weekend_time')
      .eq('id', memberId)
      .single();

    if (memberError || !member) {
      console.error('get-calendar-feed: member lookup error:', memberError);
      return new Response('member not found', { status: 404, headers: CORS_HEADERS });
    }
    resolvedHouseholdId = member.household_id;
    memberDisplayName = member.display_name ?? '';
    calendarTime = toHHMM(member.calendar_time, '20:00');
    weekendTime = member.calendar_weekend_time ? toHHMM(member.calendar_weekend_time, '20:00') : null;
  } else {
    resolvedHouseholdId = householdIdParam!;
    // ALL HOUSEHOLD TASKS feed: fall back to the first member's schedule times.
    const { data: firstMembers } = await supabase
      .from('household_members')
      .select('calendar_time, calendar_weekend_time')
      .eq('household_id', resolvedHouseholdId)
      .is('deleted_at', null)
      .limit(1);
    const fm = firstMembers?.[0];
    calendarTime = toHHMM(fm?.calendar_time, '20:00');
    weekendTime = fm?.calendar_weekend_time ? toHHMM(fm.calendar_weekend_time, '20:00') : null;
  }

  // Household name for the calendar title/description.
  const { data: household } = await supabase
    .from('households')
    .select('name')
    .eq('id', resolvedHouseholdId)
    .single();
  const householdName = household?.name ?? 'Household';

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

  const calName = memberId
    ? `Plant Care — ${memberDisplayName} · ${householdName}`
    : `Plant Care — ${householdName} · All`;
  const calDesc = memberId
    ? `Plant care tasks assigned to ${memberDisplayName}`
    : `All plant care tasks for ${householdName}`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Plant Care//Calendar Feed//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calName)}`,
    `X-WR-CALDESC:${escapeIcsText(calDesc)}`,
  ];

  // Group tasks by occurrence date. Each task contributes every occurrence
  // within the next 14 days, not just its next one.
  interface DayTask { taskName: string; plantName: string; plantEmoji: string }
  const byDate = new Map<string, DayTask[]>();
  const windowEnd = addDays(today, 14);
  // 2-day trailing past window: surface recently-missed interval + past-dated
  // one-off occurrences. Derived from the same Santiago-anchored `today` (no new
  // date minted). Weekday tasks seed forward-only and generate no past dates, so
  // they are unaffected by construction (#309).
  const windowStart = addDays(today, -2);

  for (const task of tasks ?? []) {
    // Done-today suppression: a task completed today whose next occurrence is
    // today must not emit a today event (mirrors src/app.js :2367 / :2937).
    if (task.last_done === today && computeNextDue(task) === today) continue;

    const plant = (task as any).plants;
    const entry: DayTask = {
      taskName: (task.custom_name && task.custom_name.length > 0) ? task.custom_name : task.name,
      plantName: plant?.name ?? '',
      plantEmoji: plant?.emoji ?? '',
    };

    for (const dateStr of enumerateOccurrences(task, { until: windowEnd, from: windowStart })) {
      if (daysBetween(windowStart, dateStr) < 0) continue;   // never before the 2-day trailing window
      const bucket = byDate.get(dateStr);
      if (bucket) bucket.push(entry);
      else byDate.set(dateStr, [entry]);
    }
  }

  const dtStamp = utcStamp();
  const scope = memberId ?? resolvedHouseholdId;

  for (const dateStr of [...byDate.keys()].sort()) {
    const dayTasks = byDate.get(dateStr)!;

    // Event time: weekend slots use weekendTime when set, otherwise the weekday time.
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    const isWeekend = dow === 0 || dow === 6;
    const eventTime = (isWeekend && weekendTime) ? weekendTime : calendarTime;

    const dtStart = floatingDateTime(dateStr, eventTime, 0);
    const dtEnd = floatingDateTime(dateStr, eventTime, 30);

    let summary: string;
    let description: string | null = null;
    if (dayTasks.length === 1) {
      const t = dayTasks[0];
      summary = `${t.plantEmoji} ${t.plantName} — ${t.taskName}`;
    } else {
      summary = `🌿 Plant Care · ${dayTasks.length} tasks`;
      description = dayTasks.map(t => `${t.taskName} · ${t.plantName}`).join('\n');
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${icsDate(dateStr)}-${scope}@plantcare`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    if (description !== null) lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:PT0M');
    lines.push('ACTION:DISPLAY');
    lines.push('DESCRIPTION:Plant Care reminder');
    lines.push('END:VALARM');
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
