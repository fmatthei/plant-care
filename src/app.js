'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const TASK_CONFIG = {
  'normal-water': { name: 'Watering',           icon: '💧', type: 'water' },
  'refill-pot':   { name: 'Refill Self-Watering Pot',  icon: '🫙', type: 'refill' },
  'fertilize':    { name: 'Fertilize',                 icon: '🌱', type: 'fertilize' },
  'check':        { name: 'Check',                     icon: '🔍', type: 'check' },
  'repot':        { name: 'Repot',                     icon: '🪴', type: 'repot' },
  'prune':        { name: 'Prune',                     icon: '✂️',  type: 'prune' },
  'check-pests':  { name: 'Check Pests',               icon: '🐛', type: 'pest' },
  'rotate':       { name: 'Rotate',                    icon: '🔄', type: 'rotate' },
};

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const VAPID_PUBLIC_KEY = 'BLVM0ZnxinWDENKHaZ5QslyAmUJNjf-9w4q3Sxc0mFuVKS19lVLePh39yuaZIc_a_PX5PPnIECGUFeQl2XkOpWQ';

const CARE_VERB = {
  water:     'watered',
  refill:    'refilled',
  fertilize: 'fertilized',
  check:     'checked',
  repot:     'repotted',
  prune:     'pruned',
  pest:      'checked pests on',
  rotate:    'rotated',
};

const CARE_ICON = {
  water:     '💧',
  refill:    '🪣',
  fertilize: '🌱',
  check:     '🔍',
  repot:     '🪴',
  prune:     '✂️',
  pest:      '🐛',
  rotate:    '🔄',
  skipped:   '⏭',
};

const CUSTOM_ICONS = ['🌿', '💦', '🧴', '🌊', '✂️', '🔍', '🪴', '🐛', '🔄', '🌞', '🧪', '🌸', '🍃', '🌼', '🌡️', '🪥'];

const USERS = {
  Matu: { color: '#283593' },
  Vale: { color: '#880e4f' },
};

// Snapshot the hash before createClient() processes and clears it.
const initialHash = window.location.hash;

const supabaseClient = window.supabase.createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const DEFAULT_PLANTS = [
  {
    id: 'mandarin',
    name: 'Mandarin Tree',
    emoji: '🍊',
    dateAcquired: '',
    tasks: [
      { id: 'normal-water', recurrenceType: 'interval', frequencyDays: 2,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'refill-pot',   recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'fertilize',    recurrenceType: 'interval', frequencyDays: 14, weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'check',        recurrenceType: 'interval', frequencyDays: 3,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: 'Check leaf color, pests, and soil condition' },
    ],
    careLog: [],
  },
  {
    id: 'bougainvillea',
    name: 'Bougainvillea',
    emoji: '🌺',
    dateAcquired: '',
    tasks: [
      { id: 'normal-water', recurrenceType: 'interval', frequencyDays: 3,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'refill-pot',   recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'fertilize',    recurrenceType: 'interval', frequencyDays: 14, weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'check',        recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: 'Check for blooms and overall health' },
    ],
    careLog: [],
  },
];

// ============================================================
// STATE
// ============================================================

const state = {
  view: 'home',
  plantId: null,
  sheetMode: null,
  sheetData: {},
};

let plants = [];
let notes  = [];
let notesShowAll = new Set(); // plantIds where "Show all" is expanded
let editingNoteId = null;
let activeUser = null;
let activeTab = 'plants';
let activeFilter = []; // array of household member display_names — empty means show all (no filter)
let careLogFiltersOpen = false;
let careLogMode = 'tasks'; // 'tasks' | 'all'
let plantDetailTab = 'summary';
let careLogSegment = 'full';
let membersCache = []; // household_members rows: { id, display_name }
let currentMemberId = null;
let isSaving = false;
let householdId = null;
let userHouseholds = [];
let activityFeed = []; // merged care_log + notes, top 5 across all plants
let currentUserId = null;
let inRecovery = false;
let swRegistration = null;
let openedFromCaring = false;
let openedFromCareLog = false;
let sheetEntryTab = null;
let householdName = null;
let userTouchedArrivalDate = false;
let manageHouseholdsEditingName = false;

// ============================================================
// ACTIVE USER (auto-resolved from Supabase auth)
// ============================================================

async function routeAfterAuth() {
  if (inRecovery) return;
  await loadFromSupabase();

  // routeAfterAuth: if loadFromSupabase already rendered an auth error, bail
  if (!currentMemberId) return;

  const currentMember = membersCache.find(m => m.id === currentMemberId);
  if (!currentMember?.display_name) {
    renderNameCaptureScreen();
    return;
  }

  navigateTo('home');
  posthog.capture('tab_viewed', { tab: 'my_plants' });
}

function renderAuthErrorScreen(message) {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>Can't load household</h2>
      <p style="color:var(--text-muted);font-size:14px;text-align:center;line-height:1.5;max-width:320px;margin:0 auto;">${escapeHtml(message)}</p>
      <div class="user-select-buttons" style="margin-top:20px;">
        <button class="btn btn-primary" data-action="menu-sign-out" style="width:100%;padding:14px;font-size:15px;">Sign out</button>
      </div>
    </div>`;
}

function renderLoginScreen(errorMsg) {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>Plant Care</h2>
      <div class="user-select-buttons">
        <input class="form-input" type="email" id="login-email" placeholder="Email" autocomplete="email">
        <input class="form-input" type="password" id="login-password" placeholder="Password" autocomplete="current-password">
        <button class="btn btn-primary" data-action="login" style="width:100%;padding:16px;font-size:16px;">Sign In</button>
        ${errorMsg ? `<p style="color:var(--due);font-size:14px;text-align:center;margin:0;">${errorMsg}</p>` : ''}
      </div>
    </div>`;
  document.getElementById('app').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    renderLoginScreen(error.message);
    return;
  }
  await routeAfterAuth();
}

function renderPasswordResetScreen(errorMsg) {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>Set New Password</h2>
      <div class="user-select-buttons">
        <input class="form-input" type="password" id="reset-password" placeholder="New password" autocomplete="new-password">
        <input class="form-input" type="password" id="reset-password-confirm" placeholder="Confirm new password" autocomplete="new-password">
        <button class="btn btn-primary" data-action="save-new-password" style="width:100%;padding:16px;font-size:16px;">Save</button>
        ${errorMsg ? `<p style="color:var(--due);font-size:14px;text-align:center;margin:0;">${errorMsg}</p>` : ''}
      </div>
    </div>`;
  document.getElementById('app').addEventListener('keydown', e => {
    if (e.key === 'Enter') handlePasswordReset();
  });
}

async function handlePasswordReset() {
  const password = document.getElementById('reset-password').value;
  const confirm  = document.getElementById('reset-password-confirm').value;
  if (password.length < 6) {
    renderPasswordResetScreen('Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    renderPasswordResetScreen('Passwords do not match.');
    return;
  }
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) {
    renderPasswordResetScreen(error.message);
    return;
  }
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>Password Updated</h2>
      <p style="color:var(--text-muted);font-size:15px;text-align:center;">Your password has been updated. Redirecting to sign in…</p>
    </div>`;
  await supabaseClient.auth.signOut();
  inRecovery = false;
  setTimeout(renderLoginScreen, 2000);
}

function renderNameCaptureScreen() {
  document.getElementById('app').innerHTML = `
    <div class="name-capture-screen">
      <div class="app-header">
        <h1>Plant Care</h1>
      </div>
      <div class="name-capture-body">
        <div class="name-capture-emoji">🌿</div>
        <h2 class="name-capture-heading">What should we call you?</h2>
        <p class="name-capture-sub">This is how you'll appear to your household.</p>
        <input class="form-input" type="text" id="name-capture-input" placeholder="Your first name" autocomplete="given-name" maxlength="50">
        <button class="btn btn-primary name-capture-btn" id="name-capture-btn" data-action="save-name" disabled>Let's go</button>
      </div>
    </div>`;
  const input = document.getElementById('name-capture-input');
  const btn   = document.getElementById('name-capture-btn');
  input.addEventListener('input', () => {
    btn.disabled = input.value.trim().length === 0;
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleNameCapture();
  });
  input.focus();
}

async function handleNameCapture() {
  const input = document.getElementById('name-capture-input');
  const name  = input?.value?.trim();
  if (!name || !currentMemberId) return;

  const { error } = await supabaseClient
    .from('household_members')
    .update({ display_name: name })
    .eq('id', currentMemberId);

  if (error) return;

  const m = membersCache.find(m => m.id === currentMemberId);
  if (m) m.display_name = name;

  activeUser = name;
  navigateTo('home');
  posthog.capture('tab_viewed', { tab: 'my_plants' });
}

// ============================================================
// DATA PERSISTENCE
// ============================================================

function loadData() {
  try {
    const raw = localStorage.getItem('plant-care-v1');
    if (raw) {
      plants = JSON.parse(raw);
    } else {
      plants = JSON.parse(JSON.stringify(DEFAULT_PLANTS));
      saveData();
    }
  } catch (_) {
    plants = JSON.parse(JSON.stringify(DEFAULT_PLANTS));
  }
}

function saveData() {
  try {
    localStorage.setItem('plant-care-v1', JSON.stringify(plants));
  } catch (_) {}
}

async function loadFromSupabase() {
  // 1. Get the logged-in user
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;
  currentUserId = user.id;

  // 2. Resolve household_id from auth user — needed to scope subsequent queries
  const { data: userMemberRows } = await supabaseClient
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id);

  if (!userMemberRows || userMemberRows.length === 0) {
    renderAuthErrorScreen("Your account isn't associated with a household. Contact your household admin.");
    return;
  }

  const householdIds = userMemberRows.map(r => r.household_id);

  const { data: householdRows } = await supabaseClient
    .from('households')
    .select('id, name')
    .in('id', householdIds);

  userHouseholds = householdIds.map(id => ({
    id,
    name: householdRows?.find(h => h.id === id)?.name || 'Household'
  }));

  const validIds = userHouseholds.map(h => h.id);
  if (!householdId || !validIds.includes(householdId)) {
    householdId = userHouseholds[0].id;
  }

  // 3. Fetch all non-deleted plants, household_members, and household name in parallel
  const [{ data: plantRows }, { data: memberRows }, { data: householdRow }] = await Promise.all([
    supabaseClient
      .from('plants')
      .select('*')
      .eq('household_id', householdId)
      .is('deleted_at', null),
    supabaseClient
      .from('household_members')
      .select('id, display_name, color, user_id')
      .eq('household_id', householdId),
    supabaseClient
      .from('households')
      .select('name')
      .eq('id', householdId)
      .single(),
  ]);

  householdName = householdRow?.name ?? null;
  const headerNameEl = document.getElementById('header-household-name');
  if (headerNameEl) headerNameEl.textContent = householdName ?? 'My Household';

  if (!plantRows) return;

  // Cache members for write operations — must be set before any early return
  // so handleSaveNewPlant() always has a valid membersCache even with no plants.
  membersCache = memberRows ?? [];

  // Resolve current member from cache by user_id — replaces the legacy "Who are you" selector
  const meInCache = membersCache.find(m => m.user_id === currentUserId);
  if (!meInCache) {
    renderAuthErrorScreen("You aren't listed as a member of this household.");
    return;
  }
  currentMemberId = meInCache.id;
  activeUser = meInCache.display_name ?? '';

  if (plantRows.length === 0) {
    plants = [];
    notes  = [];
    activityFeed = [];
    const currentMember = membersCache.find(m => m.id === currentMemberId);
    if (currentUserId && currentMemberId && householdId && currentMember && householdName) {
      posthog.identify(currentUserId, {
        display_name:   currentMember.display_name,
        household_id:   householdId,
        household_name: householdName,
      });
    }
    return;
  }

  // Build a map from household_members.id → display_name for resolving task owners
  const ownerMap = {};
  for (const m of membersCache) {
    ownerMap[m.id] = m.display_name;
  }

  // 4. Fetch tasks, care log, and notes for all plants in parallel
  const plantIds = plantRows.map(p => p.id);
  const [taskResults, careLogResults, { data: noteRows, error: notesError }] = await Promise.all([
    Promise.all(
      plantRows.map(p =>
        supabaseClient
          .from('tasks')
          .select('*')
          .eq('plant_id', p.id)
          .is('deleted_at', null)
      )
    ),
    Promise.all(
      plantRows.map(p =>
        supabaseClient
          .from('care_log')
          .select('*')
          .eq('plant_id', p.id)
          .order('date', { ascending: false })
          .limit(50)
      )
    ),
    supabaseClient
      .from('notes')
      .select('*')
      .in('plant_id', plantIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  if (notesError) console.error('loadFromSupabase: notes fetch error:', notesError);
  notes = (noteRows ?? []).map(r => ({
    id:        r.id,
    plantId:   r.plant_id,
    memberId:  r.household_member_id,
    author:    ownerMap[r.household_member_id] ?? 'Unknown',
    note:      r.note,
    createdAt: r.created_at,
    taskId:    r.task_id ?? null,
    photoUrl:  r.photo_url ?? null,
  }));

  plants = plantRows.map((plantRow, i) => {
    const taskRows = taskResults[i].data ?? [];
    const tasks = taskRows.map(t => ({
      id:              t.id,
      recurrenceType:  t.recurrence?.type,
      frequencyDays:   t.recurrence?.every,
      recurrenceUnit:  t.recurrence?.unit  ?? 'days',
      weekdays:        t.recurrence?.days  ?? [],
      lastDone:        t.last_done         ?? null,
      nextDueOverride: t.next_due_override ?? null,
      paused:          t.paused            ?? false,
      owner:           ownerMap[t.owner_id] ?? '',
      note:            t.note              ?? '',
      name:            t.name,
      icon:            t.icon              ?? '',
      type:            t.type              ?? 'custom',
      ...(t.custom_name ? { customName: t.custom_name } : {}),
      ...(t.custom_icon ? { customIcon: t.custom_icon } : {}),
    }));

    const careLogRows = careLogResults[i].data ?? [];
    const careLog = careLogRows.map(r => ({
      id:        r.id,
      date:      r.date,
      createdAt: r.created_at,
      author:    ownerMap[r.household_member_id] ?? 'Unknown',
      taskId:    r.task_id,
      taskName:  r.task_name,
      taskType:  r.task_type,
    }));

    return {
      id:               plantRow.id,
      name:             plantRow.name,
      emoji:            plantRow.emoji            ?? '🪴',
      photoUrl:         plantRow.photo_url        ?? null,
      dateAcquired: plantRow.date_acquired ?? '',
      tasks,
      careLog,
    };
  });

  await loadActivityFeed();

  const currentMember = membersCache.find(m => m.id === currentMemberId);
  if (currentUserId && currentMemberId && householdId && currentMember && householdName) {
    posthog.identify(currentUserId, {
      display_name:   currentMember.display_name,
      household_id:   householdId,
      household_name: householdName,
    });
  }
}

async function loadActivityFeed() {
  if (!householdId || plants.length === 0) { activityFeed = []; return; }

  const plantIds = plants.map(p => p.id);
  const plantMap = Object.fromEntries(plants.map(p => [p.id, p]));
  const ownerMap = Object.fromEntries(membersCache.map(m => [m.id, m.display_name]));

  const [{ data: careRows }, { data: noteRows }] = await Promise.all([
    supabaseClient
      .from('care_log')
      .select('plant_id, task_name, task_type, household_member_id, created_at')
      .in('plant_id', plantIds)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseClient
      .from('notes')
      .select('plant_id, note, household_member_id, created_at, photo_url')
      .in('plant_id', plantIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const careItems = (careRows ?? []).map(r => ({
    type:      'care',
    sortKey:   r.created_at,
    plantId:   r.plant_id,
    plantName: plantMap[r.plant_id]?.name ?? '',
    taskName:  r.task_name,
    taskType:  r.task_type,
    member:    ownerMap[r.household_member_id] ?? '',
  }));

  const noteItems = (noteRows ?? []).map(r => ({
    type:      'note',
    sortKey:   r.created_at,
    plantId:   r.plant_id,
    plantName: plantMap[r.plant_id]?.name ?? '',
    note:      r.note,
    member:    ownerMap[r.household_member_id] ?? '',
    photoUrl:  r.photo_url ?? null,
  }));

  activityFeed = [...careItems, ...noteItems]
    .sort((a, b) => (b.sortKey ?? '').localeCompare(a.sortKey ?? ''))
    .slice(0, 15);
}

// ============================================================
// DATE UTILITIES
// ============================================================

function lastCareLabel(plant) {
  const entry = plant.careLog?.[0];
  if (!entry) return '';
  const dateStr = entry.date ?? (entry.createdAt ? entry.createdAt.split('T')[0] : null);
  if (!dateStr) return '';
  const diff = daysBetween(dateStr, todayStr());
  const when = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
  return `<div class="last-care-line">Last care: ${escapeHtml(entry.taskName)} · ${when}</div>`;
}

function todayStr() {
  return new Date().toLocaleDateString('en-CA');
}

// Returns b - a in whole days
function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / msPerDay);
}

// Formats an ISO timestamp as "2h ago", "Yesterday", "Mar 28", etc.
function formatActivityTime(isoStr) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  const diffMs = Date.now() - date.getTime();
  const diffMins  = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffMins < 60)  return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const entry = new Date(date); entry.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((today - entry) / 86400000);
  if (dayDiff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Returns the nearest upcoming date (today or future) matching one of the given weekday numbers (0=Sun)
function nextWeekdayOccurrence(days, skipToday = false) {
  if (!days || days.length === 0) return todayStr();
  const todayDow = new Date(todayStr() + 'T12:00:00').getDay();
  for (let d = skipToday ? 1 : 0; d <= 7; d++) {
    if (days.includes((todayDow + d) % 7)) return addDays(todayStr(), d);
  }
  return todayStr();
}

// Computes the next due date for a task (ignoring pause state)
function computeNextDue(task) {
  if (task.nextDueOverride) return task.nextDueOverride;
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') {
    // null = complete (never show as due); todayStr() = pending (always due until done)
    return task.lastDone ? null : todayStr();
  }
  if (recType === 'weekdays') {
    const skipToday = task.lastDone === todayStr();
    return nextWeekdayOccurrence(task.weekdays ?? [], skipToday);
  }
  if (!task.lastDone) return todayStr();
  return addDays(task.lastDone, task.frequencyDays);
}

// True if task has a recurrence occurrence on dateStr, projecting forward from its next due date.
// Used by the Caring tab Upcoming section to render every occurrence within the 7-day window.
function taskOccursOnDate(task, dateStr) {
  const recType = task.recurrenceType ?? 'interval';
  const first = computeNextDue(task);
  if (first === null) return false;
  if (recType === 'one-off') return first === dateStr;
  if (first === dateStr) return true;
  if (dateStr < first) return false;
  if (recType === 'weekdays') {
    const weekdays = task.weekdays ?? [];
    if (weekdays.length === 0) return false;
    const dow = new Date(dateStr + 'T12:00:00').getDay();
    return weekdays.includes(dow);
  }
  const interval = task.frequencyDays;
  if (!interval || interval <= 0) return false;
  return daysBetween(first, dateStr) % interval === 0;
}

// Positive = days remaining, 0 = due today, negative = overdue, Infinity = complete (one-off done)
function daysUntilDue(task) {
  const next = computeNextDue(task);
  if (next === null) return Infinity;
  return daysBetween(todayStr(), next);
}

function isDue(task) {
  if (task.paused) return false;
  if ((task.recurrenceType ?? 'interval') === 'weekdays' && task.lastDone === todayStr()) return false;
  return daysUntilDue(task) < 0;
}

function dueLabelAndClass(task) {
  const days = daysUntilDue(task);
  const manual = task.nextDueOverride ? ' (manual)' : '';
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') {
    if (days === Infinity) return { label: 'Done', cls: 'ok' };
    if (days > 0)  return { label: `In ${days} day${days !== 1 ? 's' : ''} \u2014 one-off`, cls: 'upcoming' };
    if (days === 0) return { label: 'Due today \u2014 one-off', cls: 'due' };
    return { label: 'Overdue \u2014 one-off', cls: 'due' };
  }
  // "never done" only makes sense for interval tasks with no override
  if (recType === 'interval' && !task.lastDone && !task.nextDueOverride) {
    return { label: 'Due today \u2014 never done', cls: 'due' };
  }
  if (days < 0)   return { label: `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue${manual}`, cls: 'due' };
  if (days === 0) return { label: `Due today${manual}`, cls: 'due' };
  if (days === 1) return { label: `Due tomorrow${manual}`, cls: 'soon' };
  if (days <= 3)  return { label: `In ${days} days${manual}`, cls: 'soon' };
  return { label: `In ${days} days${manual}`, cls: 'ok' };
}

function lastDoneLabel(task) {
  if (!task.lastDone) return 'Never done';
  const diff = daysBetween(task.lastDone, todayStr());
  if (diff === 0) return 'Done today';
  if (diff === 1) return 'Done yesterday';
  return `Done ${diff} days ago`;
}

function recurrenceLabel(task) {
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') return 'One-off';
  if (recType === 'weekdays') {
    const days = (task.weekdays ?? []).slice().sort((a, b) => a - b);
    if (days.length === 0) return 'No days set';
    return days.map(d => WEEKDAY_NAMES[d]).join(', ');
  }
  return `Every ${task.frequencyDays} day${task.frequencyDays !== 1 ? 's' : ''}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '\u2014';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatNoteDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Returns the ISO date string of the Monday of the week containing dateStr
function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const dow = d.getDay(); // 0=Sun, 1=Mon...
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

// ============================================================
// DATA HELPERS
// ============================================================

function getPlant(id) {
  return plants.find(p => p.id === id);
}

function getTask(plantId, taskId) {
  return getPlant(plantId)?.tasks.find(t => t.id === taskId);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Returns config for a task, falling back to task.customName/customIcon for custom tasks
function getTaskConfig(task) {
  if (TASK_CONFIG[task.id]) return TASK_CONFIG[task.id];
  return {
    name: task.name ?? task.customName ?? task.id,
    icon: task.icon ?? task.customIcon ?? '🌿',
    type: task.type ?? 'custom',
  };
}

// ============================================================
// ACTIONS
// ============================================================

async function markTaskDone(plantId, taskId) {
  if (isSaving) return;
  isSaving = true;
  try {
  const plant = getPlant(plantId);
  const task = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Capture pre-mark-done schedule so we can prompt to reschedule if the
  // completion is off the original due date. Skip one-off tasks entirely.
  const preRecType = task.recurrenceType ?? 'interval';
  const preDueDate = preRecType !== 'one-off' ? computeNextDue(task) : null;

  task.lastDone = todayStr();
  task.nextDueOverride = null; // clear any manual override when marking done

  const taskCfg = getTaskConfig(task);
  plant.careLog.unshift({
    id: uid(),
    date: todayStr(),
    createdAt: new Date().toISOString(),
    author: task.owner,
    taskId: task.id,
    taskName: taskCfg.name,
    taskType: taskCfg.type,
  });

  plant.careLog = plant.careLog.slice(0, 50);

  const member = membersCache.find(m => m.display_name === task.owner);
  await supabaseClient
    .from('tasks')
    .update({ last_done: todayStr(), next_due_override: null })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('markTaskDone task update error:', error); });
  await supabaseClient
    .from('care_log')
    .insert({
      plant_id:            plantId,
      task_id:             taskId,
      household_member_id: member?.id ?? null,
      task_name:           taskCfg.name,
      task_type:           taskCfg.type,
      date:                todayStr(),
    })
    .then(({ error }) => {
      if (error) { console.error('markTaskDone care_log insert error:', error); return; }
      posthog.capture('task_completed', {
        plant_id:  plantId,
        task_type: task.type,
        task_name: task.name,
      });
    });

  fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-care-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      care_log_id:  null,
      plant_name:   plant.name,
      task_name:    taskCfg.name,
      task_type:    taskCfg.type,
      actor_name:   activeUser,
      household_id: householdId,
    }),
  }).catch(() => {});

  loadActivityFeed().then(() => { if (state.view === 'home') renderHome(); });

  if (preDueDate) {
    const displacement = daysBetween(preDueDate, todayStr());
    const every = task.frequencyDays;
    const isExactIntervalMultiple = preRecType === 'interval' && every > 0 && displacement % every === 0;
    if (Math.abs(displacement) >= 1 && !isExactIntervalMultiple) {
      showReschedulePrompt(plantId, taskId, displacement, preDueDate);
    }
  }
  } finally {
    isSaving = false;
  }
}

async function undoMarkTaskDone(plantId, taskId) {
  const plant = getPlant(plantId);
  const task = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.lastDone = null;
  task.nextDueOverride = null;

  // Remove the most recent care log entry for this task (today's entry)
  const idx = plant.careLog.findIndex(e => e.taskId === taskId && e.date === todayStr());
  if (idx !== -1) plant.careLog.splice(idx, 1);

  await supabaseClient
    .from('tasks')
    .update({ last_done: null, next_due_override: null })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('undoMarkTaskDone task update error:', error); });
  await supabaseClient
    .from('care_log')
    .delete()
    .eq('plant_id', plantId)
    .eq('task_id', taskId)
    .eq('date', todayStr())
    .then(({ error }) => { if (error) console.error('undoMarkTaskDone care_log delete error:', error); });
}

async function reassignTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  task.owner = task.owner === 'Matu' ? 'Vale' : 'Matu';

  const member = membersCache.find(m => m.display_name === task.owner);
  await supabaseClient
    .from('tasks')
    .update({ owner_id: member?.id ?? null })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('reassignTask error:', error); });
}

async function skipTask(plantId, taskId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const plant = getPlant(plantId);
    const task  = plant?.tasks.find(t => t.id === taskId);
    if (!task) return;
    if ((task.recurrenceType ?? 'interval') === 'one-off') return;

    const today = todayStr();
    const every = task.frequencyDays;
    if (!every || every < 1) return;

    // Anchor = most recent due date ≤ today.
    let anchor;
    if (task.nextDueOverride) {
      anchor = task.nextDueOverride;
    } else if (!task.lastDone) {
      anchor = today;
    } else {
      anchor = task.lastDone;
      while (addDays(anchor, every) <= today) {
        anchor = addDays(anchor, every);
      }
    }
    const newOverride = addDays(anchor, every);

    const cfg = getTaskConfig(task);
    plant.careLog.unshift({
      id: uid(),
      date: today,
      createdAt: new Date().toISOString(),
      author: activeUser,
      taskId: task.id,
      taskName: cfg.name,
      taskType: 'skipped',
    });
    plant.careLog = plant.careLog.slice(0, 50);

    await updateTask(plantId, taskId, { nextDueOverride: newOverride });

    await supabaseClient
      .from('care_log')
      .insert({
        plant_id:            plantId,
        task_id:             taskId,
        household_member_id: currentMemberId,
        task_name:           cfg.name,
        task_type:           'skipped',
        date:                today,
      })
      .then(({ error }) => {
        if (error) { console.error('skipTask care_log insert error:', error); return; }
        posthog.capture('task_skipped', {
          plant_id:  plantId,
          task_type: task.type,
          task_name: task.name,
        });
      });

    loadActivityFeed();
  } finally {
    isSaving = false;
  }
}

async function updateTask(plantId, taskId, updates) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  Object.assign(task, updates);

  const dbUpdates = {};

  if ('lastDone'        in updates) dbUpdates.last_done         = updates.lastDone;
  if ('nextDueOverride' in updates) dbUpdates.next_due_override = updates.nextDueOverride;
  if ('paused'          in updates) dbUpdates.paused            = updates.paused;
  if ('note'            in updates) dbUpdates.note              = updates.note;
  if ('name'            in updates) dbUpdates.name              = updates.name;
  if ('icon'            in updates) dbUpdates.icon              = updates.icon;

  if ('owner' in updates) {
    const member = membersCache.find(m => m.display_name === updates.owner);
    dbUpdates.owner_id = member?.id ?? null;
  }

  const recurrenceFields = ['recurrenceType', 'frequencyDays', 'recurrenceUnit', 'weekdays'];
  if (recurrenceFields.some(f => f in updates)) {
    dbUpdates.recurrence = task.recurrenceType === 'one-off'
      ? { type: 'one-off' }
      : { type: task.recurrenceType, every: task.frequencyDays, unit: task.recurrenceUnit ?? 'days', days: task.weekdays ?? [] };
  }

  if (Object.keys(dbUpdates).length === 0) return;

  await supabaseClient
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('updateTask error:', error); });
}

async function pauseTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (task) { task.paused = true; }

  await supabaseClient
    .from('tasks')
    .update({ paused: true })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('pauseTask error:', error); });
}

async function resumeTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (task) { task.paused = false; }

  await supabaseClient
    .from('tasks')
    .update({ paused: false })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('resumeTask error:', error); });
}

async function deleteTask(plantId, taskId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const plant = getPlant(plantId);
    if (!plant) return;
    plant.tasks = plant.tasks.filter(t => t.id !== taskId);

    await supabaseClient
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId)
      .then(({ error }) => { if (error) console.error('deleteTask error:', error); });
  } finally {
    isSaving = false;
  }
}

async function deletePlant(plantId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const now = new Date().toISOString();

    await Promise.all([
      supabaseClient
        .from('plants')
        .update({ deleted_at: now })
        .eq('id', plantId)
        .then(({ error }) => { if (error) console.error('deletePlant plants error:', error); }),
      supabaseClient
        .from('tasks')
        .update({ deleted_at: now })
        .eq('plant_id', plantId)
        .is('deleted_at', null)
        .then(({ error }) => { if (error) console.error('deletePlant tasks error:', error); }),
    ]);

    plants = plants.filter(p => p.id !== plantId);
  } finally {
    isSaving = false;
  }
}

async function addNote(plantId, noteText, taskId, photoUrl = null) {
  if (isSaving) return null;
  isSaving = true;
  try {
    const member = membersCache.find(m => m.display_name === activeUser);
    const insertData = { plant_id: plantId, household_member_id: member?.id ?? null, note: noteText, task_id: taskId ?? null };
    if (photoUrl) insertData.photo_url = photoUrl;
    const { data: inserted, error } = await supabaseClient
      .from('notes')
      .insert(insertData)
      .select()
      .single();
    if (error) { console.error('addNote error:', error); return null; }
    const newNote = {
      id:        inserted.id,
      plantId:   inserted.plant_id,
      memberId:  inserted.household_member_id,
      author:    activeUser,
      note:      inserted.note,
      createdAt: inserted.created_at,
      taskId:    inserted.task_id ?? null,
      photoUrl:  inserted.photo_url ?? null,
    };
    notes.unshift(newNote);
    await loadActivityFeed();
    return newNote;
  } finally {
    isSaving = false;
  }
}

async function deleteNote(noteId) {
  if (isSaving) return;
  isSaving = true;
  try {
    const { data: photoRows, error: photoFetchErr } = await supabaseClient
      .from('plant_photos')
      .select('id, storage_url, note_id')
      .eq('note_id', noteId);
    if (photoFetchErr) console.error('deleteNote: plant_photos fetch error:', photoFetchErr);

    if (photoRows?.length) {
      for (const photoRow of photoRows) {
        await deletePlantPhoto(photoRow);
      }
    } else {
      const inMemNote = notes.find(n => n.id === noteId);
      if (inMemNote?.photoUrl) {
        const path = storagePathFromPublicUrl(inMemNote.photoUrl);
        if (path) {
          const { error: storageErr } = await supabaseClient.storage.from(PLANT_PHOTOS_BUCKET).remove([path]);
          if (storageErr) console.error('deleteNote storage cleanup error:', storageErr);
        }
      }
    }

    const { error } = await supabaseClient
      .from('notes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId);
    if (error) { console.error('deleteNote error:', error); return; }
    notes = notes.filter(n => n.id !== noteId);
  } finally {
    isSaving = false;
  }
}

async function updateNote(noteId, newText) {
  const { error } = await supabaseClient
    .from('notes')
    .update({ note: newText })
    .eq('id', noteId);
  if (error) { console.error('updateNote error:', error); return; }
  const n = notes.find(n => n.id === noteId);
  if (n) n.note = newText;
}

const PLANT_PHOTOS_BUCKET = 'plant-photos';
const PHOTO_CAP_PER_PLANT = 5;

function plantIconImgHtml(photoUrl, sizePx, radiusCss) {
  return `<img src="${escapeHtml(photoUrl)}" alt="" style="width:${sizePx}px;height:${sizePx}px;object-fit:cover;border-radius:${radiusCss};border:1.5px solid #c8c8c8;box-sizing:border-box;display:inline-block;vertical-align:middle;flex-shrink:0;" />`;
}

async function compressImage(file, maxDim = 1200, quality = 0.8) {
  const objUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error('Image load failed'));
      i.src = objUrl;
    });
    let { width, height } = img;
    if (width >= height && width > maxDim) {
      height = Math.round((height * maxDim) / width);
      width  = maxDim;
    } else if (height > maxDim) {
      width  = Math.round((width * maxDim) / height);
      height = maxDim;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d').drawImage(img, 0, 0, width, height);
    return await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

async function uploadPlantPhoto(blob, plantId) {
  const path = `${plantId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.jpg`;
  const { error } = await supabaseClient.storage
    .from(PLANT_PHOTOS_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  const { data } = supabaseClient.storage.from(PLANT_PHOTOS_BUCKET).getPublicUrl(path);
  return { publicUrl: data.publicUrl, path };
}

function storagePathFromPublicUrl(url) {
  if (!url) return null;
  const m = url.match(new RegExp(`/${PLANT_PHOTOS_BUCKET}/(.+)$`));
  return m ? m[1] : null;
}

async function countPlantPhotos(plantId) {
  const { count, error } = await supabaseClient
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('plant_id', plantId)
    .not('photo_url', 'is', null)
    .is('deleted_at', null);
  if (error) { console.error('countPlantPhotos error:', error); return 0; }
  return count ?? 0;
}

async function fetchLastPlantPhoto(plantId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) { console.error('fetchLastPlantPhoto error:', error); return null; }
  return data?.[0] ?? null;
}

async function fetchAllPlantPhotos(plantId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: false });
  if (error) { console.error('fetchAllPlantPhotos error:', error); return []; }
  return data ?? [];
}

async function deletePlantPhoto(photoRow) {
  const path = storagePathFromPublicUrl(photoRow.storage_url);
  if (path) {
    const { error: storageErr } = await supabaseClient.storage.from(PLANT_PHOTOS_BUCKET).remove([path]);
    if (storageErr) console.error('deletePlantPhoto storage error:', storageErr);
  }
  const { error: rowErr } = await supabaseClient.from('plant_photos').delete().eq('id', photoRow.id);
  if (rowErr) console.error('deletePlantPhoto row error:', rowErr);
  if (photoRow.note_id) {
    await supabaseClient.from('notes').update({ photo_url: null }).eq('id', photoRow.note_id);
    const note = notes.find(n => n.id === photoRow.note_id);
    if (note) note.photoUrl = null;
  }
}

async function deleteOldestPlantPhoto(plantId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('plant_id', plantId)
    .order('created_at', { ascending: true })
    .limit(1);
  if (error || !data?.[0]) return;
  await deletePlantPhoto(data[0]);
}

async function runSaveNoteFlow(plantId) {
  console.log('[saveNote] ENTER', { plantId, sheetData: state.sheetData, isSaving });
  const textEl = document.getElementById('sheet-note-text');
  const text = (textEl?.value ?? state.sheetData?.pendingText ?? '').trim();
  if (!text && !state.sheetData?.pendingPhoto) { alert('Please add a note or photo.'); return; }
  state.sheetData.pendingText = text;

  const pendingPhoto = state.sheetData?.pendingPhoto;
  console.log('[saveNote] pendingPhoto snapshot', {
    hasPhoto: !!pendingPhoto,
    blobSize: pendingPhoto?.blob?.size,
    blobType: pendingPhoto?.blob?.type,
    previewUrl: pendingPhoto?.previewUrl,
  });

  // Photo cap check before upload
  if (pendingPhoto) {
    const count = await countPlantPhotos(plantId);
    console.log('[saveNote] photo count for plant', { plantId, count });
    if (count >= PHOTO_CAP_PER_PLANT) {
      console.log('[saveNote] cap reached, switching to cap sheet');
      renderPhotoCapSheet(plantId);
      return;
    }
  }

  const saveBtn = document.querySelector('#sheet [data-action="sheet-save-note"]');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving…'; }

  try {
    let photoUrl = null;
    if (pendingPhoto) {
      console.log('[saveNote] uploading photo to storage…');
      const upRes = await uploadPlantPhoto(pendingPhoto.blob, plantId);
      photoUrl = upRes.publicUrl;
      console.log('[saveNote] upload OK', { path: upRes.path, publicUrl: photoUrl });
      posthog.capture('photo_added', { plant_id: plantId });
    } else {
      console.log('[saveNote] no photo — skipping upload');
    }

    console.log('[saveNote] inserting note row', { plantId, photoUrl });
    const newNote = await addNote(plantId, text, null, photoUrl);
    console.log('[saveNote] addNote returned', { newNote });
    if (!newNote) throw new Error('Note insert failed');
    posthog.capture('note_added', { plant_id: plantId, has_photo: !!photoUrl });

    if (photoUrl && newNote.id) {
      console.log('[saveNote] inserting plant_photos row', { plantId, noteId: newNote.id, photoUrl });
      const ppRes = await supabaseClient
        .from('plant_photos')
        .insert({ plant_id: plantId, note_id: newNote.id, storage_url: photoUrl });
      console.log('[saveNote] plant_photos insert response', ppRes);
    } else {
      console.log('[saveNote] skipping plant_photos insert', { photoUrl, newNoteId: newNote.id });
    }

    if (pendingPhoto?.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
    state.sheetData.pendingPhoto = null;
    state.sheetData.pendingText = '';

    closeSheet();
    if (state.view === 'home') {
      renderHome();
      showToast('Note added');
    } else if (state.view === 'plant' && plantDetailTab === 'tasks') {
      renderPlantDetail(plantId);
      showToast('Note added');
    } else {
      renderPlantDetail(plantId);
    }
    console.log('[saveNote] DONE');
  } catch (err) {
    console.error('[saveNote] FAILED', err);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Save'; }
    showToast('Could not save — tap Save to retry');
  }
}

function updatePlantInfo(plantId, updates) {
  const plant = getPlant(plantId);
  if (!plant) return;
  Object.assign(plant, updates);
}

// ============================================================
// TOAST
// ============================================================

function showToast(message, opts = {}) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.innerHTML = message;
  toast.classList.toggle('toast--interactive', !!opts.interactive);
  if (opts.data) {
    Object.assign(toast.dataset, opts.data);
  } else {
    delete toast.dataset.action;
    delete toast.dataset.plant;
    delete toast.dataset.task;
  }
  toast.classList.add('visible');
  clearTimeout(toast._hideTimeout);
  toast._hideTimeout = setTimeout(() => toast.classList.remove('visible'), opts.duration ?? 2500);
}

function showDoneToast(plantId, taskId, taskName) {
  showToast(
    `&#10003; ${escapeHtml(taskName)} done &middot; <span class="toast-link">Add a note?</span>`,
    { interactive: true, duration: 4000, data: { action: 'toast-add-note', plant: plantId, task: taskId } }
  );
}

function showUndoDoneToast(plantId, taskId, taskName, plantName) {
  showToast(
    `&#10003; ${escapeHtml(taskName)} &middot; ${escapeHtml(plantName)} &middot; <span class="toast-link">Undo</span>`,
    { interactive: true, duration: 4000, data: { action: 'caring-undo-done', plant: plantId, task: taskId } }
  );
}

// ============================================================
// PLANT EMOJI PICKER
// ============================================================

const EMOJI_CATEGORIES = {
  foliage: ['🌱','🪴','🌿','🍃','🎋','🎍','🌾','🍀','🌵','🌲','🌳','🌴','🫘'],
  flowers: ['🌸','🌺','🌻','🌹','🌷','💐','🪷','🌼'],
  edibles: ['🍊','🍋','🍇','🍓','🫐','🥦','🌶️','🧅','🧄','🍄','🥕','🍅','🌽','🥬'],
};
const PLANT_EMOJIS = [
  ...EMOJI_CATEGORIES.foliage,
  ...EMOJI_CATEGORIES.flowers,
  ...EMOJI_CATEGORIES.edibles,
];

function renderEmojiPickerHtml(currentEmoji) {
  const gridItems = PLANT_EMOJIS.map(e => {
    const sel = e === currentEmoji ? ' selected' : '';
    return `<div class="emoji-option${sel}" data-action="pick-plant-emoji" data-emoji="${e}">${e}</div>`;
  }).join('');
  const customVal = PLANT_EMOJIS.includes(currentEmoji) ? '' : (currentEmoji ?? '');
  return `
    <div class="emoji-picker-grid">${gridItems}</div>
    <div class="emoji-custom-row">
      <input type="text" class="form-input" id="sheet-plant-emoji" placeholder="Or paste custom emoji" autocomplete="off" value="${escapeHtml(customVal)}">
    </div>`;
}

// ============================================================
// ADD PLANT — THREE-STEP FLOW
// ============================================================

function renderAddPlantEmojiItems(emojis, selectedEmoji) {
  return emojis.map(e => {
    const sel = e === selectedEmoji ? ' selected' : '';
    return `<div class="emoji-option${sel}" data-action="pick-plant-emoji" data-emoji="${e}">${e}</div>`;
  }).join('');
}

function renderAddPlantProgressDots(currentStep) {
  return `<div class="add-plant-progress-dots">
    ${[1, 2, 3].map(s => {
      const cls = s < currentStep ? 'done' : s === currentStep ? 'active' : 'pending';
      return `<span class="add-plant-dot add-plant-dot--${cls}"></span>`;
    }).join('')}
  </div>`;
}

function renderAddPlantStep1Html(activeTab, selectedEmoji, pendingPhoto) {
  const emojis = activeTab === 'all' ? PLANT_EMOJIS : (EMOJI_CATEGORIES[activeTab] ?? PLANT_EMOJIS);
  const isEditFlow = state.sheetMode === 'edit-plant';
  const showPhotoUI = state.sheetMode === 'add-plant' || isEditFlow;
  const hasPhoto = showPhotoUI && !!pendingPhoto?.previewUrl;
  const grayedStyle = hasPhoto ? 'opacity:0.38;pointer-events:none;' : '';
  const gridGrayedStyle = hasPhoto ? 'opacity:0.38;pointer-events:none;filter:grayscale(1);' : '';
  const dividerGrayedStyle = hasPhoto ? 'opacity:0.38;' : '';

  const photoRowHtml = hasPhoto ? `
    <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e5e5e5;border-radius:10px;margin-top:12px;">
      <img src="${escapeHtml(pendingPhoto.previewUrl)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:1.5px solid #c8c8c8;flex-shrink:0;" />
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;">Photo added</div>
        <div style="color:#6b7280;font-size:13px;margin-top:2px;">This will be used as your plant icon</div>
      </div>
      <button type="button" data-action="add-plant-remove-photo" style="flex-shrink:0;padding:8px 12px;background:#fff5f5;border:0.5px solid #f0c0c0;color:#c0392b;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;">Remove</button>
    </div>` : `
    <div data-action="add-plant-pick-photo" style="display:flex;align-items:center;gap:12px;padding:12px;background:#eef5ee;border:1px solid #a8c4a8;border-radius:10px;margin-top:12px;cursor:pointer;">
      <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">📷</div>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;font-size:15px;">Add a photo instead</div>
        <div style="color:#6b7280;font-size:13px;margin-top:2px;">You can also do this later from the plant page</div>
      </div>
      <div style="flex-shrink:0;color:#9ca3af;font-size:20px;">›</div>
    </div>`;

  return `
    ${renderAddPlantProgressDots(1)}
    <div class="sheet-title">Pick an icon</div>
    <div class="add-plant-subtitle">Choose something that looks like yours</div>
    <div class="emoji-cat-tabs" style="${grayedStyle}">
      <button class="emoji-cat-tab${activeTab === 'all' ? ' active' : ''}" data-action="add-plant-tab" data-tab="all">All (35)</button>
      <button class="emoji-cat-tab${activeTab === 'foliage' ? ' active' : ''}" data-action="add-plant-tab" data-tab="foliage">🌿 Foliage</button>
      <button class="emoji-cat-tab${activeTab === 'flowers' ? ' active' : ''}" data-action="add-plant-tab" data-tab="flowers">🌸 Flowers</button>
      <button class="emoji-cat-tab${activeTab === 'edibles' ? ' active' : ''}" data-action="add-plant-tab" data-tab="edibles">🍋 Edibles</button>
    </div>
    <div class="add-plant-emoji-grid" id="add-plant-emoji-grid" style="${gridGrayedStyle}">
      ${renderAddPlantEmojiItems(emojis, selectedEmoji)}
    </div>
    ${showPhotoUI ? `
    <div style="display:flex;align-items:center;gap:10px;margin-top:14px;color:#9ca3af;font-size:13px;${dividerGrayedStyle}">
      <div style="flex:1;height:1px;background:#e5e5e5;"></div>
      <div>none of these look like yours?</div>
      <div style="flex:1;height:1px;background:#e5e5e5;"></div>
    </div>
    ${photoRowHtml}
    <input type="file" id="add-plant-file-input" accept="image/*" hidden />` : ''}
    ${isEditFlow ? `
    <div class="sheet-actions" style="margin-top:16px;display:flex;gap:8px;">
      <button class="btn btn-ghost" data-action="edit-plant-change-cancel" style="flex:1;">Cancel</button>
      <button class="btn btn-primary" data-action="add-plant-next" style="flex:1;">Done</button>
    </div>` : `
    <div class="sheet-actions" style="margin-top:16px;display:flex;gap:8px;">
      <button class="btn btn-ghost" data-action="sheet-cancel" style="flex:1;">Cancel</button>
      <button class="btn btn-primary" data-action="add-plant-next" style="flex:1;">Next →</button>
    </div>`}`;
}

function renderAddPlantStep2Html(selectedEmoji) {
  return `
    ${renderAddPlantProgressDots(2)}
    <div class="add-plant-step-emoji-tile">${escapeHtml(selectedEmoji)}</div>
    <div class="add-plant-step-heading">Give it a name</div>
    <div class="add-plant-step-subtext">You can always change this later</div>
    <div class="ap2-field-label">Name</div>
    <input type="text" class="form-input" id="sheet-plant-name" placeholder="e.g. Monstera" autocomplete="off">
    <div class="ap2-input-hint">My green one, The big one…</div>
    <div id="add-plant-duplicate-nudge" class="duplicate-nudge" style="display:none;margin-bottom:12px;"></div>
    <div class="sheet-actions" style="margin-top:16px;">
      <button class="btn btn-primary" data-action="add-plant-to-step3" id="ap2-next-btn" style="flex:1;opacity:0.4;" disabled>Next →</button>
    </div>
    <button class="add-plant-back-link" data-action="add-plant-back">← Back</button>`;
}

function renderAddPlantStep3Html(selectedEmoji, plantName) {
  const curYear = new Date().getFullYear();
  return `
    ${renderAddPlantProgressDots(3)}
    <div class="add-plant-step-emoji-tile">${escapeHtml(selectedEmoji)}</div>
    <div class="add-plant-step-heading">When did ${escapeHtml(plantName || '')} arrive home?</div>
    <div class="add-plant-step-subtext">We'll show you how long you've cared for it.</div>
    <div class="ap3-arrival-card" id="ap3-arrival-card">
      <div class="ap3-arrival-top-row">
        <span class="ap3-arrival-card-icon">📅</span>
        <div>
          <div class="ap3-arrival-card-title">Arrival date</div>
          <div class="ap3-arrival-card-optional">Optional — you can skip this</div>
        </div>
      </div>
      ${renderDateSelectHtml('arrival', null, 2000, curYear)}
    </div>
    <div class="sheet-actions" style="margin-top:auto;">
      <button class="btn btn-primary" data-action="sheet-save-new-plant" style="flex:1;">Add ${escapeHtml(plantName || '')}</button>
    </div>
    <button class="add-plant-back-link" data-action="add-plant-back">← Back</button>`;
}

function attachAddPlantNameListener() {
  const nameInput = document.getElementById('sheet-plant-name');
  if (!nameInput) return;

  // B19: lift sheet above iOS software keyboard
  if (window.visualViewport) {
    const sheet = document.getElementById('sheet');
    let vvListener = null;

    function onVVResize() {
      const vv = window.visualViewport;
      const kh = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      if (sheet) sheet.style.transform = kh > 0 ? `translateY(-${kh}px)` : '';
    }

    nameInput.addEventListener('focus', () => {
      vvListener = onVVResize;
      window.visualViewport.addEventListener('resize', vvListener);
      onVVResize();
    });

    nameInput.addEventListener('blur', () => {
      if (vvListener) {
        window.visualViewport.removeEventListener('resize', vvListener);
        vvListener = null;
      }
      if (sheet) sheet.style.transform = '';
    });
  }

  nameInput.addEventListener('input', function() {
    const val = this.value.trim();
    const nudge = document.getElementById('add-plant-duplicate-nudge');
    if (!nudge) return;
    const isDuplicate = val && plants.some(p => p.name.toLowerCase() === val.toLowerCase());
    if (isDuplicate) {
      nudge.style.display = '';
      nudge.innerHTML = `
        <div class="duplicate-nudge-title">You already have a ${escapeHtml(val)}</div>
        <div class="duplicate-nudge-body">Give this one a different name so you can tell them apart — or skip and we'll call it '${escapeHtml(val)} 2'.</div>
        <input type="text" class="form-input" id="sheet-plant-alt-name" placeholder="Alternative name…" autocomplete="off" style="margin-top:8px;">`;
    } else {
      nudge.style.display = 'none';
      nudge.innerHTML = '';
    }
  });
}

function attachAddPlantStep2State() {
  const nameInput = document.getElementById('sheet-plant-name');
  const nextBtn   = document.getElementById('ap2-next-btn');
  if (!nameInput || !nextBtn) return;
  function update() {
    const empty = nameInput.value.trim().length === 0;
    nextBtn.disabled     = empty;
    nextBtn.style.opacity = empty ? '0.4' : '1';
  }
  nameInput.addEventListener('input', update);
  update();
}

function relativeArrivalLabel(dateStr) {
  const today   = new Date(todayStr() + 'T12:00:00');
  const arrived = new Date(dateStr + 'T12:00:00');
  const days    = Math.round((today - arrived) / 86400000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 14)  return 'About a week ago';
  if (days < 30)  return `${Math.round(days / 7)} weeks ago`;
  if (days < 60)  return 'About a month ago';
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  if (days < 730) return 'About a year ago';
  return `About ${Math.round(days / 365)} years ago`;
}

function attachAddPlantStep3Listener() {
  const input = document.getElementById('sheet-acquired-date');
  if (!input) return;

  // Set max once at init — outside any handler to avoid spurious change events.
  input.max = todayStr();

  let userPickedDate = false;

  function openPicker() {
    userPickedDate = true;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  }

  document.getElementById('ap3-arrival-set-btn')?.addEventListener('click', e => { e.preventDefault(); openPicker(); });
  // Entire confirmed-state row is tappable (Bug 2).
  document.getElementById('ap3-arrival-after')?.addEventListener('click',   e => { e.preventDefault(); openPicker(); });

  input.addEventListener('change', function() {
    if (!userPickedDate) return;
    if (!this.value) return;
    const date      = new Date(this.value + 'T12:00:00');
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const card   = document.getElementById('ap3-arrival-card');
    const before = document.getElementById('ap3-arrival-before');
    const after  = document.getElementById('ap3-arrival-after');
    if (card)   card.classList.add('has-date');
    if (before) before.style.display = 'none';
    if (after)  after.style.display  = 'flex';

    const arrivedLabel    = document.getElementById('ap3-arrived-label');
    const arrivedRelative = document.getElementById('ap3-arrived-relative');
    if (arrivedLabel)    arrivedLabel.textContent    = `Arrived ${formatted}`;
    if (arrivedRelative) arrivedRelative.textContent = relativeArrivalLabel(this.value);
  });
}

// ============================================================
// RENDER: HOME
// ============================================================

const FEEDBACK_BUBBLE_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;

function renderHeaderRight() {
  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();
  return `
    <div class="header-right">
      <button class="header-flag-btn" data-action="feedback" aria-label="Report a bug">🚩</button>
      <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
    </div>`;
}

function renderHomeDueToday() {
  const allItems = [];
  for (const plant of plants) {
    for (const task of plant.tasks) {
      if (task.paused) continue;
      if (!matchesFilter(task.owner)) continue;
      const days = daysUntilDue(task);
      if (days === 0) {
        allItems.push({ plant, task, days, overdue: false });
      } else if (days < 0) {
        allItems.push({ plant, task, days, overdue: true });
      }
    }
  }
  if (allItems.length === 0) {
    // Congrats state: show if any plants were cared for today
    const caredNames = [];
    const caredSeen = new Set();
    for (const plant of plants) {
      if (!caredSeen.has(plant.id) && plant.careLog.some(e => e.date === todayStr())) {
        caredNames.push(plant.name);
        caredSeen.add(plant.id);
      }
    }
    if (caredNames.length === 0) return '';
    const plantNamesHtml = caredNames.map(n => escapeHtml(n)).join(' · ');
    return `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#2e7d32;"></div>
    <span class="home-section-header-text" style="color:#2e7d32;">Needs Attention Today</span>
  </div>
  <div class="home-activity-feed">
    <div class="needs-attention-list">
      <div class="attention-done-row">
        <span class="attention-done-tile">🏆</span>
        <span class="home-due-today-info">
          <span style="font-size:13px;font-weight:500;color:#2e7d32;">All done for today!</span>
          <span style="font-size:11px;color:#5a8c58;">${plantNamesHtml}</span>
        </span>
      </div>
    </div>
  </div>`;
  }

  // Sort: overdue first (most days late = most negative = first), then due today
  allItems.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
    return a.days - b.days;
  });

  let html = `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#e24b4a;"></div>
    <span class="home-section-header-text">Needs Attention Today</span>
  </div>`;

  html += `<div class="home-activity-feed"><div class="needs-attention-list">`;

  for (const { plant, task, days, overdue } of allItems) {
    const cfg = getTaskConfig(task);
    const ownerMember = membersCache.find(m => m.display_name === task.owner);
    const ownerColor = ownerMember?.color ?? '#888';
    const ownerInitial = (task.owner ?? '?')[0].toUpperCase();
    const daysLate = Math.abs(days);
    const urgencyRowCls = overdue ? 'attention-row--overdue' : 'attention-row--duetoday';
    const subtitleHtml = overdue
      ? `<span style="color:#c0392b;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)} · ${daysLate} day${daysLate !== 1 ? 's' : ''} late</span>`
      : `<span style="color:#b07a2a;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)} · due today</span>`;
    const rowAction = overdue ? 'caring-overdue-row-tap' : 'caring-open-edit-task';

    html += `<div class="activity-row home-due-today-row attention-row ${urgencyRowCls}" data-action="${rowAction}" data-plant="${plant.id}" data-task="${task.id}">
      ${plant.photoUrl
        ? plantIconImgHtml(plant.photoUrl, 26, '8px')
        : `<span style="width:26px;height:26px;border-radius:8px;background:#eef2ee;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;line-height:1;">${plant.emoji}</span>`}
      <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
      <span class="activity-icon">${cfg.icon}</span>
      <span class="home-due-today-info">
        <span class="home-due-today-task">${escapeHtml(cfg.name)}</span>
        ${subtitleHtml}
      </span>
      <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px;">${escapeHtml(ownerInitial)}</span>
      <button class="attention-check-circle" data-action="home-mark-done" data-plant="${plant.id}" data-task="${task.id}" aria-label="Mark done">
        <span class="attention-check-icon">✓</span>
      </button>
    </div>`;
  }

  html += `</div></div>`;
  return html;
}

function renderCaringDoneToday() {
  const today = todayStr();
  const doneItems = [];
  for (const plant of plants) {
    for (const task of plant.tasks) {
      if (task.paused) continue;
      if (!matchesFilter(task.owner)) continue;
      if (task.lastDone === today) doneItems.push({ plant, task });
    }
  }
  if (doneItems.length === 0) return '';

  doneItems.reverse();
  doneItems.sort((a, b) => {
    const aTime = a.plant.careLog.find(e => e.taskId === a.task.id && e.date === today)?.createdAt ?? '';
    const bTime = b.plant.careLog.find(e => e.taskId === b.task.id && e.date === today)?.createdAt ?? '';
    return bTime.localeCompare(aTime);
  });

  let html = `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#2e7d51;"></div>
    <span class="home-section-header-text">Done today</span>
  </div>
  <div class="home-activity-feed"><div class="needs-attention-list">`;

  for (const { plant, task } of doneItems) {
    const cfg = getTaskConfig(task);
    const ownerMember  = membersCache.find(m => m.display_name === task.owner);
    const ownerColor   = ownerMember?.color ?? '#888';
    const ownerInitial = (task.owner ?? '?')[0].toUpperCase();
    html += `<div class="activity-row home-due-today-row attention-row" data-action="caring-open-edit-task" data-plant="${plant.id}" data-task="${task.id}" style="background:#fff;border-color:#e8ece6;">
      <span style="width:26px;height:26px;border-radius:8px;background:#eaf3de;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;line-height:1;">${plant.emoji}</span>
      <span style="width:1px;height:28px;background:#c0dd97;flex-shrink:0;"></span>
      <span style="width:26px;height:26px;border-radius:8px;background:#eaf3de;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:15px;line-height:1;">${cfg.icon}</span>
      <span class="home-due-today-info">
        <span class="home-due-today-task" style="text-decoration:line-through;text-decoration-color:#aab09f;color:#6b7c61;">${escapeHtml(cfg.name)}</span>
        <span style="color:#8a9180;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)} · ${escapeHtml(task.owner ?? '')}</span>
      </span>
      <button data-action="add-note" data-plant="${plant.id}" style="width:26px;height:26px;border-radius:50%;border:0.5px solid #dde0d9;background:#f4f6f2;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;padding:0;" aria-label="Add note"><svg viewBox="0 0 16 16" fill="none" stroke="#8a9180" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg></button>
      <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:#fff;font-size:11px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInitial)}</span>
      <button data-action="caring-undo-done" data-plant="${plant.id}" data-task="${task.id}" style="width:26px;height:26px;border-radius:50%;border:none;background:#3b6d11;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;cursor:pointer;padding:0;" aria-label="Undo">✓</button>
    </div>`;
  }

  html += `</div></div>`;
  return html;
}

function renderHomeActivityFeed() {
  if (activityFeed.length === 0) {
    if (plants.length === 0) return '';
    return `
  <div class="home-section-header">
    <div class="home-section-header-accent" style="background:var(--primary);"></div>
    <span class="home-section-header-text">Recent activity</span>
    <button class="summary-view-all-link" style="margin-left:auto;" data-action="open-household-activity">View more</button>
  </div>
  <div class="home-activity-feed"><div class="activity-list">
    <div class="activity-row activity-row--home">
      <span class="activity-icon" style="opacity:0.3;">💧</span>
      <span class="activity-text" style="color:#bbb;">Care actions will appear here</span>
    </div>
  </div></div>`;
  }

  let html = `
  <div class="home-section-header">
    <div class="home-section-header-accent" style="background:var(--primary);"></div>
    <span class="home-section-header-text">Recent activity</span>
    <button class="summary-view-all-link" style="margin-left:auto;" data-action="open-household-activity">View more</button>
  </div>
  <div class="home-activity-feed"><div class="activity-list">`;

  for (const item of activityFeed.slice(0, 3)) {
    const time = formatActivityTime(item.sortKey);
    if (item.type === 'care') {
      const isSkipped = item.taskType === 'skipped';
      const verb = CARE_VERB[item.taskType];
      const icon = CARE_ICON[item.taskType] ?? '🌿';
      const text = isSkipped
        ? `${escapeHtml(item.member)} skipped ${escapeHtml(item.taskName)}`
        : verb
          ? `${escapeHtml(item.member)} ${escapeHtml(verb)} ${escapeHtml(item.plantName)}`
          : `${escapeHtml(item.member)} · ${escapeHtml(item.taskName)} — ${escapeHtml(item.plantName)}`;
      html += `
      <div class="activity-row activity-row--home${isSkipped ? ' activity-row-skipped' : ''}">
        <span class="activity-icon${isSkipped ? ' activity-icon-skipped' : ''}">${icon}</span>
        <span class="activity-text">${text}</span>
        <span class="activity-time">${time}</span>
      </div>`;
    } else {
      const thumbHtml = item.photoUrl
        ? `<span class="care-log-thumb"><img class="activity-thumb-inline" src="${escapeHtml(item.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(item.photoUrl)}" /></span>`
        : '';
      html += `
      <div class="activity-row activity-row--home">
        <span class="activity-icon">💬</span>
        <span class="activity-text">${escapeHtml(item.member)} · <span class="activity-note-preview">${escapeHtml(item.note)}</span> — ${escapeHtml(item.plantName)}</span>
        ${thumbHtml}
        <span class="activity-time">${time}</span>
      </div>`;
    }
  }

  html += `</div></div>`;
  return html;
}

function shouldShowPushBanner() {
  if (shouldShowOnboardingBanner()) return false;
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'denied') return false;
  return !localStorage.getItem(`push_accepted_${activeUser}`);
}

// ============================================================
// ONBOARDING
// ============================================================

function getOnboardingStep() {
  if (!currentMemberId) return null;
  const stored = localStorage.getItem(`onboarding_step_${currentMemberId}`);
  if (stored) return parseInt(stored, 10);
  localStorage.setItem(`onboarding_step_${currentMemberId}`, '1');
  return 1;
}

function setOnboardingStep(step) {
  if (!currentMemberId) return;
  localStorage.setItem(`onboarding_step_${currentMemberId}`, String(step));
}

function getOnboardingPlantId() {
  return currentMemberId ? localStorage.getItem(`onboarding_plant_id_${currentMemberId}`) : null;
}

function setOnboardingPlantId(id) {
  if (!currentMemberId) return;
  localStorage.setItem(`onboarding_plant_id_${currentMemberId}`, id);
}

function getOnboardingTaskId() {
  return currentMemberId ? localStorage.getItem(`onboarding_task_id_${currentMemberId}`) : null;
}

function setOnboardingTaskId(id) {
  if (!currentMemberId) return;
  localStorage.setItem(`onboarding_task_id_${currentMemberId}`, id);
}

function renderOnboardingInlineTaskCard() {
  const onboardingPlantId = getOnboardingPlantId();
  const onboardingTaskId  = getOnboardingTaskId();
  if (!onboardingPlantId || !onboardingTaskId) return '';

  return `
    <div style="padding:0 16px;margin-top:12px;">
      <div style="background:#f4faf4;border:1.5px solid #3a6b3a;border-radius:12px;padding:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:20px;">💧</span>
          <div>
            <div style="font-size:14px;font-weight:500;color:#1a1a1a;">First watering</div>
            <div style="font-size:12px;color:#888;">One-off · Due today</div>
          </div>
        </div>
        <button class="btn btn-primary" style="width:100%;" data-action="mark-done" data-plant="${onboardingPlantId}" data-task="${onboardingTaskId}">&#10003; Done</button>
      </div>
    </div>`;
}

function shouldShowOnboardingBanner() {
  if (localStorage.getItem('onboarding_coordination_shown')) return false;
  const step = getOnboardingStep();
  return step !== null && step < 4;
}

function renderOnboardingBanner() {
  const step = getOnboardingStep();
  if (!step || step >= 4) return '';

  const onboardingPlantId = getOnboardingPlantId();
  const onboardingPlant = plants.find(p => p.id === onboardingPlantId);
  const ctaStyle = 'width:100%;padding:10px 12px;font-size:13px;font-weight:500;background:#3a6b3a;color:#fff;border:none;border-radius:8px;cursor:pointer;text-align:center;-webkit-tap-highlight-color:transparent;';

  let instruction, ctaHtml;
  if (step === 1) {
    instruction = 'Add your first plant to get started.';
    ctaHtml = `<button style="${ctaStyle}" data-action="add-plant">+ Add Plant</button>`;
  } else if (step === 2) {
    instruction = 'Create your first task.';
    ctaHtml = `<button style="${ctaStyle}" data-action="onboarding-open-plant" data-plant="${onboardingPlantId ?? ''}">Create your first task →</button>`;
  } else {
    instruction = 'Tap ✓ Done below to complete your setup ↓';
    ctaHtml = '';
  }

  return `
    <div class="onboarding-banner">
      <div class="onboarding-banner-top">
        <span class="onboarding-label">Get started</span>
        <span style="font-size:11px;font-weight:500;color:#3a6b3a;">Step ${step} of 3</span>
      </div>
      <p class="onboarding-instruction" style="margin-bottom:${ctaHtml ? '8px' : '0'};">${instruction}</p>
      ${ctaHtml}
    </div>`;
}

function renderHome() {
  if (document.querySelector('.onboarding-complete-overlay')) return;

  let html = `
    <div class="app-header app-header--home">
      <button class="household-pill" data-action="toggle-household-switcher" aria-expanded="false">
        <span id="header-household-name" class="header-household-name">${escapeHtml(householdName ?? 'My Household')}</span>
        <span class="header-chevron" aria-hidden="true">▾</span>
      </button>
      ${renderHeaderRight()}
      <div class="household-switcher" id="household-switcher" role="menu">
        <div class="household-switcher-inner">
          <div class="household-switcher-label">Your households</div>
          ${userHouseholds.map(h => {
            const isActive   = h.id === householdId;
            const showCheck  = isActive && userHouseholds.length > 1;
            const actionAttr = isActive ? '' : ` data-action="switch-household" data-household-id="${h.id}"`;
            return `<button class="household-switcher-item${isActive ? ' is-active' : ''}"${actionAttr}>
            <span class="household-switcher-item-name">${escapeHtml(h.name)}</span>
            ${showCheck ? '<span class="household-switcher-check">✓</span>' : ''}
          </button>`;
          }).join('')}
          <div class="household-switcher-divider"></div>
          <button class="household-switcher-manage" data-action="open-manage-households">
            <span class="household-switcher-manage-icon" aria-hidden="true">⚙️</span>
            <span class="household-switcher-manage-label">Manage households</span>
          </button>
        </div>
      </div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn${activeTab === 'plants' ? ' active' : ''}" data-action="switch-tab" data-tab="plants">&#127807; My Plants</button>
      <button class="tab-btn${activeTab === 'schedule' ? ' active' : ''}" data-action="switch-tab" data-tab="schedule">&#9989; Caring</button>
    </div>`;

  if (activeTab === 'plants') {
    if (shouldShowOnboardingBanner()) html += renderOnboardingBanner();

    if (getOnboardingStep() === 3) html += renderOnboardingInlineTaskCard();

    if (shouldShowPushBanner()) {
      html += `
    <div class="push-banner">
      <span class="push-banner-text">Enable notifications to stay in sync with your household</span>
      <button class="push-banner-btn" data-action="enable-notifications">Enable</button>
    </div>`;
    }

    html += renderHomeActivityFeed();

    if (plants.length === 0) {
      html += `
    <div class="plants-empty-state">
      <span class="empty-emoji">🌱</span>
      <h2>Your plants live here</h2>
      <p>Add your first plant to start tracking its care.</p>
    </div>`;
    }

    html += '<div class="plants-list">';

    // Smart sort: overdue plants first (most overdue at top), then due-today
    // (most due-today tasks first), then all-good in original order. If no plant
    // is overdue or due-today, skip the sort and keep the existing order.
    const classifiedPlants = plants.map((plant, idx) => {
      let minDays = Infinity;      // most-negative daysUntilDue across tasks
      let dueTodayCount = 0;
      for (const task of plant.tasks) {
        if (task.paused) continue;
        const d = daysUntilDue(task);
        if (d === Infinity) continue;
        if (d < minDays) minDays = d;
        if (d === 0) dueTodayCount++;
      }
      let group;
      if (minDays < 0) group = 1;
      else if (dueTodayCount > 0) group = 2;
      else group = 3;
      return { plant, idx, group, minDays, dueTodayCount };
    });
    const needsSort = classifiedPlants.some(c => c.group === 1 || c.group === 2);
    const plantsOrdered = needsSort
      ? classifiedPlants
          .slice()
          .sort((a, b) => {
            if (a.group !== b.group) return a.group - b.group;
            if (a.group === 1) return a.minDays - b.minDays; // most overdue (most negative) first
            if (a.group === 2) return b.dueTodayCount - a.dueTodayCount; // most due-today first
            return a.idx - b.idx; // group 3: preserve original order
          })
          .map(c => c.plant)
      : plants;

    for (const plant of plantsOrdered) {
      // Collect urgent tasks split by state so pills + task badges can tint consistently.
      const overdueTasks  = [];
      const dueTodayTasks = [];
      for (const task of plant.tasks) {
        if (task.paused) continue;
        const d = daysUntilDue(task);
        if (d === Infinity) continue;
        if (d < 0)        overdueTasks.push(task);
        else if (d === 0) dueTodayTasks.push(task);
      }

      const suppressOnboarding = getOnboardingStep() === 3 && plant.id === getOnboardingPlantId();

      let dueBadgeHtml = '';
      if (suppressOnboarding) {
        dueBadgeHtml = '';
      } else if (plant.tasks.length === 0) {
        dueBadgeHtml = '';
      } else if (overdueTasks.length > 0 || dueTodayTasks.length > 0) {
        const parts = [];
        if (overdueTasks.length > 0)  parts.push(`<span class="pill-overdue">${overdueTasks.length} overdue</span>`);
        if (dueTodayTasks.length > 0) parts.push(`<span class="pill-duetoday">${dueTodayTasks.length} due today</span>`);
        dueBadgeHtml = `<div class="plant-card-pill-stack">${parts.join('')}</div>`;
      } else {
        dueBadgeHtml = `<span class="all-good-badge">&#10003; All good</span>`;
      }

      const dueTasks = [...overdueTasks, ...dueTodayTasks];
      const suppressPills = suppressOnboarding;

      // Task icon tiles: cap at 4, then a "+N" overflow tile if there are more.
      let taskIconsHtml = '';
      if (!suppressPills && dueTasks.length > 0) {
        const MAX_ICONS = 4;
        const shown = dueTasks.slice(0, MAX_ICONS);
        const extra = dueTasks.length - MAX_ICONS;
        const iconTiles = shown.map(t => {
          const cfg = getTaskConfig(t);
          return `<span class="plant-card-task-icon">${cfg.icon}</span>`;
        }).join('');
        const overflowTile = extra > 0
          ? `<span class="plant-card-task-icon plant-card-task-icon--overflow" aria-label="${extra} more">+${extra}</span>`
          : '';
        taskIconsHtml = `<div class="plant-card-task-icons">${iconTiles}${overflowTile}</div>`;
      }

      html += `
    <div class="plant-card" data-action="open-plant" data-plant="${plant.id}">
      <div class="plant-card-row">
        ${plant.photoUrl
          ? `<span class="plant-card-emoji">${plantIconImgHtml(plant.photoUrl, 36, '8px')}</span>`
          : `<span class="plant-card-emoji">${plant.emoji}</span>`}
        <div class="plant-card-meta">
          <div class="plant-card-name">${escapeHtml(plant.name)}</div>
          ${overdueTasks.length === 0 && dueTodayTasks.length === 0 ? lastCareLabel(plant) : ''}
          ${taskIconsHtml}
        </div>
        <div class="plant-card-right">
          ${dueBadgeHtml}
        </div>
      </div>
    </div>`;
    }

    html += '</div>';

    if (plants.length > 0) {
      html += `<button class="fab-add-plant" data-action="add-plant">&#43; Add Plant</button>`;
    }

    html += `<div id="dev-build-ts" style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:4px;opacity:0.6;">Built: ${typeof __BUILD_TIME__ !== 'undefined' ? new Date(__BUILD_TIME__).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : 'dev'}</div>`;
  } else {
    html += renderUserFilterPills();
    html += renderSchedule();
  }

  const showCoachMark = localStorage.getItem(`onboarding_show_coachmark_${currentMemberId}`);
  localStorage.removeItem(`onboarding_show_coachmark_${currentMemberId}`);

  document.getElementById('app').innerHTML = html;

  attachDevToolsTrigger(); // DEV TOOLS — remove before public launch

  if (showCoachMark) {
    setTimeout(() => renderCoachMark(), 50);
  }
}

function renderCoachMark() {
  const currentMember = membersCache.find(m => m.id === currentMemberId);
  const displayName   = currentMember?.display_name ?? activeUser ?? 'You';
  const onboardingPlant = plants.find(p => p.id === getOnboardingPlantId());
  const plantName     = onboardingPlant?.name ?? 'your plant';

  const body = "Every care action appears here in real time. No more guessing who did what — your whole household stays in sync automatically.";

  const appRect = document.getElementById('app').getBoundingClientRect();

  // Layer 1 — dark backdrop
  const darkEl = document.createElement('div');
  darkEl.id = 'coachmark-dark';
  darkEl.className = 'coach-overlay';
  darkEl.style.position = 'fixed';
  darkEl.style.top      = appRect.top + 'px';
  darkEl.style.left     = appRect.left + 'px';
  darkEl.style.width    = appRect.width + 'px';
  darkEl.style.height   = appRect.height + 'px';
  darkEl.style.background = 'rgba(0,0,0,0.55)';
  darkEl.style.zIndex   = '20';

  // Layer 2 — coach block
  const blockEl = document.createElement('div');
  blockEl.id = 'coachmark-block';
  blockEl.style.position  = 'fixed';
  blockEl.style.top       = (appRect.top + 68) + 'px';
  blockEl.style.left      = (appRect.left + 10) + 'px';
  blockEl.style.width     = (appRect.width - 20) + 'px';
  blockEl.style.zIndex    = '25';
  blockEl.style.display   = 'flex';
  blockEl.style.flexDirection = 'column';
  blockEl.style.gap       = '14px';
  blockEl.innerHTML = `
    <div style="width:100%;box-sizing:border-box;background:#fff;border:2px solid #3a6b3a;border-radius:10px;padding:9px 11px;font-size:14px;color:#1a1a1a;">
      💧 ${escapeHtml(displayName)} watered ${escapeHtml(plantName)} · just now
    </div>
    <div id="coachmark-tooltip" style="width:100%;box-sizing:border-box;background:#fff;border-radius:12px;padding:13px;position:relative;">
      <div style="position:absolute;top:-9px;left:18px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:9px solid #fff;"></div>
      <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:6px;">This is your household's activity feed</div>
      <div style="font-size:13px;color:#555;line-height:1.5;margin-bottom:14px;">${escapeHtml(body)}</div>
      <button id="coachmark-got-it" style="width:100%;padding:12px;background:#3a6b3a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;">Got it</button>
    </div>`;

  document.body.appendChild(darkEl);
  document.body.appendChild(blockEl);

  function dismissCoachMark() {
    darkEl.remove();
    blockEl.remove();
  }

  function showNotifStep() {
    const tooltipEl = document.getElementById('coachmark-tooltip');
    tooltipEl.innerHTML = `
      <div style="position:absolute;top:-9px;left:18px;width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:9px solid #fff;"></div>
      <div style="font-size:10px;font-weight:500;color:#3a6b3a;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">One last thing</div>
      <div style="font-size:12px;font-weight:500;color:#222;margin-bottom:6px;">Get notified when it happens</div>
      <div style="font-size:11px;color:#555;line-height:1.5;margin-bottom:12px;">Enable notifications and you'll get a heads-up on your phone whenever someone in your household completes a care task.</div>
      <div style="margin-bottom:12px;">
        <div style="font-size:9px;color:#aaa;font-style:italic;text-align:center;margin-bottom:6px;">Here's what you'll see:</div>
        <div style="background:#f0f0f0;border-radius:10px;padding:8px 10px;display:flex;align-items:center;gap:8px;">
          <div style="width:32px;height:32px;border-radius:8px;overflow:hidden;flex-shrink:0;"><img src="/icons/plant-care-icon-192.png" style="width:100%;height:100%;object-fit:cover;display:block;"></div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:baseline;justify-content:space-between;">
              <div style="font-size:11px;font-weight:600;color:#1a1a1a;">Plant Care</div>
              <div style="font-size:10px;color:#aaa;">now</div>
            </div>
            <div style="font-size:11px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">A household member watered ${escapeHtml(plantName)}</div>
          </div>
        </div>
      </div>
      <button id="coachmark-enable-notif" style="width:100%;padding:12px;background:#3a6b3a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;margin-bottom:8px;">Enable notifications</button>
      <button id="coachmark-no-thanks" style="width:100%;padding:6px;background:none;border:none;font-size:11px;color:#888;cursor:pointer;">No thanks</button>`;

    document.getElementById('coachmark-enable-notif').addEventListener('click', async () => {
      await subscribeToPush();
      if (Notification.permission === 'granted') showToast('Notifications enabled');
      if (currentMemberId) localStorage.removeItem(`onboarding_show_pushsheet_${currentMemberId}`);
      dismissCoachMark();
      renderHome();
    });

    document.getElementById('coachmark-no-thanks').addEventListener('click', () => {
      if (currentMemberId) localStorage.removeItem(`onboarding_show_pushsheet_${currentMemberId}`);
      dismissCoachMark();
      showToast('You can enable notifications any time from the menu', { duration: 3500 });
      renderHome();
    });
  }

  document.getElementById('coachmark-got-it').addEventListener('click', () => {
    dismissCoachMark();
    showCaringTabCoachMark();
  });
}

function showCaringTabCoachMark() {
  // Full-screen dark overlay — tab bar appears above it via z-index: 1001
  const overlayEl = document.createElement('div');
  overlayEl.id = 'caring-cm-overlay';
  overlayEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;background:rgba(0,0,0,0.55);';

  // Spotlight ring — tightly wraps the Caring tab button
  const caringBtn = [...document.querySelectorAll('.tab-btn')].find(el => el.textContent.includes('Caring'));
  const spotEl = document.createElement('div');
  spotEl.id = 'caring-cm-spot';
  spotEl.style.cssText = 'position:fixed;z-index:1002;width:72px;height:48px;border-radius:10px;border:2px solid #fff;pointer-events:none;';
  if (caringBtn) {
    const r = caringBtn.getBoundingClientRect();
    spotEl.style.top  = r.top + 'px';
    spotEl.style.left = (r.left + r.width / 2 - 36) + 'px';
  }

  // Bubble — just below the tab bar, centered horizontally
  const tabBar   = document.querySelector('.tab-bar');
  const tabBottom = tabBar ? tabBar.getBoundingClientRect().bottom : 110;
  const bubbleEl = document.createElement('div');
  bubbleEl.id = 'caring-cm-bubble';
  bubbleEl.style.cssText = `position:fixed;z-index:1002;width:220px;left:50%;transform:translateX(-50%);top:${tabBottom + 8}px;background:#fff;border-radius:12px;padding:14px;box-sizing:border-box;`;
  bubbleEl.innerHTML = `
    <div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-bottom:8px solid #fff;"></div>
    <div style="font-size:15px;font-weight:500;color:#1a2e1a;margin-bottom:6px;">Your daily tasks live here</div>
    <div style="font-size:13px;color:#666;line-height:1.5;margin-bottom:12px;">See what needs attention today and what's coming up this week.</div>
    <button id="caring-cm-got-it" style="width:100%;padding:12px;background:#3a6b3a;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;font-family:inherit;">Got it</button>`;

  document.body.appendChild(overlayEl);
  document.body.appendChild(spotEl);
  document.body.appendChild(bubbleEl);

  document.getElementById('caring-cm-got-it').addEventListener('click', () => {
    overlayEl.remove();
    spotEl.remove();
    bubbleEl.remove();
    if (currentMemberId) localStorage.setItem(`onboarding_session6_done_${currentMemberId}`, '1');
  });
}

// ============================================================
// RENDER: SCHEDULE
// ============================================================

function renderSchedule() {
  const today = new Date().toLocaleDateString('en-CA');

  const totalTasks = plants.reduce((sum, p) => sum + p.tasks.length, 0);
  if (totalTasks === 0) {
    return `<div style="text-align:center;padding:48px 24px 32px;">
  <div style="font-size:32px;margin-bottom:12px;">✅</div>
  <div style="font-size:15px;font-weight:600;color:#3a6b3a;margin-bottom:8px;">Where care happens</div>
  <div style="font-size:13px;color:#888;line-height:1.5;">Overdue and upcoming tasks will appear here.</div>
</div>`;
  }

  let html = renderHomeDueToday();

  html += renderCaringDoneToday();

  // Upcoming: next 7 days (tomorrow through today+7)
  html += `<div class="home-section-header">
    <div class="home-section-header-accent" style="background:#2e7d51;"></div>
    <span class="home-section-header-text">Upcoming</span>
  </div>`;

  html += `<div class="upcoming-rows">`;
  let lastUpcomingDate = null;
  for (let i = 1; i <= 7; i++) {
    const dateStr = addDays(today, i);
    const dateObj = new Date(dateStr + 'T12:00:00');
    const dayAbbr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monAbbr = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayNum  = dateObj.getDate();

    const dayTasks = [];
    for (const plant of plants) {
      for (const task of plant.tasks) {
        if (task.paused) continue;
        if (task.lastDone === todayStr()) continue;
        if (!matchesFilter(task.owner)) continue;
        if (taskOccursOnDate(task, dateStr)) dayTasks.push({ plant, task });
      }
    }

    const dateColHtml = () => {
      if (dateStr !== lastUpcomingDate) {
        lastUpcomingDate = dateStr;
        return `<div class="upcoming-date-col">
          <span class="upcoming-date-mon">${monAbbr}</span>
          <span class="upcoming-date-num">${dayNum}</span>
          <span class="upcoming-date-dow">${dayAbbr}</span>
        </div>`;
      }
      return `<div class="upcoming-date-col" aria-hidden="true"></div>`;
    };

    if (dayTasks.length === 0) {
      html += `<div class="upcoming-row">
        ${dateColHtml()}
        <div class="upcoming-card upcoming-empty-card" style="background:#f0eef8;border:0.5px solid #d0c8ee;">
          <span class="upcoming-empty-tile" style="background:#ddd8f0;border-radius:9px;width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;">🎈</span>
          <span class="home-due-today-info">
            <span style="font-size:13px;font-weight:500;color:#3a2a7a;">All clear</span>
            <span style="font-size:11px;color:#6a5aaa;">No tasks today</span>
          </span>
        </div>
      </div>`;
    } else {
      for (const { plant, task } of dayTasks) {
        const cfg = getTaskConfig(task);
        const ownerMember = membersCache.find(m => m.display_name === task.owner);
        const ownerColor  = ownerMember?.color ?? '#888';
        const ownerInitial = (task.owner ?? '?')[0].toUpperCase();
        html += `<div class="upcoming-row" data-action="caring-open-edit-task" data-plant="${plant.id}" data-task="${task.id}">
          ${dateColHtml()}
          <div class="upcoming-card">
            ${plant.photoUrl
              ? plantIconImgHtml(plant.photoUrl, 36, '8px')
              : `<span class="upcoming-card-emoji-tile">${plant.emoji}</span>`}
            <span class="upcoming-card-divider"></span>
            <span class="upcoming-card-icon">${cfg.icon}</span>
            <span class="home-due-today-info">
              <span style="font-size:13px;font-weight:500;color:#1a1a1a;">${escapeHtml(cfg.name)}</span>
              <span class="home-due-today-plant">${escapeHtml(plant.name)}</span>
            </span>
            <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:4px;">${escapeHtml(ownerInitial)}</span>
            <button class="attention-check-circle" data-action="home-mark-done" data-plant="${plant.id}" data-task="${task.id}" aria-label="Mark done">
              <span class="attention-check-icon">✓</span>
            </button>
          </div>
        </div>`;
      }
    }
  }
  html += `</div>`;

  return html;
}

// ============================================================
// RENDER: PLANT DETAIL
// ============================================================

function renderPlantDetail(plantId) {
  const plant = getPlant(plantId);
  if (!plant) { navigateTo('home'); return; }

  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();

  let html = `
  <div class="app-header app-header--plant-detail">
    <button class="back-btn" data-action="go-home">&#8249;</button>
    <div class="detail-header-title">
      ${plant.photoUrl
        ? plantIconImgHtml(plant.photoUrl, 30, '50%')
        : `<span class="detail-header-emoji-circle">${plant.emoji}</span>`}
      <div class="detail-header-name-row">
        <span class="detail-header-name">${escapeHtml(plant.name)}</span>
        <button class="header-edit-chevron-btn" data-action="open-edit-plant" data-plant="${plant.id}" aria-label="Edit plant">▾</button>
      </div>
    </div>
    <button class="header-feedback-btn" data-action="feedback" aria-label="Report a bug">${FEEDBACK_BUBBLE_SVG}</button>
    <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
  </div>
  <div class="plant-detail-tabs">
    <button class="detail-tab-btn${plantDetailTab === 'summary'  ? ' active' : ''}" data-action="plant-detail-tab" data-tab="summary">Summary</button>
    <button class="detail-tab-btn${plantDetailTab === 'tasks'    ? ' active' : ''}" data-action="plant-detail-tab" data-tab="tasks">Tasks</button>
    <button class="detail-tab-btn${plantDetailTab === 'notes'    ? ' active' : ''}" data-action="plant-detail-tab" data-tab="notes">Notes</button>
    <button class="detail-tab-btn${plantDetailTab === 'carelog'  ? ' active' : ''}" data-action="plant-detail-tab" data-tab="carelog">Care Log</button>
  </div>
  ${renderUserFilterPills()}
  <div class="plant-detail">`;

  if (plantDetailTab === 'summary') {
    html += renderSummaryTab(plant);
  } else if (plantDetailTab === 'tasks') {
    html += renderTasksTab(plant);
  } else if (plantDetailTab === 'notes') {
    html += renderNotesTab(plant);
  } else {
    html += renderCareLogTab(plant);
  }

  html += `</div>`;

  // Context-aware FABs
  const isOnboardingTasksView = plantDetailTab === 'tasks'
    && plant.id === getOnboardingPlantId()
    && (getOnboardingStep() === 2 || getOnboardingStep() === 3);
  const showNote = plantDetailTab === 'summary' || plantDetailTab === 'notes' || plantDetailTab === 'carelog';
  const showTask = !isOnboardingTasksView && (plantDetailTab === 'summary' || plantDetailTab === 'tasks' || plantDetailTab === 'carelog');
  if (plantDetailTab === 'summary') {
    html += `
      <div class="summary-fab" id="summary-fab">
        <div class="summary-fab-scrim" data-action="summary-fab-collapse"></div>
        <div class="summary-fab-options">
          <button class="summary-fab-option" data-action="summary-fab-add-note" data-plant="${plant.id}">
            <span class="summary-fab-option-label">Add note</span>
            <span class="summary-fab-option-icon summary-fab-option-icon--note">&#128221;</span>
          </button>
          <button class="summary-fab-option" data-action="summary-fab-add-task" data-plant="${plant.id}">
            <span class="summary-fab-option-label">Add task</span>
            <span class="summary-fab-option-icon summary-fab-option-icon--task">+</span>
          </button>
        </div>
        <button class="summary-fab-main" data-action="summary-fab-toggle" aria-label="Add">
          <span class="summary-fab-icon summary-fab-icon-plus">+</span>
          <span class="summary-fab-icon summary-fab-icon-close">&#10005;</span>
        </button>
      </div>`;
  } else {
    html += `<div class="detail-fab-stack">`;
    if (showNote) {
      html += `<button class="detail-fab detail-fab-note" data-action="add-note" data-plant="${plant.id}">&#128221; Add note</button>`;
    }
    if (showTask) {
      html += `<button class="detail-fab detail-fab-task" data-action="add-task" data-plant="${plant.id}">&#43; Add task</button>`;
    }
    html += `</div>`;
  }

  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);
}

function renderManageHouseholds() {
  const name = householdName ?? 'My Household';
  const memberCount = membersCache.length;
  const memberSubtitle = `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;

  const cardClass = manageHouseholdsEditingName ? 'manage-household-card editing' : 'manage-household-card';
  const nameRow = manageHouseholdsEditingName
    ? `<input id="manage-household-name-input" class="manage-household-name-input" type="text" value="${escapeHtml(name)}" maxlength="60" autocomplete="off" />
       <div class="manage-household-edit-actions">
         <button class="manage-household-btn-cancel" data-action="manage-households-cancel-name">Cancel</button>
         <button class="manage-household-btn-save" data-action="manage-households-save-name">Save</button>
       </div>`
    : `<div class="manage-household-row">
         <span class="manage-household-icon" aria-hidden="true">🏠</span>
         <div class="manage-household-text">
           <div class="manage-household-name">${escapeHtml(name)}</div>
           <div class="manage-household-sub">${memberSubtitle}</div>
         </div>
         <button class="manage-household-edit-btn" data-action="manage-households-start-edit">Edit Name</button>
       </div>`;

  const memberRows = membersCache.map(m => {
    const initial = (m.display_name ?? '?')[0].toUpperCase();
    const color = m.color ?? '#2e7d51';
    const isYou = m.id === currentMemberId;
    return `
      <div class="manage-member-row">
        <span class="manage-member-avatar" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</span>
        <div class="manage-member-text">
          <div class="manage-member-name">${escapeHtml(m.display_name ?? 'Unknown')}</div>
          <div class="manage-member-role">Member</div>
        </div>
        ${isYou ? '<span class="manage-member-you">YOU</span>' : ''}
      </div>`;
  }).join('');

  const html = `
  <div class="app-header app-header--manage">
    <button class="manage-back-btn" data-action="manage-households-back" aria-label="Back">&#8249;</button>
    <div class="manage-header-title">Manage Households</div>
    <div class="manage-header-spacer" aria-hidden="true"></div>
  </div>
  <div class="manage-households-body">
    <div class="manage-section-label">Your household</div>
    <div class="${cardClass}">${nameRow}</div>

    <div class="manage-section-label">Members</div>
    <div class="manage-members-card">${memberRows}</div>
  </div>`;

  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);

  if (manageHouseholdsEditingName) {
    const input = document.getElementById('manage-household-name-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function buildHouseholdActivityContent() {
  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();

  const filtered = activityFeed.filter(item => matchesFilter(item.member));

  let bodyHtml;
  if (filtered.length === 0) {
    bodyHtml = `<div class="detail-empty" style="padding:48px 16px;text-align:center;color:#888;">No activity yet${activeFilter.length ? ' for selected users' : ''}.</div>`;
  } else {
    let lastDate = null;
    let rowsHtml = '';
    for (const item of filtered) {
      const dateStr = item.sortKey ? item.sortKey.split('T')[0] : null;

      let monAbbr = '—', dayNum = '—', dayAbbr = '';
      if (dateStr) {
        const d = new Date(dateStr + 'T12:00:00');
        if (!isNaN(d.getTime())) {
          monAbbr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          dayNum  = String(d.getDate());
          dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' });
        }
      }

      const showDate = dateStr !== lastDate;
      lastDate = dateStr;
      const dateColHtml = showDate
        ? `<div class="upcoming-date-col">
             <span class="upcoming-date-mon">${escapeHtml(monAbbr)}</span>
             <span class="upcoming-date-num">${escapeHtml(dayNum)}</span>
             <span class="upcoming-date-dow">${escapeHtml(dayAbbr)}</span>
           </div>`
        : `<div class="upcoming-date-col" aria-hidden="true"></div>`;

      const plant         = plants.find(p => p.id === item.plantId);
      const plantName     = plant?.name ?? item.plantName ?? '';
      const plantEmoji    = plant?.emoji ?? '🪴';
      const plantPhotoUrl = plant?.photoUrl ?? null;

      const plantTileHtml = plantPhotoUrl
        ? plantIconImgHtml(plantPhotoUrl, 32, '8px')
        : `<span style="width:32px;height:32px;border-radius:8px;background:#e8f0e4;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;line-height:1;">${escapeHtml(plantEmoji)}</span>`;

      const member       = membersCache.find(m => m.display_name === item.member);
      const ownerColor   = member?.color ?? '#888';
      const ownerInitial = (item.member ?? '?')[0].toUpperCase();

      let titleText, subtitleText, taskIcon, photoThumbHtml = '';
      const isSkipped = item.type === 'care' && item.taskType === 'skipped';
      if (item.type === 'care') {
        titleText    = item.taskName ?? 'Care';
        subtitleText = isSkipped ? `${plantName} · Skipped` : plantName;
        taskIcon     = CARE_ICON[item.taskType] ?? '✅';
      } else {
        titleText = 'Note added';
        const noteText  = (item.note ?? '').trim();
        const truncated = noteText.length > 30 ? noteText.slice(0, 30) + '…' : noteText;
        subtitleText = noteText ? `${plantName} · ${truncated}` : plantName;
        taskIcon     = '💬';
        if (item.photoUrl) {
          photoThumbHtml = `<span class="care-log-thumb"><img class="carelog-note-thumb" src="${escapeHtml(item.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(item.photoUrl)}" data-note-id="${escapeHtml(item.id)}" data-plant-id="${escapeHtml(item.plantId)}" style="width:36px;height:36px;border-radius:7px;border:1.5px solid #c8c8c8;" /></span>`;
        }
      }

      rowsHtml += `<div class="upcoming-row${isSkipped ? ' activity-row-skipped' : ''}">
        ${dateColHtml}
        <div class="upcoming-card">
          ${plantTileHtml}
          <span class="upcoming-card-divider"></span>
          <span class="upcoming-card-icon${isSkipped ? ' activity-icon-skipped' : ''}">${taskIcon}</span>
          <span class="home-due-today-info">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(titleText)}</span>
            <span class="home-due-today-plant${isSkipped ? ' activity-sub-skipped' : ''}">${escapeHtml(subtitleText)}</span>
          </span>
          ${photoThumbHtml}
          <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInitial)}</span>
        </div>
      </div>`;
    }
    bodyHtml = `<div class="upcoming-rows" style="padding:0 12px 80px;">${rowsHtml}</div>`;
  }

  return `
  <div class="app-header app-header--household-activity">
    <button class="back-btn" data-action="close-household-activity" aria-label="Back">&#8249;</button>
    <span class="household-activity-title">Household activity</span>
    <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
  </div>
  ${renderUserFilterPills()}
  ${bodyHtml}`;
}

function openHouseholdActivity() {
  if (document.getElementById('household-activity-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'household-activity-overlay';
  overlay.className = 'household-activity-overlay';
  overlay.innerHTML = buildHouseholdActivityContent();
  overlay.addEventListener('click', handleEvent);
  document.body.appendChild(overlay);
  // Force the initial translateY(100%) to flush before transitioning to 0.
  requestAnimationFrame(() => overlay.classList.add('open'));
}

function refreshHouseholdActivity() {
  const overlay = document.getElementById('household-activity-overlay');
  if (!overlay) return;
  overlay.innerHTML = buildHouseholdActivityContent();
}

function closeHouseholdActivity() {
  const overlay = document.getElementById('household-activity-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

async function handleManageHouseholdsSaveName() {
  const input = document.getElementById('manage-household-name-input');
  if (!input) return;
  const newName = input.value.trim();
  if (!newName || newName === householdName) {
    manageHouseholdsEditingName = false;
    renderManageHouseholds();
    return;
  }

  const { error } = await supabaseClient
    .from('households')
    .update({ name: newName })
    .eq('id', householdId);

  if (error) {
    showToast('Could not save — please try again');
    return;
  }

  householdName = newName;
  manageHouseholdsEditingName = false;
  renderManageHouseholds();

  const headerNameEl = document.getElementById('header-household-name');
  if (headerNameEl) headerNameEl.textContent = newName;

  showToast('&#10003; Household name updated');
}

// Predicate: does a given author/owner display_name satisfy the current global filter?
// Empty activeFilter = no filter applied (show all).
function matchesFilter(author) {
  return activeFilter.length === 0 || activeFilter.includes(author);
}

function renderUserFilterPills() {
  let html = `<div class="user-filter-row">`;
  for (const m of membersCache) {
    const active = activeFilter.includes(m.display_name);
    const color = m.color ?? '#666';
    const borderColor = hexToRgba(color, 0.5);
    const pillStyle = active
      ? `background:${color};color:#fff;border:0.5px solid transparent;`
      : `background:#fff;color:#333;border:0.5px solid ${borderColor};`;
    const dotStyle = active
      ? `background:rgba(255,255,255,0.65);`
      : `background:${color};`;
    const checkStyle = active ? `color:#fff;` : `color:#aaa;`;
    const checkChar = active ? '✓' : '✕';
    html += `<div class="user-pill" data-action="user-filter-toggle" data-user="${escapeHtml(m.display_name)}" style="${pillStyle}">
      <div class="user-pill-dot" style="${dotStyle}"></div>
      ${escapeHtml(m.display_name)}
      <span class="user-pill-check" style="${checkStyle}">${checkChar}</span>
    </div>`;
  }
  html += `</div>`;
  return html;
}

function sectionHeader(label, accentColor, count) {
  const countHtml = count != null
    ? `<span class="section-header-bar-count">${count} task${count !== 1 ? 's' : ''}</span>`
    : '';
  return `<div class="section-header-bar">
    <div class="section-header-bar-accent" style="background:${accentColor};"></div>
    <span class="section-header-bar-text">${label}</span>
    ${countHtml}
  </div>`;
}

function renderSummaryTab(plant) {
  if (plant.tasks.length === 0 && plant.careLog.length === 0) {
    return `<div style="text-align:center;padding:48px 24px 32px;">
  <div style="font-size:52px;margin-bottom:16px;">${escapeHtml(plant.emoji)}</div>
  <div style="font-size:17px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">Your ${escapeHtml(plant.name)} is home</div>
  <div style="font-size:13px;color:#888;line-height:1.5;max-width:260px;margin:0 auto;">Add a task to start tracking its care. Your progress will show up here.</div>
</div>`;
  }

  const today = todayStr();

  const summarySectionHeader = (label) => `<div style="display:flex;align-items:center;gap:8px;padding:16px 0 8px;">
    <span style="width:3px;height:14px;background:#3a6b3a;border-radius:2px;flex-shrink:0;"></span>
    <span style="font-size:11px;font-weight:500;color:#6b7a6b;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(label)}</span>
  </div>`;

  const recurrenceLabel = (task) => {
    const rt = task.recurrenceType ?? 'interval';
    if (rt === 'one-off') return 'One-off';
    if (rt === 'weekdays') {
      const dInts = (task.weekdays ?? []).slice().sort((a, b) => a - b);
      const abbrev = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dInts.length > 0 ? `Every ${dInts.map(d => abbrev[d]).join(', ')}` : 'Days of week';
    }
    const n = task.frequencyDays ?? 1;
    return `Every ${n} day${n !== 1 ? 's' : ''}`;
  };

  const relativeDays = (dateStr) => {
    if (!dateStr) return 'some time ago';
    const diff = daysBetween(dateStr, today);
    if (isNaN(diff)) return 'some time ago';
    if (diff <= 0) return 'today';
    if (diff === 1) return '1 day ago';
    return `${diff} days ago`;
  };

  const compactRelative = (dateStr) => {
    if (!dateStr) return '';
    const diff = daysBetween(dateStr, today);
    if (isNaN(diff)) return '';
    if (diff <= 0) return 'today';
    return `${diff}d ago`;
  };

  let html = '';

  // ── Zone 1: Hero card (two states) ────────────────────────
  const dateAcquired = plant.dateAcquired;
  if (dateAcquired) {
    const totalDays   = daysBetween(dateAcquired, today);
    const yearN       = Math.floor(totalDays / 365) + 1;
    const yearLabel   = yearN === 1 ? '1 year' : `${yearN} years`;
    const progressPct = ((totalDays % 365) / 365) * 100;
    html += `
  <div class="hero-card">
    <div class="hero-card-top">
      <div class="hero-card-days">${totalDays}</div>
      <div class="hero-card-text">
        <div class="hero-card-label">days of care</div>
        <div class="hero-card-since">Home since ${escapeHtml(formatDate(dateAcquired))}</div>
      </div>
    </div>
    <div class="hero-card-bar-row">
      <div class="hero-card-bar"><div class="hero-card-bar-fill" style="width:${progressPct}%;"></div></div>
      <div class="hero-card-milestone">⭐ ${yearLabel}</div>
    </div>
  </div>`;
  } else {
    html += `
  <button class="hero-card-prompt" data-action="open-edit-plant" data-plant="${plant.id}">
    <span class="hero-card-prompt-icon" aria-hidden="true">🏠</span>
    <div class="hero-card-prompt-text">
      <div class="hero-card-prompt-title">When did ${escapeHtml(plant.name)} arrive home?</div>
      <div class="hero-card-prompt-sub">Set an arrival date to start tracking days of care.</div>
    </div>
    <span class="hero-card-prompt-chevron" aria-hidden="true">›</span>
  </button>`;
  }

  // ── Photo timeline entry (only if 2+ photos) ──────────────
  const summaryPhotoCount = notes.filter(n => n.plantId === plant.id && n.photoUrl).length;
  if (summaryPhotoCount >= 2) {
    html += `
  <div data-action="open-slideshow" data-plant="${escapeHtml(plant.id)}" style="display:flex;align-items:center;gap:10px;background:#fff;border:0.5px solid #e8ede8;border-radius:10px;padding:10px 14px;margin:0 0 12px;cursor:pointer;">
    <span style="width:30px;height:30px;background:#eaf3de;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#3b6d11" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h2l1.5-2h3l1.5 2h2a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/><circle cx="8" cy="9" r="2.5"/></svg>
    </span>
    <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
      <span style="font-size:14px;font-weight:500;color:#1a1a1a;">Photo timeline</span>
      <span style="font-size:12px;color:#8a8d86;">${summaryPhotoCount} photos · tap to view</span>
    </span>
    <span style="width:30px;height:30px;background:#3d6b3d;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff;font-size:13px;line-height:1;" aria-hidden="true">▶</span>
  </div>`;
  }

  // ── Zone 2: Needs attention today ─────────────────────────
  const attentionTasks = plant.tasks.filter(t => {
    if (t.paused) return false;
    if (!matchesFilter(t.owner)) return false;
    const d = daysUntilDue(t);
    return d === 0 || (d < 0 && d !== -Infinity);
  });
  const caredToday = plant.careLog.some(e => e.date === today);

  if (attentionTasks.length === 0 && caredToday) {
    // Congratulatory state — green header + trophy row (Caring-tab pattern)
    html += `<div class="home-section-header">
      <div class="home-section-header-accent" style="background:#2e7d32;"></div>
      <span class="home-section-header-text" style="color:#2e7d32;">Needs attention today</span>
    </div>
    <div class="home-activity-feed">
      <div class="needs-attention-list">
        <div class="attention-done-row">
          <span class="attention-done-tile">🏆</span>
          <span class="home-due-today-info">
            <span style="font-size:13px;font-weight:500;color:#2e7d32;">All done for today!</span>
            <span style="font-size:11px;color:#5a8c58;">${escapeHtml(plant.name)}</span>
          </span>
        </div>
      </div>
    </div>`;
  } else {
    html += summarySectionHeader('Needs attention today');

    if (attentionTasks.length === 0) {
      html += `<div style="margin:0;display:flex;align-items:center;gap:10px;background:#f0eef8;border:0.5px solid #d0c8ee;border-radius:12px;padding:10px 12px;">
        <span style="width:40px;height:40px;background:#ddd8f0;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">🎈</span>
        <span style="display:flex;flex-direction:column;gap:2px;min-width:0;">
          <span style="font-size:13px;font-weight:500;color:#3a2a7a;">All clear</span>
          <span style="font-size:11px;color:#6a5aaa;">No tasks today</span>
        </span>
      </div>`;
    } else {
      for (const task of attentionTasks) {
        const cfg         = getTaskConfig(task);
        const ownerMember = membersCache.find(m => m.display_name === task.owner);
        const ownerColor  = ownerMember?.color ?? '#888';
        const ownerInit   = (task.owner ?? '?')[0].toUpperCase();
        const d           = daysUntilDue(task);
        const daysLate    = Math.abs(d);
        const status      = d < 0 ? `${daysLate} day${daysLate !== 1 ? 's' : ''} overdue` : 'Due today';
        const metaText    = `${status} · ${recurrenceLabel(task)}`;
        const rowAction   = d < 0 ? 'caring-overdue-row-tap' : 'edit-task';
        const urgencyCls  = d < 0 ? 'attention-row--overdue' : 'attention-row--duetoday';
        html += `<div class="attention-row ${urgencyCls}" style="margin:0 0 8px;display:flex;align-items:center;gap:10px;border-radius:12px;padding:10px 12px;cursor:pointer;" data-action="${rowAction}" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(task.id)}">
          <span style="width:36px;height:36px;background:#eef3eb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${cfg.icon}</span>
          <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</span>
            <span style="font-size:11px;color:#8a5a0f;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(metaText)}</span>
          </span>
          <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInit)}</span>
          <button class="attention-check-circle" data-action="summary-mark-done" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(task.id)}" aria-label="Mark done">
            <span class="attention-check-icon">✓</span>
          </button>
        </div>`;
      }
    }
  }

  // ── Zone 3a: Upcoming (next 3 occurrences) ────────────────
  html += summarySectionHeader('Upcoming');

  const projectStart = addDays(today, 1);
  const projectEnd   = addDays(today, 365);
  const allOccs      = [];
  for (const task of plant.tasks) {
    if (task.paused) continue;
    if (task.lastDone === todayStr()) continue;
    if (!matchesFilter(task.owner)) continue;
    const rt    = task.recurrenceType ?? 'interval';
    const first = computeNextDue(task);
    if (!first) continue;

    if (rt === 'one-off') {
      if (first >= projectStart) allOccs.push({ date: first, task });
      continue;
    }

    if (rt === 'weekdays') {
      const wd = task.weekdays ?? [];
      if (wd.length === 0) continue;
      const picks = [];
      if (first >= projectStart) picks.push(first);
      let d = addDays(first, 1);
      while (picks.length < 3 && d <= projectEnd) {
        const dow = new Date(d + 'T12:00:00').getDay();
        if (wd.includes(dow) && d >= projectStart) picks.push(d);
        d = addDays(d, 1);
      }
      for (const date of picks) allOccs.push({ date, task });
      continue;
    }

    const interval = task.frequencyDays;
    if (!interval || interval <= 0) {
      if (first >= projectStart) allOccs.push({ date: first, task });
      continue;
    }
    let d = first;
    while (d < projectStart) d = addDays(d, interval);
    for (let i = 0; i < 3 && d <= projectEnd; i++) {
      allOccs.push({ date: d, task });
      d = addDays(d, interval);
    }
  }
  allOccs.sort((a, b) => a.date.localeCompare(b.date));
  const upcoming3 = allOccs.slice(0, 3);

  if (upcoming3.length === 0) {
    html += `<div style="margin:0;padding:12px 16px;color:#888;font-size:13px;">No upcoming tasks</div>`;
  } else {
    for (const { date, task } of upcoming3) {
      const cfg         = getTaskConfig(task);
      const ownerMember = membersCache.find(m => m.display_name === task.owner);
      const ownerColor  = ownerMember?.color ?? '#888';
      const ownerInit   = (task.owner ?? '?')[0].toUpperCase();
      const dObj        = new Date(date + 'T12:00:00');
      const monAbbr     = dObj.toLocaleDateString('en-US', { month: 'short' });
      const dayAbbr     = dObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum      = dObj.getDate();
      html += `<div style="margin:0 0 8px;display:flex;align-items:center;gap:10px;background:#fff;border:0.5px solid #e8ede8;border-radius:12px;padding:10px 12px;cursor:pointer;" data-action="edit-task" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(task.id)}">
        <div style="display:flex;flex-direction:column;align-items:center;min-width:36px;flex-shrink:0;">
          <span style="font-size:10px;color:#7a8a7a;text-transform:uppercase;line-height:1.1;">${escapeHtml(monAbbr)}</span>
          <span style="font-size:15px;font-weight:500;color:#1a1a1a;line-height:1.1;">${dayNum}</span>
          <span style="font-size:10px;color:#7a8a7a;line-height:1.1;">${escapeHtml(dayAbbr)}</span>
        </div>
        <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
        <span style="width:36px;height:36px;background:#f0f0f0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">${cfg.icon}</span>
        <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
          <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</span>
          <span style="font-size:11px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(recurrenceLabel(task))}</span>
        </span>
        <span style="width:20px;height:20px;border-radius:50%;background:${escapeHtml(ownerColor)};color:white;font-size:11px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${escapeHtml(ownerInit)}</span>
      </div>`;
    }
  }

  // ── Zone 3b: Recent activity (last 3 entries) ─────────────
  html += `<div style="display:flex;align-items:center;gap:8px;padding:16px 0 8px;">
    <span style="width:3px;height:14px;background:#3a6b3a;border-radius:2px;flex-shrink:0;"></span>
    <span style="font-size:11px;font-weight:500;color:#6b7a6b;text-transform:uppercase;letter-spacing:0.05em;">Recent activity</span>
    <button class="summary-view-all-link" style="margin-left:auto;" data-action="plant-detail-tab" data-tab="carelog">View more</button>
  </div>`;

  const plantNotes = notes.filter(n => n.plantId === plant.id);
  const activityItems = [
    ...plant.careLog.filter(e => matchesFilter(e.author)).map(e => ({ type: 'care', sortKey: e.date ?? '',                     data: e, raw: e.createdAt ?? '' })),
    ...plantNotes.filter(n => matchesFilter(n.author)).map(n   => ({ type: 'note', sortKey: (n.createdAt ?? '').split('T')[0],  data: n, raw: n.createdAt ?? '' })),
  ].sort((a, b) => {
    const cmp = (b.sortKey || '').localeCompare(a.sortKey || '');
    if (cmp !== 0) return cmp;
    return ((b.raw ?? '') || '').localeCompare(a.raw ?? '');
  }).slice(0, 3);

  if (activityItems.length === 0) {
    html += `<div style="margin:0;padding:12px 16px;color:#888;font-size:13px;">No activity yet</div>`;
  } else {
    for (const item of activityItems) {
      if (item.type === 'care') {
        const e           = item.data;
        const isSkipped   = e.taskType === 'skipped';
        const matchedTask = plant.tasks.find(t => t.id === e.taskId);
        const cfgM        = matchedTask ? getTaskConfig(matchedTask) : null;
        const icon        = isSkipped ? '⏭' : (cfgM?.icon ?? '✓');
        const tType       = isSkipped ? 'skipped' : (cfgM?.type ?? e.taskType);
        const relTime     = relativeDays(e.date) === 'today' ? 'Today'
                          : relativeDays(e.date) === '1 day ago' ? 'Yesterday'
                          : relativeDays(e.date);
        const absDate     = e.date ? formatDate(e.date) : '';
        const verb        = CARE_VERB[tType];
        const author      = e.author ?? 'Someone';
        const primary     = isSkipped
          ? `${author} skipped ${e.taskName ?? 'task'}`
          : verb
            ? `${author} ${verb} ${plant.name}`
            : `${author} · ${e.taskName ?? 'care'} — ${plant.name}`;
        const isDoneToday = !isSkipped && e.date === today;
        const tileHtml    = isSkipped
          ? `<span class="activity-icon-skipped" style="width:40px;height:40px;background:#f4f6f2;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</span>`
          : isDoneToday
            ? `<span style="width:40px;height:40px;background:#eaf3de;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</span>`
            : activityTaskTileHtml(tType, icon);
        const actionsHtml = isDoneToday
          ? `<button data-action="summary-carelog-add-note" data-plant="${escapeHtml(plant.id)}" style="width:30px;height:30px;border-radius:50%;border:0.5px solid #dde0d9;background:#f4f6f2;display:inline-flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;cursor:pointer;padding:0;" aria-label="Add note"><svg viewBox="0 0 16 16" fill="none" stroke="#8a9180" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 2l3 3-8 8H3v-3l8-8z"/></svg></button>
            <button data-action="summary-carelog-undo" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(e.taskId ?? '')}" data-entry="${escapeHtml(e.id ?? '')}" style="width:28px;height:28px;border-radius:50%;border:none;background:#3b6d11;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;cursor:pointer;padding:0;margin-left:6px;" aria-label="Undo">✓</button>`
          : '';
        html += `<div class="${isSkipped ? 'activity-row-skipped ' : ''}" style="margin:0 0 8px;display:flex;align-items:center;gap:10px;background:#fff;${isSkipped ? '' : 'border:0.5px solid #e8ede8;border-radius:12px;'}padding:10px 12px;cursor:pointer;" data-action="carelog-open-edit-task" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(e.taskId ?? '')}">
          ${tileHtml}
          <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;"></span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(primary)}</span>
            <span class="${isSkipped ? 'activity-sub-skipped' : ''}" style="font-size:11px;${isSkipped ? '' : 'color:#8a8d86;'}overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(relTime)} · ${escapeHtml(absDate)}</span>
          </span>
          ${actionsHtml}
        </div>`;
      } else {
        const n       = item.data;
        const relTime = relativeDays(item.sortKey) === 'today' ? 'Today'
                      : relativeDays(item.sortKey) === '1 day ago' ? 'Yesterday'
                      : relativeDays(item.sortKey);
        const absDate = item.sortKey ? formatDate(item.sortKey) : '';
        const primary = `${n.author ?? 'Someone'} added a note`;
        const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
        const isOwn = n.memberId && n.memberId === activeMemberId;
        const rowAction = isOwn
          ? `data-action="edit-note" data-note="${escapeHtml(n.id)}" data-plant="${escapeHtml(plant.id)}"`
          : '';
        const bodyHtml = `<span style="font-size:13px;color:#4a4a4a;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px;">${escapeHtml(n.note ?? '')}</span>`;
        const thumbHtml = n.photoUrl
          ? `<span class="care-log-thumb"><img class="activity-thumb-inline" src="${escapeHtml(n.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(n.photoUrl)}" /></span>`
          : '';
        html += `<div style="margin:0 0 8px;display:flex;align-items:flex-start;gap:10px;background:#fff;border:0.5px solid #e8ede8;border-radius:12px;padding:10px 12px;${isOwn ? 'cursor:pointer;' : ''}" ${rowAction}>
          <span style="width:36px;height:36px;background:#e8f0fb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">💬</span>
          <span style="width:1px;height:28px;background:rgba(0,0,0,0.12);flex-shrink:0;margin-top:4px;"></span>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
            <span style="font-size:13px;font-weight:500;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(primary)}</span>
            ${bodyHtml}
            <span style="font-size:11px;color:#8a8d86;margin-top:2px;">${escapeHtml(relTime)} · ${escapeHtml(absDate)}</span>
          </span>
          ${thumbHtml}
        </div>`;
      }
    }
  }

  return html;
}

function renderTasksTab(plant) {
  const step = getOnboardingStep();
  const isOnboardingPlant = plant.id === getOnboardingPlantId();

  if (step === 2 && isOnboardingPlant) {
    return `<div class="onboarding-first-task-prompt">
  <div class="onboarding-first-task-emoji">💧</div>
  <div class="onboarding-first-task-header">Your first care task</div>
  <div class="onboarding-first-task-sub">We'll create a simple watering task to get you started.</div>
  <button class="btn btn-primary onboarding-first-task-btn" data-action="onboarding-add-first-task" data-plant="${plant.id}">Add First Task (Example)</button>
</div>`;
  }

  if (step === 3 && isOnboardingPlant) {
    const onboardingTask = plant.tasks.find(t => t.id === getOnboardingTaskId());
    if (onboardingTask) {
      return `<div style="font-size:13px;font-weight:500;color:#3a6b3a;margin-bottom:8px;">Tap ✓ Done below to complete your setup</div>
<div class="task-list">${renderTaskCard(plant.id, onboardingTask, true)}</div>`;
    }
  }

  if (plant.tasks.length === 0) {
    return `<div class="tasks-empty-state">
  <div class="tasks-empty-icon">📋</div>
  <div class="tasks-empty-title">No tasks yet</div>
  <div class="tasks-empty-sub">Add a care task to start tracking what your ${escapeHtml(plant.name)} needs.</div>
</div>`;
  }
  let html = '';
  const filtered = plant.tasks.filter(t => matchesFilter(t.owner));
  if (filtered.length === 0) {
    html += `<div class="detail-empty">No tasks for selected users</div>`;
    return html;
  }
  const today = todayStr();
  const urgencyGroup = (t) => {
    if (t.paused) return 5;
    if (t.lastDone === today) return 6;
    const d = daysUntilDue(t);
    if (d === Infinity) return 6;
    if (d < 0)   return 1;
    if (d === 0) return 2;
    if (d === 1) return 3;
    return 4;
  };
  const sorted = [...filtered].sort((a, b) => {
    const ga = urgencyGroup(a);
    const gb = urgencyGroup(b);
    if (ga !== gb) return ga - gb;
    if (ga === 4)  return daysUntilDue(a) - daysUntilDue(b);
    return 0;
  });
  if (sorted.length > 0) {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:0 0 8px;">
      <span style="width:3px;height:14px;background:#2e7d32;border-radius:2px;flex-shrink:0;"></span>
      <span style="font-size:11px;font-weight:500;color:#8a9180;text-transform:uppercase;letter-spacing:0.05em;">Task list</span>
    </div>
    <div class="task-row-list">`;
    for (const task of sorted) {
      html += renderTaskRow(plant.id, task);
    }
    html += `</div>`;
  }

  return html;
}

function renderNotesTab(plant) {
  const plantNotes = notes
    .filter(n => n.plantId === plant.id)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  if (plantNotes.length === 0) {
    return `<div style="text-align:center;padding:48px 24px 32px;">
  <div style="font-size:32px;margin-bottom:12px;">📝</div>
  <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">No notes yet</div>
  <div style="font-size:13px;color:#888;line-height:1.5;max-width:260px;margin:0 auto;">Jot down observations about your ${escapeHtml(plant.name)} — growth, health, anything worth remembering. Tap the button below to add one.</div>
</div>`;
  }

  let html = '';
  const filteredNotes = plantNotes.filter(n => matchesFilter(n.author));

  if (filteredNotes.length === 0) {
    html += `<div class="detail-empty">No notes for selected users</div>`;
    return html;
  }

  const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
  html += `<div class="notes-tab-container" style="padding:0 16px 16px;">`;
  let lastMon = null;

  for (const note of filteredNotes) {
    // Month group header
    const dateStr  = note.createdAt ? note.createdAt.split('T')[0] : null;
    const monthKey = dateStr ? dateStr.slice(0, 7) : null;
    if (monthKey && monthKey !== lastMon) {
      lastMon = monthKey;
      const [y, m] = monthKey.split('-').map(Number);
      const lbl = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      html += `<div class="carelog-month-header">${lbl.toUpperCase()}</div>`;
    }

    // Date column
    let dayAbbr = '—', dayNum = '—';
    if (dateStr) {
      const d = new Date(dateStr + 'T12:00:00');
      if (!isNaN(d.getTime())) {
        dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
        dayNum  = String(d.getDate());
      }
    }

    // Owner circle
    const member  = membersCache.find(m2 => m2.display_name === note.author);
    const color   = member?.color ?? '#888';
    const initial = (note.author ?? '?')[0].toUpperCase();

    const isOwn     = note.memberId && note.memberId === activeMemberId;
    const rowAction = isOwn
      ? `data-action="edit-note" data-note="${escapeHtml(note.id)}" data-plant="${escapeHtml(plant.id)}"`
      : '';

    const photoThumbHtml = note.photoUrl
      ? `<span class="care-log-thumb"><img class="notes-tab-thumb" src="${escapeHtml(note.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(note.photoUrl)}" data-note-id="${escapeHtml(note.id)}" data-plant-id="${escapeHtml(note.plantId)}" style="width:36px;height:36px;border-radius:7px;border:1.5px solid #c8c8c8;" /></span>`
      : '';

    html += `
    <div class="upcoming-row notes-tab-row" ${rowAction}>
      <div class="upcoming-date-col">
        <span class="upcoming-date-dow">${dayAbbr}</span>
        <span class="upcoming-date-num">${dayNum}</span>
      </div>
      <div class="upcoming-card">
        <span class="upcoming-card-emoji-tile" style="background:#eef1e8;">${plant.emoji}</span>
        <span class="upcoming-card-divider"></span>
        <div class="notes-tab-body">${escapeHtml(note.note)}</div>
        ${photoThumbHtml}
        <div class="notes-tab-owner" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</div>
      </div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

function renderCareLogTab(plant) {
  let html = '';

  // Build unified list: care_log entries + notes, filtered by the global activeFilter
  const plantNotes = notes.filter(n => n.plantId === plant.id);

  const careItems = plant.careLog
    .filter(e => matchesFilter(e.author))
    .map(e => ({
      kind:   'care',
      sortKey: e.date ?? '',
      date:   e.date ?? null,
      data:   e,
    }));

  const noteItems = plantNotes
    .filter(n => matchesFilter(n.author))
    .map(n => {
    const isoDate = n.createdAt ? n.createdAt.split('T')[0] : null;
    return {
      kind:    'note',
      sortKey: n.createdAt ?? '',
      date:    isoDate,
      data:    n,
    };
  });

  const unified = [...careItems, ...noteItems]
    .sort((a, b) => (b.sortKey ?? '').localeCompare(a.sortKey ?? ''));

  if (unified.length === 0) {
    html += `<div style="text-align:center;padding:40px 24px 24px;">
  <div style="font-size:32px;margin-bottom:12px;">📖</div>
  <div style="font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:8px;">Your plant's care history</div>
  <div style="font-size:13px;color:#888;line-height:1.5;">Your completed tasks and notes will appear here.</div>
</div>`;
    return html;
  }

  // Group by month (YYYY-MM)
  let lastMonth = null;
  html += `<div class="carelog-new-list" style="padding:0 16px 16px;">`;
  for (const item of unified) {
    const dateStr = item.date;
    const monthKey = dateStr ? dateStr.slice(0, 7) : null;

    if (monthKey && monthKey !== lastMonth) {
      lastMonth = monthKey;
      const [y, m] = monthKey.split('-').map(Number);
      const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      html += `<div class="carelog-month-header">${monthLabel.toUpperCase()}</div>`;
    }

    if (item.kind === 'care') {
      html += renderCareLogNewRow(item.data, plant);
    } else {
      html += renderCareLogNoteRow(item.data);
    }
  }
  html += `</div>`;

  return html;
}

function activityTaskTileHtml(taskType, icon) {
  const t = String(taskType ?? '').toLowerCase().replace(/[^a-z]/g, '') || 'custom';
  return `<span style="width:40px;height:40px;background:var(--${t}-bg, #f4f6f2);border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</span>`;
}

function renderCareLogNewRow(entry, plant) {
  const isSkipped   = entry.taskType === 'skipped';
  const matchedTask = plant?.tasks?.find(t => t.id === entry.taskId);
  const cfg         = matchedTask ? getTaskConfig(matchedTask) : null;
  const taskIcon    = isSkipped
    ? (CARE_ICON.skipped ?? '⏭')
    : (cfg?.icon ?? (entry.taskType ? (CARE_ICON[entry.taskType] ?? '✅') : '✅'));
  const taskType    = isSkipped ? 'skipped' : (cfg?.type ?? entry.taskType);
  const member      = membersCache.find(m => m.display_name === entry.author);
  const color       = member?.color ?? '#888';
  const initial     = (entry.author ?? '?')[0].toUpperCase();

  const dateStr = entry.date ?? (entry.createdAt ? entry.createdAt.split('T')[0] : null);
  let dayAbbr = '—';
  let dayNum  = '—';
  if (dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    if (!isNaN(d.getTime())) {
      dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      dayNum  = String(d.getDate());
    }
  }

  const iconTileHtml = isSkipped
    ? `<span class="activity-icon-skipped" style="width:40px;height:40px;background:#f4f6f2;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${taskIcon}</span>`
    : activityTaskTileHtml(taskType, taskIcon);

  return `<div class="carelog-new-row${isSkipped ? ' activity-row-skipped' : ''}" data-action="carelog-open-edit-task" data-plant="${escapeHtml(plant.id)}" data-task="${escapeHtml(entry.taskId ?? '')}">
  <div class="carelog-new-date-col">
    <span class="carelog-new-date-dow">${dayAbbr}</span>
    <span class="carelog-new-date-num">${dayNum}</span>
  </div>
  <div class="carelog-new-card">
    ${iconTileHtml}
    <div class="carelog-new-info">
      <span class="carelog-new-name">${escapeHtml(entry.taskName ?? '')}</span>
      <span class="carelog-new-time${isSkipped ? ' activity-sub-skipped' : ''}">${isSkipped ? 'Skipped' : '—'}</span>
    </div>
    <div class="carelog-new-owner" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</div>
  </div>
</div>`;
}

function renderCareLogNoteRow(note) {
  const member  = membersCache.find(m => m.display_name === note.author);
  const color   = member?.color ?? '#888';
  const initial = (note.author ?? '?')[0].toUpperCase();

  const dateStr = note.createdAt ? note.createdAt.split('T')[0] : null;
  let dayAbbr = '—';
  let dayNum  = '—';
  let timeStr = '—';
  if (note.createdAt) {
    const d = new Date(note.createdAt);
    if (!isNaN(d.getTime())) {
      dayAbbr = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
      dayNum  = String(d.getDate());
      timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
  }

  const preview = note.note.length > 30 ? note.note.slice(0, 30) + '…' : note.note;

  const photoThumbHtml = note.photoUrl
    ? `<span class="care-log-thumb"><img class="carelog-note-thumb" src="${escapeHtml(note.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(note.photoUrl)}" data-note-id="${escapeHtml(note.id)}" data-plant-id="${escapeHtml(note.plantId)}" style="width:36px;height:36px;border-radius:7px;border:1.5px solid #c8c8c8;" /></span>`
    : '';

  return `<div class="carelog-new-row" data-action="carelog-open-edit-note" data-plant="${escapeHtml(note.plantId)}" data-note="${escapeHtml(note.id)}">
  <div class="carelog-new-date-col">
    <span class="carelog-new-date-dow">${dayAbbr}</span>
    <span class="carelog-new-date-num">${dayNum}</span>
  </div>
  <div class="carelog-new-card">
    <span style="width:36px;height:36px;background:#e8f0fb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">💬</span>
    <div class="carelog-new-info">
      <span class="carelog-new-name">Note added</span>
      <span class="carelog-new-time">${escapeHtml(preview)}</span>
    </div>
    ${photoThumbHtml}
    <div class="carelog-new-owner" style="background:${escapeHtml(color)};">${escapeHtml(initial)}</div>
  </div>
</div>`;
}

function renderCareLogUpcomingRow(task) {
  const cfg        = getTaskConfig(task);
  const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);
  const ownerColor = membersCache.find(m => m.display_name === task.owner)?.color
    ?? USERS[task.owner]?.color ?? '#666';

  return `
  <div class="carelog-upcoming-row">
    <span class="carelog-row-icon">${cfg.icon}</span>
    <div class="carelog-upcoming-meta">
      <span class="carelog-row-name">${escapeHtml(cfg.name)}</span>
      <span class="carelog-row-sub">${escapeHtml(recurrenceLabel(task))}</span>
    </div>
    <span class="owner-dot" style="background:${escapeHtml(ownerColor)}"></span>
    <span class="task-status-badge ${dueCls}">${escapeHtml(dueLabel)}</span>
  </div>`;
}

function renderCareLogPastRow(entry, linkedNote, plant) {
  const matchedTask = plant?.tasks?.find(t => t.id === entry.taskId);
  const cfg         = matchedTask ? getTaskConfig(matchedTask) : null;
  const taskIcon    = cfg?.icon ?? getTaskConfig({ type: entry.taskType, name: entry.taskName })?.icon ?? '✅';
  const member      = membersCache.find(m => m.display_name === entry.author);
  const color       = member?.color ?? '#888';
  const diff       = daysBetween(entry.date, todayStr());
  const when       = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
  const noteLine   = linkedNote
    ? `<div class="carelog-past-note">${escapeHtml(linkedNote.note)}</div>`
    : '';

  return `
  <div class="carelog-past-row">
    <span class="carelog-row-icon">✅</span>
    <div class="carelog-past-meta">
      <div class="carelog-past-main">
        <span style="background:${color}20;color:${color};font-weight:500;border-radius:20px;padding:2px 9px;font-size:13px;display:inline-block;">${escapeHtml(entry.author)}</span> ${taskIcon} ${escapeHtml(entry.taskName)}
      </div>
      ${noteLine}
    </div>
    <div class="carelog-past-date">${when}</div>
  </div>`;
}

function renderExpandedTaskRow(plantId, task) {
  const cfg        = getTaskConfig(task);
  const ownerColor = membersCache.find(m => m.display_name === task.owner)?.color
    ?? USERS[task.owner]?.color ?? '#666';
  const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);
  const otherOwner = task.owner === 'Matu' ? 'Vale' : 'Matu';
  const doneToday  = task.lastDone === todayStr();

  return `
  <div class="expanded-task-row" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">
    <div class="expanded-task-top">
      <span class="task-icon">${cfg.icon}</span>
      <div class="expanded-task-meta">
        <span class="task-name">${escapeHtml(cfg.name)}</span>
        <span class="task-meta-line">${escapeHtml(recurrenceLabel(task))} &middot; ${lastDoneLabel(task)}</span>
      </div>
      <span class="owner-dot" style="background:${escapeHtml(ownerColor)}" title="${escapeHtml(task.owner)}"></span>
      <span class="task-status-badge ${dueCls}">${escapeHtml(dueLabel)}</span>
    </div>
    <div class="task-actions">
      ${doneToday
        ? `<button class="btn btn-warning" data-action="undo-mark-done" data-plant="${plantId}" data-task="${task.id}">&#8630; Undo</button>`
        : `<button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; Done</button>
           <button class="btn btn-secondary" data-action="mark-done-with-note" data-plant="${plantId}" data-task="${task.id}">&#10003; + Note</button>`
      }
      <button class="btn btn-secondary" data-action="reassign-task" data-plant="${plantId}" data-task="${task.id}">&#8644; ${escapeHtml(otherOwner)}</button>
      <button class="btn btn-ghost" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">&#9999;&#xFE0E;</button>
    </div>
  </div>`;
}

function renderCompactTaskRow(plantId, task) {
  const cfg        = getTaskConfig(task);
  const ownerColor = membersCache.find(m => m.display_name === task.owner)?.color
    ?? USERS[task.owner]?.color ?? '#666';
  const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);

  return `
  <div class="compact-task-row" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">
    <span class="task-icon">${cfg.icon}</span>
    <div class="compact-task-meta">
      <span class="task-name">${escapeHtml(cfg.name)}</span>
      <span class="task-meta-line">${escapeHtml(recurrenceLabel(task))}</span>
    </div>
    <span class="owner-dot" style="background:${escapeHtml(ownerColor)}" title="${escapeHtml(task.owner)}"></span>
    <span class="task-status-badge ${dueCls}">${escapeHtml(dueLabel)}</span>
    <span class="task-edit-chevron">&#8250;</span>
  </div>`;
}

function renderTaskCard(plantId, task, onboardingMode = false) {
  const cfg = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const ownerCls = task.owner.toLowerCase();
  const otherOwner = task.owner === 'Matu' ? 'Vale' : 'Matu';

  const cardStyle = onboardingMode
    ? ' style="border: 1.5px solid #3a6b3a; background: #f4faf4;"'
    : '';

  let html = `
  <div class="task-card${isPaused ? ' paused' : ''}"${cardStyle}>
    <div class="task-card-inner">
      <div class="task-left-bar ${cfg.type}"></div>
      <div class="task-body">
        <div class="task-row1">
          <span class="task-icon">${cfg.icon}</span>
          <span class="task-name">${cfg.name}</span>
          ${isPaused ? '<span class="task-paused-badge">Paused</span>' : ''}
          <span class="owner-badge ${ownerCls}">${task.owner}</span>
        </div>
        <div class="task-meta">${escapeHtml(recurrenceLabel(task))} &middot; ${lastDoneLabel(task)}</div>`;

  if (!isPaused) {
    const _daysDebug = daysUntilDue(task);
    console.log('[due-debug]', { id: task.id, lastDone: task.lastDone, today: todayStr(), daysUntilDue: _daysDebug, recurrenceType: task.recurrenceType });
    const { label: dueLabel, cls: dueCls } = dueLabelAndClass(task);
    const dueIcon = dueCls === 'due' ? '&#9888;&#65039;' : dueCls === 'soon' ? '&#128276;' : '&#10003;';
    html += `<div class="task-due-label ${dueCls}">${dueIcon} ${escapeHtml(dueLabel)}</div>`;
  }

  if (task.note) {
    html += `<div class="task-note-text">${escapeHtml(task.note)}</div>`;
  }

  if (onboardingMode) {
    html += `
        <div class="task-actions">
          <button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; Done</button>
        </div>`;
  } else if (isPaused) {
    html += `
        <div class="task-actions">
          <button class="btn btn-secondary" data-action="resume-task" data-plant="${plantId}" data-task="${task.id}">&#9654; Resume</button>
          <button class="btn btn-ghost task-edit-icon-btn" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">&#9999;&#xFE0E;</button>
        </div>`;
  } else {
    const doneToday = task.lastDone === todayStr();
    html += `
        <div class="task-actions">
          ${doneToday
            ? `<button class="btn btn-warning" data-action="undo-mark-done" data-plant="${plantId}" data-task="${task.id}">&#8630; Undo</button>`
            : `<button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; Done</button>
               <button class="btn btn-secondary" data-action="mark-done-with-note" data-plant="${plantId}" data-task="${task.id}">&#10003; + Note</button>`
          }
          <button class="btn btn-secondary" data-action="reassign-task" data-plant="${plantId}" data-task="${task.id}">&#8644; ${escapeHtml(otherOwner)}</button>
          <button class="btn btn-ghost task-edit-icon-btn" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">&#9999;&#xFE0E;</button>
        </div>`;
  }

  html += `
      </div>
    </div>
  </div>`;

  return html;
}

function renderTaskRow(plantId, task) {
  const cfg      = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const doneToday = !isPaused && task.lastDone === todayStr();

  // Meta line: recurrence text
  const recType = task.recurrenceType ?? 'interval';
  let recText;
  if (recType === 'one-off') {
    recText = 'One-off';
  } else if (recType === 'weekdays') {
    const dInts  = (task.weekdays ?? []).slice().sort((a, b) => a - b);
    const abbrev = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    recText = dInts.length > 0 ? `Every ${dInts.map(d => abbrev[d]).join(', ')}` : 'Days of week';
  } else {
    const n = task.frequencyDays ?? 1;
    recText = `Every ${n} day${n !== 1 ? 's' : ''}`;
  }

  // Meta line: urgency text (neutral color regardless of due date)
  let urgencyText;
  if (isPaused) {
    urgencyText = 'Paused';
  } else if (doneToday) {
    urgencyText = '✓ done today';
  } else {
    const days = daysUntilDue(task);
    if (recType === 'one-off') {
      if (days === Infinity) {
        urgencyText = '✓ done';
      } else {
        const nd = computeNextDue(task);
        const ds = nd ? new Date(nd + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
        if (days > 1)        urgencyText = `due ${ds}`;
        else if (days === 1) urgencyText = 'due tomorrow';
        else if (days === 0) urgencyText = 'due today';
        else                 urgencyText = 'overdue';
      }
    } else {
      if (days < 0)        urgencyText = 'overdue';
      else if (days === 0) urgencyText = 'due today';
      else if (days === 1) urgencyText = 'due tomorrow';
      else                 urgencyText = `due in ${days} days`;
    }
  }

  // Owner circle
  const ownerMember = membersCache.find(m => m.display_name === task.owner);
  const ownerColor  = ownerMember?.color ?? '#888';
  const ownerInit   = (task.owner ?? '?')[0].toUpperCase();

  // Right-edge button: pause-badge for paused tasks (resumes on tap). No button otherwise.
  const rightHtml = isPaused
    ? `<button class="task-row-check task-row-pause" data-action="resume-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(task.id)}" aria-label="Resume" style="background:#f0a500;border:none;border-radius:50%;width:30px;height:30px;display:inline-flex;align-items:center;justify-content:center;gap:3px;flex-shrink:0;padding:0;cursor:pointer;">
        <span style="width:3px;height:10px;background:white;border-radius:1px;display:inline-block;"></span>
        <span style="width:3px;height:10px;background:white;border-radius:1px;display:inline-block;"></span>
      </button>`
    : '';

  return `<div class="task-row${isPaused ? ' task-row--paused' : ''}" data-action="edit-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(task.id)}">
  <span class="task-row-tile task-row-tile--${escapeHtml(cfg.type)}">${cfg.icon}</span>
  <span class="task-row-divider"></span>
  <div class="task-row-content">
    <div class="task-row-name">${escapeHtml(cfg.name)}</div>
    <div class="task-row-meta" style="color:#8a8d86;">${escapeHtml(recText)} &middot; ${escapeHtml(urgencyText)}</div>
  </div>
  <div class="task-row-owner" style="background:${escapeHtml(ownerColor)};">${escapeHtml(ownerInit)}</div>
  ${rightHtml}
</div>`;
}

function renderNoteCard(note) {
  const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
  const isOwn = note.memberId && note.memberId === activeMemberId;
  const noteMember = membersCache.find(m => m.display_name === note.author);
  const noteColor = noteMember?.color ?? '#888';
  const isEditing = editingNoteId === note.id;

  const actions = isOwn
    ? `<div class="health-note-btns">
         <button class="note-action-btn" data-action="edit-note" data-note="${note.id}" title="Edit">&#9999;&#xFE0E;</button>
         <button class="note-action-btn note-action-btn--delete" data-action="delete-note" data-plant="${note.plantId}" data-note="${note.id}" title="Delete">&#128465;&#xFE0E;</button>
       </div>`
    : '';

  const taskMeta = (() => {
    if (!note.taskId) return '';
    const plant = getPlant(note.plantId);
    const task = plant?.tasks.find(t => t.id === note.taskId);
    if (!task) return '';
    const cfg = getTaskConfig(task);
    return ` &middot; ${cfg.icon} after ${escapeHtml(cfg.name)}`;
  })();

  const body = isEditing
    ? `<textarea class="form-textarea note-edit-textarea" data-note="${note.id}" style="min-height:80px">${escapeHtml(note.note)}</textarea>
       <div class="note-edit-actions">
         <button class="btn btn-ghost btn-sm" data-action="cancel-note-edit" data-note="${note.id}">Cancel</button>
         <button class="btn btn-primary btn-sm" data-action="save-note-edit" data-note="${note.id}">Save</button>
       </div>`
    : `<div class="health-note-text">${escapeHtml(note.note)}</div>`;

  return `
  <div class="health-note-card">
    <div class="health-note-header">
      <span class="health-note-meta">
        <span style="background:${noteColor}20;color:${noteColor};font-weight:500;border-radius:20px;padding:2px 9px;font-size:13px;display:inline-block;">${escapeHtml(note.author)}</span>
        &middot; ${formatNoteDate(note.createdAt)}${taskMeta}
      </span>
      ${actions}
    </div>
    ${body}
  </div>`;
}

function renderCareLogEntry(entry) {
  const type = entry.taskType ?? TASK_CONFIG[entry.taskId]?.type ?? 'custom';
  return `
  <div class="care-log-entry">
    <div class="care-log-dot ${type}"></div>
    <div class="care-log-info">
      <div class="care-log-task">${escapeHtml(entry.taskName)}</div>
    </div>
    <div class="care-log-date">${formatDateShort(entry.date)}</div>
  </div>`;
}

// ============================================================
// BOTTOM SHEET
// ============================================================

function openSheet(contentHtml) {
  document.getElementById('sheet-content').innerHTML = contentHtml;
  document.getElementById('sheet').classList.add('active');
  document.getElementById('overlay').classList.add('active');
}

function openOverdueActionSheet(plantId, taskId) {
  const plant = getPlant(plantId);
  const task  = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;
  const cfg     = getTaskConfig(task);
  const isOneOff = (task.recurrenceType ?? 'interval') === 'one-off';

  const skipBtnHtml = isOneOff ? '' : `
    <button class="btn btn-ghost" data-action="caring-skip-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" style="width:100%;text-align:center;padding:14px;font-size:15px;">⏭ Skip this time</button>`;

  state.sheetMode = 'overdue-action';
  state.sheetData = { plantId, taskId };

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <span style="width:36px;height:36px;background:#eef3eb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${cfg.icon}</span>
      <div style="display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</div>
        <div style="font-size:12px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name)}</div>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      <button class="btn btn-primary" data-action="caring-action-mark-done" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" style="width:100%;text-align:center;padding:14px;font-size:15px;">✓ Mark done</button>
      ${skipBtnHtml}
      <button class="btn btn-ghost" data-action="caring-open-edit-task" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" style="width:100%;text-align:center;padding:14px;font-size:15px;">Edit task</button>
      <button class="btn btn-ghost" data-action="close-sheet" style="width:100%;text-align:center;padding:14px;font-size:15px;margin-top:6px;">Cancel</button>
    </div>
  `);
}

// ============================================================
// RESCHEDULE PROMPT (off-schedule mark-done)
// ============================================================

// Sunday of the week containing dateStr (Sun=0…Sat=6)
function getSundayOfWeek(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split('T')[0];
}

// Next n occurrence dates (strictly after today) on the sequence
// anchorDate + interval, +2*interval, +3*interval, …
function intervalOccurrencesAfterToday(anchorDate, intervalDays, n) {
  const out = [];
  const today = todayStr();
  let cursor = addDays(anchorDate, intervalDays);
  while (cursor <= today) cursor = addDays(cursor, intervalDays);
  while (out.length < n) {
    out.push(cursor);
    cursor = addDays(cursor, intervalDays);
  }
  return out;
}

// Next n occurrence dates (strictly after today) of any of the given weekday numbers.
function weekdayOccurrencesAfterToday(weekdays, n) {
  if (!weekdays || weekdays.length === 0) return [];
  const out = [];
  let cursor = todayStr();
  while (out.length < n) {
    cursor = addDays(cursor, 1);
    const dow = new Date(cursor + 'T12:00:00').getDay();
    if (weekdays.includes(dow)) out.push(cursor);
  }
  return out;
}

function renderReschedCalendar(startSun, endDate, highlightSet, highlightBg, highlightFg) {
  // Pad endDate up to its Saturday so the last row is complete.
  const endSat = addDays(endDate, 6 - new Date(endDate + 'T12:00:00').getDay());
  const headers = ['S','M','T','W','T','F','S']
    .map(l => `<div style="font-size:10px;color:#8a8d86;text-align:center;padding:2px 0;font-weight:500;">${l}</div>`)
    .join('');
  let cells = '';
  let cursor = startSun;
  while (cursor <= endSat) {
    const dObj = new Date(cursor + 'T12:00:00');
    const day = dObj.getDate();
    const hl  = highlightSet.has(cursor);
    const cellStyle = hl
      ? `background:${highlightBg};color:${highlightFg};font-weight:600;border-radius:6px;`
      : `color:#bdbdbd;`;
    cells += `<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:11px;${cellStyle}">${day}</div>`;
    cursor = addDays(cursor, 1);
  }
  return `
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">${headers}</div>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;margin-top:2px;">${cells}</div>
  `;
}

function showReschedulePrompt(plantId, taskId, displacement, mostRecentDueDate) {
  const plant = getPlant(plantId);
  const task  = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;
  const cfg     = getTaskConfig(task);
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'one-off') return;

  const isLate = displacement > 0;
  const absDays = Math.abs(displacement);

  // Compute Original and Modified occurrence dates.
  let originalDates = [];
  let modifiedDates = [];
  let shiftedWeekdays = null;
  let originalWeekdaysLabel = '';
  let modifiedWeekdaysLabel = '';

  if (recType === 'weekdays') {
    const origWd = (task.weekdays ?? []).slice();
    shiftedWeekdays = origWd.map(d => ((d + displacement) % 7 + 7) % 7);
    const sortAndDedupe = arr => Array.from(new Set(arr)).sort((a, b) => a - b);
    const origSorted = sortAndDedupe(origWd);
    const modSorted  = sortAndDedupe(shiftedWeekdays);
    shiftedWeekdays = modSorted;
    const full = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    originalWeekdaysLabel = origSorted.map(d => full[d]).join(' & ');
    modifiedWeekdaysLabel = modSorted.map(d => full[d]).join(' & ');
    originalDates = weekdayOccurrencesAfterToday(origSorted, 3);
    modifiedDates = weekdayOccurrencesAfterToday(modSorted, 3);
  } else {
    const interval = task.frequencyDays ?? 1;
    originalDates = intervalOccurrencesAfterToday(mostRecentDueDate, interval, 3);
    // Modified: shift each original date by displacement.
    modifiedDates = originalDates.map(d => addDays(d, displacement));
  }

  const today = todayStr();
  const modSet = new Set(modifiedDates);

  // Keep-original future due set: future Original-schedule occurrences after today.
  // For early case, most_recent_due is itself in the future and worth showing.
  const keepFutureSet = new Set(originalDates);
  if (mostRecentDueDate > today) keepFutureSet.add(mostRecentDueDate);

  // Direction palette.
  const headlineColor   = isLate ? '#a32d2d' : '#2e6b28';
  const todayCircleBg   = isLate ? '#fde8e8' : '#e8f5e9';
  const todayCircleEdge = isLate ? '#a32d2d' : '#2e6b28';
  const todayCircleFg   = isLate ? '#a32d2d' : '#2e6b28';
  const modifyCardBg    = '#f0f7ec';
  const modifyCardBd    = '#4a8c3f';
  const modifyTitleFg   = '#2e6b28';
  const modifyPillBg    = '#c8e6c9';
  const modifyPillFg    = '#1b5e20';
  const modifyFutureBg  = '#4a8c3f';
  const modifyFutureFg  = '#ffffff';

  const deltaText = isLate
    ? `→ ${displacement} ${displacement === 1 ? 'day' : 'days'} later`
    : `← ${Math.abs(displacement)} ${Math.abs(displacement) === 1 ? 'day' : 'days'} earlier`;

  const recurrenceSummary = recType === 'weekdays'
    ? originalWeekdaysLabel
    : `Every ${task.frequencyDays ?? 1} days`;

  const formatFullDate = (s) => new Date(s + 'T12:00:00')
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Calendar layout: 4 rows, week starts Monday.
  // Keep card: anchored to missed due (late) or today (early).
  // Modify card: anchored to today.
  const WEEKS = 4;
  const keepStartMonday   = getMondayOfWeek(isLate ? mostRecentDueDate : today);
  const modifyStartMonday = getMondayOfWeek(today);

  const cellBase = 'font-size:11px;text-align:center;padding:4px 2px;border-radius:6px;line-height:1.8;box-sizing:border-box;';
  const dayHeaders = ['M','T','W','T','F','S','S']
    .map(l => `<div style="font-size:9px;color:#cccccc;text-align:center;padding:2px 0;">${l}</div>`)
    .join('');

  const renderCalendar = ({ startMonday, firstVisible, todayCellHasBg, futureDueSet, futureDueBg, futureDueFg, showMissedDue }) => {
    const endDate = addDays(startMonday, WEEKS * 7 - 1);
    const startMonthLbl = new Date(startMonday + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' });
    const endMonthLbl   = new Date(endDate     + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' });
    const monthLabel    = startMonthLbl === endMonthLbl ? startMonthLbl : `${startMonthLbl} – ${endMonthLbl}`;

    let cells = '';
    let cursor = startMonday;
    for (let i = 0; i < WEEKS * 7; i++) {
      const day = new Date(cursor + 'T12:00:00').getDate();
      const isToday      = cursor === today;
      const isMissedDue  = showMissedDue && isLate && cursor === mostRecentDueDate;
      const isFutureDue  = futureDueSet.has(cursor) && !isMissedDue && !isToday;
      const isInvisible  = firstVisible && cursor < firstVisible;

      if (isInvisible) {
        cells += `<div style="${cellBase}visibility:hidden;">${day}</div>`;
      } else if (isToday) {
        const cellBg = todayCellHasBg ? `background:${todayCircleBg};` : '';
        const circle = `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;font-size:11px;font-weight:700;border:1.5px solid ${todayCircleEdge};background:${todayCircleBg};color:${todayCircleFg};">${day}</span>`;
        cells += `<div style="${cellBase}${cellBg}padding:1px 2px;">${circle}</div>`;
      } else if (isMissedDue) {
        cells += `<div style="${cellBase}background:#e8e8e6;color:#999999;font-weight:700;">${day}</div>`;
      } else if (isFutureDue) {
        cells += `<div style="${cellBase}background:${futureDueBg};color:${futureDueFg};font-weight:700;">${day}</div>`;
      } else {
        cells += `<div style="${cellBase}color:#cccccc;">${day}</div>`;
      }
      cursor = addDays(cursor, 1);
    }

    return `
      <div style="font-size:10px;color:#bbbbbb;text-align:center;margin-bottom:4px;">${escapeHtml(monthLabel)}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;">${dayHeaders}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;">${cells}</div>
    `;
  };

  const keepCalendar = renderCalendar({
    startMonday:     keepStartMonday,
    firstVisible:    isLate ? mostRecentDueDate : today,
    todayCellHasBg:  true,
    futureDueSet:    keepFutureSet,
    futureDueBg:     '#e8e8e6',
    futureDueFg:     '#444444',
    showMissedDue:   true,
  });

  const modifyCalendar = renderCalendar({
    startMonday:     modifyStartMonday,
    firstVisible:    null,
    todayCellHasBg:  false,
    futureDueSet:    modSet,
    futureDueBg:     modifyFutureBg,
    futureDueFg:     modifyFutureFg,
    showMissedDue:   false,
  });

  const cardHtml = `
    <div style="background:#ffffff;border-radius:20px;padding:24px 20px;max-width:390px;width:calc(100% - 32px);max-height:calc(100vh - 32px);overflow:hidden;box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f7f8f6;border-radius:12px;margin-bottom:16px;">
        <div style="width:44px;height:44px;border-radius:10px;background:${isLate ? '#fce8e8' : '#e8f5e9'};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">${cfg.icon}</div>
        <div>
          <div style="font-size:15px;font-weight:700;color:#1a2e1a;margin:0 0 2px;">${escapeHtml(cfg.name)} · ${escapeHtml(plant.name)}</div>
          <div style="font-size:12px;color:#6b7c6b;">${escapeHtml(recurrenceSummary)} · due ${formatDateShort(mostRecentDueDate)}</div>
        </div>
      </div>
      <div style="font-size:18px;font-weight:600;color:${headlineColor};text-align:center;margin-bottom:4px;">${isLate ? `Running ${absDays} days late` : `${absDays} days early`}</div>
      <div style="font-size:12px;color:#888;text-align:center;margin-bottom:16px;">Today is ${formatFullDate(today)}</div>
      <div data-action="reschedule-keep-original" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" data-direction="${isLate ? 'late' : 'early'}" data-days="${absDays}" style="background:#f7f8f6;border:1px solid #d8ddd4;border-radius:14px;padding:14px;cursor:pointer;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:14px;font-weight:600;color:#4a5e4a;">Keep Original Schedule</div>
          <div style="font-size:20px;font-weight:300;color:#aaaaaa;line-height:1;">›</div>
        </div>
        ${keepCalendar}
        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
          ${isLate ? `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:2px;background:#fce8e8;border:1px solid #f09595;"></div>Missed</div>` : ''}
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:50%;border:1.5px solid ${todayCircleEdge};"></div>Today</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:2px;background:#d8ddd4;"></div>Next occurrences</div>
        </div>
      </div>
      <div data-action="reschedule-modify" data-plant="${escapeHtml(plantId)}" data-task="${escapeHtml(taskId)}" data-direction="${isLate ? 'late' : 'early'}" data-days="${absDays}" style="background:${modifyCardBg};border:2px solid #4a8c3f;border-radius:14px;padding:14px;cursor:pointer;margin-bottom:10px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div style="font-size:14px;font-weight:700;color:${modifyTitleFg};">Accept Modified Schedule</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="background:${modifyPillBg};color:${modifyPillFg};font-size:12px;font-weight:500;padding:2px 8px;border-radius:20px;">${deltaText}</div>
            <div style="font-size:20px;font-weight:300;color:#2e6b28;line-height:1;">›</div>
          </div>
        </div>
        ${modifyCalendar}
        <div style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:50%;border:1.5px solid ${todayCircleEdge};"></div>Today</div>
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#888;"><div style="width:8px;height:8px;border-radius:2px;background:#4a8c3f;"></div>Next occurrences</div>
        </div>
      </div>
    </div>`;

  // Remove any existing overlay (in case of overlapping mark-dones).
  closeReschedulePrompt();

  const overlay = document.createElement('div');
  overlay.id = 'reschedule-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;overflow:hidden;';

  // Stash recurrence shift data so the action handler can apply it without
  // recomputing.
  overlay.dataset.modifiedFirstDate = modifiedDates[0] ?? '';
  if (recType === 'weekdays' && shiftedWeekdays) {
    overlay.dataset.modifiedWeekdays = JSON.stringify(shiftedWeekdays);
  }

  overlay.innerHTML = cardHtml;
  overlay.addEventListener('click', handleEvent);
  document.body.appendChild(overlay);
}

function closeReschedulePrompt() {
  const el = document.getElementById('reschedule-overlay');
  if (el) el.remove();
}

function closeSheet() {
  const sheet = document.getElementById('sheet');
  sheet.style.transform = '';
  sheet.classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
  state.sheetMode = null;
  state.sheetData = {};
  // Clear content after transition to release DOM listeners and touch state
  setTimeout(() => { document.getElementById('sheet-content').innerHTML = ''; }, 320);
}

function openMenu() {
  renderMenuPanel();
  document.body.classList.add('menu-open');
  document.getElementById('menu-panel').classList.add('active');
  document.getElementById('menu-overlay').classList.add('active');
}

function closeMenu() {
  document.body.classList.remove('menu-open');
  document.getElementById('menu-panel').classList.remove('active');
  document.getElementById('menu-overlay').classList.remove('active');
}

function openCalendarSyncSheet() {
  if (!currentMemberId || !householdId) {
    showToast('Loading household data… please try again in a moment.');
    return;
  }
  const base       = import.meta.env.VITE_SUPABASE_URL;
  const baseHost   = base.replace('https://', '');
  const meHttps    = `${base}/functions/v1/get-calendar-feed?member_id=${currentMemberId}`;
  const meWebcal   = `webcal://${baseHost}/functions/v1/get-calendar-feed?member_id=${currentMemberId}`;
  const hhHttps    = `${base}/functions/v1/get-calendar-feed?household_id=${householdId}`;
  const hhWebcal   = `webcal://${baseHost}/functions/v1/get-calendar-feed?household_id=${householdId}`;

  const urlPill = (url) => `
    <div style="background:#f4f5f2;border-radius:8px;padding:8px 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px;" title="${escapeHtml(url)}">${escapeHtml(url)}</div>`;

  openSheet(`
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
      <div class="sheet-title" style="margin-bottom:0;">Sync to Calendar</div>
      <button type="button" class="menu-close" data-action="close-sheet" aria-label="Close" style="position:static;">&#10005;</button>
    </div>
    <p style="font-size:13px;color:var(--text-muted);line-height:1.45;margin:0 0 18px;">Subscribe in your calendar app to see upcoming plant care tasks. The feed updates automatically.</p>

    <div class="form-group" style="margin-bottom:18px;">
      <div class="form-label">My Tasks</div>
      <div style="font-size:12px;color:var(--text-muted);margin:-2px 0 8px;">Only tasks assigned to you</div>
      ${urlPill(meHttps)}
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" data-action="copy-calendar-link" data-url="${escapeHtml(meHttps)}" style="flex:1;">Copy link</button>
        <button class="btn btn-primary" data-action="subscribe-calendar" data-url="${escapeHtml(meWebcal)}" style="flex:1;">Subscribe</button>
      </div>
    </div>

    <div class="form-group" style="margin-bottom:8px;">
      <div class="form-label">All Household Tasks</div>
      <div style="font-size:12px;color:var(--text-muted);margin:-2px 0 8px;">Every task across your household</div>
      ${urlPill(hhHttps)}
      <div style="display:flex;gap:8px;">
        <button class="btn btn-ghost" data-action="copy-calendar-link" data-url="${escapeHtml(hhHttps)}" style="flex:1;">Copy link</button>
        <button class="btn btn-primary" data-action="subscribe-calendar" data-url="${escapeHtml(hhWebcal)}" style="flex:1;">Subscribe</button>
      </div>
    </div>
  `);
}

async function handleCopyCalendarLink(btn) {
  const url = btn?.dataset?.url;
  if (!url) return;
  try {
    await navigator.clipboard.writeText(url);
  } catch (_) {
    return;
  }
  const original = btn.textContent;
  btn.textContent = 'Copied!';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 2000);
}

function renderMenuPanel() {
  document.getElementById('menu-content').innerHTML = `
    <button class="menu-close" data-action="close-menu">&#10005;</button>
    <div class="menu-section">
      <div class="menu-section-title">Profile</div>
      <div class="menu-user-name">&#128100; ${escapeHtml(activeUser)}</div>
      <button class="menu-item" data-action="change-password">Change Password</button>
      ${localStorage.getItem(`push_accepted_${activeUser}`)
        ? `<button class="menu-item" style="color:#3a6b3a;opacity:0.7;" disabled>🔔 Notifications &middot; On</button>`
        : `<button class="menu-item" data-action="menu-notifications">🔔 Notifications &middot; <span style="color:#aaa;">Off</span></button>`}
    </div>
    <div class="menu-section">
      <div class="menu-section-title">Household</div>
      <button class="menu-item" disabled>Change Household <span class="menu-coming-soon">Coming soon</span></button>
    </div>
    <div class="menu-section">
      <div class="menu-section-title">Calendar</div>
      <button class="menu-item" data-action="open-calendar-sync">📅 Sync to Calendar</button>
    </div>
    <div class="menu-section">
      <div class="menu-section-title">Account</div>
      <button class="menu-item" data-action="menu-export-data">&#8681; Export Backup</button>
      <button class="menu-item" data-action="menu-import-data">&#8679; Import Backup</button>
      <button class="menu-item" data-action="menu-show-onboarding">&#128218; Show getting started guide</button>
      <button class="menu-item menu-item-danger" data-action="menu-sign-out">Sign Out</button>
    </div>
  `;
}

function renderNotificationsSheet() {
  openSheet(`
    <div class="sheet-title">Notifications</div>
    <p style="font-size:14px;color:#555;line-height:1.5;margin-bottom:20px;">Get a heads-up on your phone whenever someone in your household completes a care task.</p>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-enable-notifications">Enable</button>
    </div>
  `);
}

function renderChangePasswordSheet() {
  openSheet(`
    <div class="sheet-title">Change Password</div>
    <div class="form-group">
      <label class="form-label">New password</label>
      <input type="password" class="form-input" id="sheet-new-password" placeholder="At least 8 characters" autocomplete="new-password">
    </div>
    <div class="form-group">
      <label class="form-label">Confirm password</label>
      <input type="password" class="form-input" id="sheet-confirm-password" placeholder="Repeat new password" autocomplete="new-password">
    </div>
    <div id="change-password-error" style="color:var(--due);font-size:14px;margin-bottom:8px;display:none;"></div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">Cancel</button>
      <button class="btn btn-primary" data-action="save-change-password">Save</button>
    </div>
  `);
}

async function handleChangePassword() {
  if (isSaving) return;
  const password = document.getElementById('sheet-new-password')?.value ?? '';
  const confirm  = document.getElementById('sheet-confirm-password')?.value ?? '';
  const errorEl  = document.getElementById('change-password-error');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  };

  if (password.length < 8) { showError('Password must be at least 8 characters.'); return; }
  if (password !== confirm) { showError('Passwords do not match.'); return; }

  isSaving = true;
  try {
    const { error } = await supabaseClient.auth.updateUser({ password });
    if (error) { showError(error.message); return; }

    closeSheet();
    showToast('&#128274; Password updated!');
  } finally {
    isSaving = false;
  }
}

function renderOwnerPills(selectedOwner) {
  return membersCache.map(m => {
    const color = m.color ?? '#2e7d51';
    const initial = (m.display_name ?? '?')[0].toUpperCase();
    const sel = m.display_name === selectedOwner ? 'selected' : '';
    return `<div class="owner-pill ${sel}" data-action="sheet-set-owner" data-owner="${escapeHtml(m.display_name)}" style="--pill-color:${escapeHtml(color)}">` +
      `<span class="owner-pill-check">✓</span>` +
      `<span class="owner-pill-initial">${escapeHtml(initial)}</span>${escapeHtml(m.display_name)}</div>`;
  }).join('');
}

function renderEditTaskSheet(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  const plant       = getPlant(plantId);
  const cfg         = getTaskConfig(task);
  const isPaused    = task.paused ?? false;
  const recType     = task.recurrenceType ?? 'interval';
  const isRepeating = recType !== 'one-off';
  const curYear     = new Date().getFullYear();

  state.sheetMode = 'edit-task';
  state.sheetData = { plantId, taskId };
  sheetEntryTab = plantDetailTab;

  const weekdayBtns = WEEKDAY_NAMES.map((name, i) => {
    const sel = (task.weekdays ?? []).includes(i) ? 'selected' : '';
    return `<button class="weekday-btn ${sel}" data-action="sheet-toggle-weekday" data-day="${i}">${name}</button>`;
  }).join('');

  const isCustom    = !TASK_CONFIG[task.id];
  const overrideDate = task.nextDueOverride && task.nextDueOverride >= todayStr() ? task.nextDueOverride : null;

  const rowLabelStyle = 'display:block;font-size:11px;color:#8a8d86;margin:0 0 4px;text-transform:none;font-weight:500;letter-spacing:normal;';

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:0.5px solid #e8ece6;">
      <button type="button" class="edit-task-icon-tile" ${isCustom ? `data-action="edit-task-toggle-icon-picker" data-emoji="${escapeHtml(cfg.icon)}"` : ''} style="width:36px;height:36px;background:#eef3eb;border-radius:8px;${isCustom ? 'border:1.5px dashed #a0c0a0;cursor:pointer;' : 'border:none;cursor:default;'}display:flex;align-items:center;justify-content:center;font-size:20px;padding:0;flex-shrink:0;">${cfg.icon}</button>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(cfg.name)}</div>
        <div style="font-size:12px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant?.name ?? '')}</div>
        ${isCustom ? `<div style="font-size:10px;color:#3a6b3a;margin-top:2px;">tap icon to change</div>` : ''}
      </div>
    </div>

    ${isCustom ? `
    <div id="edit-task-icon-picker" class="icon-picker" style="display:none;padding:8px 16px;border-bottom:0.5px solid #f0f0ee;">
      ${CUSTOM_ICONS.map(ic =>
        `<div class="icon-option${ic === cfg.icon ? ' selected' : ''}" data-action="edit-task-pick-icon" data-icon="${ic}">${ic}</div>`
      ).join('')}
    </div>

    <div style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="${rowLabelStyle}">Task name</label>
      <input type="text" class="form-input" id="sheet-task-name" value="${escapeHtml(task.name ?? '')}" style="background:#f8f8f6;border:0.5px solid #e0e0dc;border-radius:8px;padding:8px 10px;font-size:14px;width:100%;box-sizing:border-box;">
    </div>` : ''}

    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="font-size:11px;color:#8a8d86;margin:0;text-transform:none;font-weight:500;letter-spacing:normal;flex-shrink:0;">Owner</label>
      <div class="owner-pill-group" style="flex:1;display:flex;gap:6px;flex-wrap:wrap;margin:0;">${renderOwnerPills(task.owner)}</div>
    </div>

    <div style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" id="task-due-label" style="${rowLabelStyle}">${isRepeating ? 'First due date' : 'Due date'}</label>
      ${renderDateSelectHtml('task-override', overrideDate, curYear, curYear + 2)}
    </div>

    <div class="task-toggle-row${isRepeating ? ' task-toggle-row--expanded' : ''}" id="repeating-toggle-row" data-action="toggle-repeating-task" style="padding:10px 16px;">
      <span class="task-toggle-label">Repeating task</span>
      <button class="task-toggle-btn${isRepeating ? ' on' : ''}" id="repeating-toggle" role="switch" aria-checked="${isRepeating}" type="button">
        <span class="task-toggle-knob"></span>
      </button>
    </div>

    <div id="task-recurrence-block" style="${isRepeating ? '' : 'display:none;'}padding:0 16px 10px;">
      <div style="background:#f4f6f2;border-radius:10px;padding:8px 10px;">
        <div class="recurrence-type-toggle" style="margin-bottom:8px;">
          <div class="recurrence-option${recType === 'interval' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="interval" style="font-size:12px;padding:5px 8px;">Every X days</div>
          <div class="recurrence-option${recType === 'weekdays' ? ' selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="weekdays" style="font-size:12px;padding:5px 8px;">Days of week</div>
        </div>
        <div id="recurrence-container" class="recurrence-${isRepeating ? recType : 'one-off'}">
          <div class="recurrence-interval-section form-group" style="margin:0;">
            <div class="freq-row">
              <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="${task.frequencyDays}" style="width:auto;min-width:52px;font-size:13px;padding:5px 8px;overflow:visible;text-overflow:unset;">
              <span style="font-size:13px;">days between tasks</span>
            </div>
          </div>
          <div class="recurrence-weekdays-section form-group" style="margin:0;">
            <div class="weekday-picker">${weekdayBtns}</div>
          </div>
          <div id="recurrence-summary" data-started="${task.lastDone ? 'true' : 'false'}" style="display:none;background:#eef3eb;border-radius:8px;padding:5px 8px;margin:8px 0 0;font-size:12px;color:#3a6b3a;"></div>
        </div>
      </div>
    </div>

    <div id="pause-toggle-row" class="task-toggle-row task-toggle-row--sub" data-action="toggle-task-pause" style="${isRepeating ? '' : 'display:none;'}padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <div>
        <div class="task-toggle-label">Pause task</div>
        <div class="task-toggle-subtitle">Skip until resumed</div>
      </div>
      <button class="task-toggle-btn${isPaused ? ' on' : ''}" id="pause-toggle" role="switch" aria-checked="${isPaused}" type="button">
        <span class="task-toggle-knob"></span>
      </button>
    </div>

    <div class="task-delete-section" style="padding:10px 16px 6px;">
      <button class="task-delete-link" data-action="delete-task" data-plant="${plantId}" data-task="${taskId}" style="font-size:13px;">Delete task</button>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions" style="padding:8px 16px 14px;">
        <button class="btn btn-ghost" data-action="sheet-cancel">&#8592; Cancel</button>
        <button class="btn btn-primary" data-action="sheet-save-task">Save Changes</button>
      </div>
    </div>
  `);

  attachFutureDateSelectListeners('task-override');
  attachRecurrenceSummaryListeners('task-override');
  applyCompactDateSelectStyles('task-override');
}

function renderAddTaskStep1(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;
  const existingIds = new Set(plant.tasks.map(t => t.id));

  state.sheetMode = 'add-task-step1';
  state.sheetData = { plantId };
  sheetEntryTab = plantDetailTab;

  const presetOptions = Object.entries(TASK_CONFIG).map(([key, cfg]) => {
    if (existingIds.has(key)) {
      return `
      <div class="task-type-option task-type-option-disabled">
        <span class="task-type-icon">${cfg.icon}</span>
        <span class="task-type-name">${escapeHtml(cfg.name)}</span>
        <span class="task-type-assigned">Added</span>
      </div>`;
    }
    return `
      <div class="task-type-option" data-action="add-task-select-type" data-plant="${plantId}" data-type-key="${key}">
        <span class="task-type-icon">${cfg.icon}</span>
        <span class="task-type-name">${escapeHtml(cfg.name)}</span>
      </div>`;
  }).join('');

  openSheet(`
    <div class="sheet-title">Add Task</div>
    <div class="task-type-list">
      ${presetOptions}
      <div class="task-type-option task-type-option-custom" data-action="add-task-select-type" data-plant="${plantId}" data-type-key="custom">
        <span class="task-type-icon">✏️</span>
        <span class="task-type-name">Custom</span>
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
    </div>
  `);
}

function renderAddTaskStep2(plantId, typeKey) {
  const isCustom = typeKey === 'custom';
  const cfg = isCustom ? null : TASK_CONFIG[typeKey];
  const defaultOwner = activeUser ?? Object.keys(USERS)[0];

  state.sheetMode = 'add-task-step2';
  state.sheetData = { plantId, typeKey };

  const weekdayBtns = WEEKDAY_NAMES.map((name, i) =>
    `<button class="weekday-btn" data-action="sheet-toggle-weekday" data-day="${i}">${name}</button>`
  ).join('');

  const ownerPillsHtml = renderOwnerPills(defaultOwner);

  const plant = getPlant(plantId);
  const headerIcon = isCustom ? CUSTOM_ICONS[0] : cfg.icon;
  const headerName = isCustom ? 'Custom Task' : cfg.name;

  const customFields = isCustom ? `
    <div id="edit-task-icon-picker" class="icon-picker" style="display:none;padding:8px 16px;border-bottom:0.5px solid #f0f0ee;">
      ${CUSTOM_ICONS.map((ic, i) =>
        `<div class="icon-option${i === 0 ? ' selected' : ''}" data-action="edit-task-pick-icon" data-icon="${ic}">${ic}</div>`
      ).join('')}
    </div>
    <div style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="display:block;font-size:11px;color:#8a8d86;margin:0 0 4px;text-transform:none;font-weight:500;letter-spacing:normal;">Task name</label>
      <input type="text" class="form-input" id="sheet-custom-name" placeholder="e.g. Mist leaves" autocomplete="off" style="background:#f8f8f6;border:0.5px solid #e0e0dc;border-radius:8px;padding:8px 10px;font-size:14px;width:100%;box-sizing:border-box;">
    </div>` : '';

  const todayVal = todayStr();
  const curYear  = new Date().getFullYear();

  const rowLabelStyle = 'display:block;font-size:11px;color:#8a8d86;margin:0 0 4px;text-transform:none;font-weight:500;letter-spacing:normal;';

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:0.5px solid #e8ece6;">
      ${isCustom
        ? `<button type="button" class="edit-task-icon-tile" data-action="edit-task-toggle-icon-picker" data-emoji="${escapeHtml(headerIcon)}" style="width:36px;height:36px;background:#eef3eb;border-radius:8px;border:1.5px dashed #a0c0a0;display:flex;align-items:center;justify-content:center;font-size:20px;padding:0;cursor:pointer;flex-shrink:0;">${headerIcon}</button>`
        : `<div style="width:36px;height:36px;background:#eef3eb;border-radius:8px;border:none;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${headerIcon}</div>`}
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(headerName)}</div>
        <div style="font-size:12px;color:#8a8d86;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant?.name ?? '')}</div>
        ${isCustom ? `<div style="font-size:10px;color:#3a6b3a;margin-top:2px;">tap icon to change</div>` : ''}
      </div>
    </div>

    ${customFields}

    <div style="display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" style="font-size:11px;color:#8a8d86;margin:0;text-transform:none;font-weight:500;letter-spacing:normal;flex-shrink:0;">Owner</label>
      <div class="owner-pill-group" style="flex:1;display:flex;gap:6px;flex-wrap:wrap;margin:0;">${ownerPillsHtml}</div>
    </div>

    <div style="padding:10px 16px;border-bottom:0.5px solid #f0f0ee;">
      <label class="form-label" id="task-due-label" style="${rowLabelStyle}">Due date</label>
      ${renderDateSelectHtml('task-due-oneoff', todayVal, curYear, curYear + 2)}
    </div>

    <div class="task-toggle-row" id="repeating-toggle-row" data-action="toggle-repeating-task" style="padding:10px 16px;">
      <span class="task-toggle-label">Repeating task</span>
      <button class="task-toggle-btn" id="repeating-toggle" role="switch" aria-checked="false" type="button">
        <span class="task-toggle-knob"></span>
      </button>
    </div>

    <div id="task-recurrence-block" style="display:none;padding:0 16px 10px;">
      <div style="background:#f4f6f2;border-radius:10px;padding:8px 10px;">
        <div class="recurrence-type-toggle" style="margin-bottom:8px;">
          <div class="recurrence-option selected" data-action="sheet-toggle-recurrence" data-rtype="interval" style="font-size:12px;padding:5px 8px;">Every X days</div>
          <div class="recurrence-option" data-action="sheet-toggle-recurrence" data-rtype="weekdays" style="font-size:12px;padding:5px 8px;">Days of week</div>
        </div>
        <div id="recurrence-container" class="recurrence-one-off">
          <div class="recurrence-interval-section form-group" style="margin:0;">
            <div class="freq-row">
              <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="7" style="width:auto;min-width:52px;font-size:13px;padding:5px 8px;overflow:visible;text-overflow:unset;">
              <span style="font-size:13px;">days between tasks</span>
            </div>
          </div>
          <div class="recurrence-weekdays-section form-group" style="margin:0;">
            <div class="weekday-picker">${weekdayBtns}</div>
          </div>
          <div id="recurrence-summary" data-started="false" style="display:none;background:#eef3eb;border-radius:8px;padding:5px 8px;margin:8px 0 0;font-size:12px;color:#3a6b3a;"></div>
        </div>
      </div>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions" style="padding:8px 16px 14px;">
        <button class="btn btn-ghost" data-action="add-task-back" data-plant="${plantId}">&#8592; Back</button>
        <button class="btn btn-primary" data-action="sheet-save-new-task">Add Task</button>
      </div>
    </div>
  `);

  attachFutureDateSelectListeners('task-due-oneoff');
  attachRecurrenceSummaryListeners('task-due-oneoff');
  applyCompactDateSelectStyles('task-due-oneoff');
}

function renderPostTaskNoteSheet(plantId, taskId) {
  state.sheetMode = 'post-task-note';
  state.sheetData = { plantId, taskId };

  openSheet(`
    <div class="sheet-title">Add a note <span class="sheet-title-optional">Optional</span></div>
    <div class="form-group">
      <textarea class="form-textarea" id="post-task-note-text" placeholder="Describe what you observed..." style="min-height:110px"></textarea>
    </div>
    <button class="btn btn-ghost post-task-photo-btn" disabled>&#128247; Add photo</button>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-skip-post-task-note">Skip</button>
      <button class="btn btn-primary" data-action="sheet-save-post-task-note" data-task="${taskId ?? ''}">Save note</button>
    </div>
  `);
}

function renderAddNoteSheet(plantId) {
  state.sheetMode = 'add-note';
  state.sheetData = { plantId, pendingText: state.sheetData?.pendingText ?? '', pendingPhoto: state.sheetData?.pendingPhoto ?? null };

  openSheet(`
    <div class="sheet-title">Add Note</div>
    <div class="form-group">
      <textarea class="form-textarea" id="sheet-note-text" placeholder="Describe what you observed..." style="min-height:110px">${escapeHtml(state.sheetData.pendingText)}</textarea>
    </div>
    <div id="add-note-photo-area" class="add-note-photo-area">${renderAddNotePhotoArea()}</div>
    <div id="add-note-coach" class="add-note-coach">${renderAddNoteCoachTip(null)}</div>
    <input type="file" id="add-note-file-input" accept="image/*" capture="environment" hidden />
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-note">Save</button>
    </div>
  `);

  // Async fill in last photo thumbnail (don't block sheet open)
  fetchLastPlantPhoto(plantId).then(photo => {
    if (state.sheetMode !== 'add-note' || state.sheetData.plantId !== plantId) return;
    const coach = document.getElementById('add-note-coach');
    if (coach) coach.innerHTML = renderAddNoteCoachTip(photo);
  });
}

function renderAddNotePhotoArea() {
  const pending = state.sheetData?.pendingPhoto;
  if (pending) {
    return `
      <div class="add-note-photo-preview">
        <img class="add-note-photo-thumb" src="${escapeHtml(pending.previewUrl)}" alt="" />
        <div class="add-note-photo-meta">
          <div class="add-note-photo-meta-title">&#10003; Photo added</div>
          <button type="button" class="add-note-photo-change" data-action="add-note-pick-photo">Tap to change</button>
        </div>
        <button type="button" class="add-note-photo-remove" data-action="add-note-remove-photo">&#10005; Remove</button>
      </div>`;
  }
  return `<button type="button" class="add-note-photo-btn" data-action="add-note-pick-photo">📷 Add photo</button>`;
}

function renderAddNoteCoachTip(lastPhoto) {
  let thumbHtml = '';
  if (lastPhoto?.storage_url) {
    const dateLabel = lastPhoto.created_at
      ? new Date(lastPhoto.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    thumbHtml = `
      <div class="add-note-coach-last">
        <img class="add-note-coach-last-thumb" src="${escapeHtml(lastPhoto.storage_url)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(lastPhoto.storage_url)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #c8c8c8;" />
        <div class="add-note-coach-last-label">Last photo${dateLabel ? ' · ' + escapeHtml(dateLabel) : ''}</div>
      </div>`;
  }
  return `
    <div class="add-note-coach-text">
      <div class="add-note-coach-title">📐 Match your last photo</div>
      <div class="add-note-coach-body">Use the same angle/distance. Helps to see progress!</div>
    </div>
    ${thumbHtml}`;
}

function refreshAddNotePhotoArea() {
  const area = document.getElementById('add-note-photo-area');
  if (area) area.innerHTML = renderAddNotePhotoArea();
}

async function handleAddNoteFileSelected(file) {
  console.log('[fileSelected] ENTER', { name: file?.name, type: file?.type, size: file?.size, sheetMode: state.sheetMode, sheetData: state.sheetData });
  if (!file || !file.type?.startsWith('image/')) {
    console.log('[fileSelected] rejected — not an image or no file');
    return;
  }
  try {
    const blob = await compressImage(file, 1200, 0.8);
    console.log('[fileSelected] compressed', { blobSize: blob?.size, blobType: blob?.type });
    if (!blob) return;
    const previewUrl = URL.createObjectURL(blob);
    if (state.sheetData?.pendingPhoto?.previewUrl) {
      console.log('[fileSelected] revoking prior previewUrl', state.sheetData.pendingPhoto.previewUrl);
      URL.revokeObjectURL(state.sheetData.pendingPhoto.previewUrl);
    }
    state.sheetData = state.sheetData || {};
    state.sheetData.pendingPhoto = { blob, previewUrl };
    console.log('[fileSelected] pendingPhoto set on sheetData', { sheetData: state.sheetData });
    refreshAddNotePhotoArea();
  } catch (err) {
    console.error('[fileSelected] error:', err);
    showToast('Could not load that image');
  }
}

function clearPendingPhoto() {
  const p = state.sheetData?.pendingPhoto;
  if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
  if (state.sheetData) state.sheetData.pendingPhoto = null;
}

function openSlideshow(plantId, originPhotoId) {
  const plant = getPlant(plantId);
  if (!plant) return;

  const sequence = notes
    .filter(n => n.plantId === plantId && n.photoUrl)
    .slice()
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''));
  if (sequence.length === 0) return;

  let currentIndex = 0;

  const plantTileHtml = plant.photoUrl
    ? `<span class="slideshow-plant-tile"><img src="${escapeHtml(plant.photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" /></span>`
    : `<span class="slideshow-plant-tile">${escapeHtml(plant.emoji ?? '🪴')}</span>`;

  const overlay = document.createElement('div');
  overlay.className = 'photo-slideshow-overlay';
  overlay.innerHTML = `
    <div class="slideshow-topbar">
      <button type="button" class="slideshow-close" aria-label="Close">&times;</button>
      <div class="slideshow-count"></div>
      <div class="slideshow-plant">${escapeHtml(plant.name ?? '')}</div>
    </div>
    <div class="slideshow-photo-area">
      <img class="slideshow-photo" alt="" />
      <button type="button" class="slideshow-nav slideshow-nav-prev" aria-label="Previous">&#8249;</button>
      <button type="button" class="slideshow-nav slideshow-nav-next" aria-label="Next">&#8250;</button>
    </div>
    <div class="slideshow-gap"></div>
    <div class="slideshow-panel">
      <div class="slideshow-meta">
        ${plantTileHtml}
        <span class="slideshow-plant-name">${escapeHtml(plant.name ?? '')}</span>
        <span class="slideshow-date"></span>
        <span class="slideshow-avatar"></span>
      </div>
      <div class="slideshow-note-label">NOTE</div>
      <div class="slideshow-note-text"></div>
      <div class="slideshow-divider"></div>
      <div class="slideshow-controls">
        <div class="slideshow-dots"></div>
      </div>
    </div>
  `;

  const img        = overlay.querySelector('.slideshow-photo');
  const countEl    = overlay.querySelector('.slideshow-count');
  const dateEl     = overlay.querySelector('.slideshow-date');
  const avatarEl   = overlay.querySelector('.slideshow-avatar');
  const noteTextEl = overlay.querySelector('.slideshow-note-text');
  const dotsWrap   = overlay.querySelector('.slideshow-dots');
  const prevBtn    = overlay.querySelector('.slideshow-nav-prev');
  const nextBtn    = overlay.querySelector('.slideshow-nav-next');
  const photoArea  = overlay.querySelector('.slideshow-photo-area');

  const renderCurrent = () => {
    const note = sequence[currentIndex];
    img.src = note.photoUrl;
    countEl.textContent = `${currentIndex + 1} of ${sequence.length}`;

    dateEl.textContent = note.createdAt
      ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    const member        = membersCache.find(m => m.id === note.memberId);
    const memberColor   = member?.color ?? '#888';
    const memberInitial = (member?.display_name ?? note.author ?? '?')[0].toUpperCase();
    avatarEl.style.background = memberColor;
    avatarEl.textContent = memberInitial;

    const noteText = (note.note ?? '').trim();
    if (noteText) {
      noteTextEl.textContent = noteText;
      noteTextEl.classList.remove('slideshow-note-text--empty');
    } else {
      noteTextEl.textContent = 'No note added.';
      noteTextEl.classList.add('slideshow-note-text--empty');
    }

    const atStart = currentIndex === 0;
    const atEnd   = currentIndex === sequence.length - 1;
    prevBtn.style.display = atStart ? 'none' : '';
    nextBtn.style.display = atEnd   ? 'none' : '';

    dotsWrap.innerHTML = sequence.map((_, i) => {
      const cls = i === currentIndex ? 'slideshow-dot active' : 'slideshow-dot';
      return `<span class="${cls}"></span>`;
    }).join('');
  };

  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
    if (originPhotoId) {
      const originNote = sequence.find(n => n.id === originPhotoId);
      if (originNote?.photoUrl) openPhotoFullscreen(originNote.photoUrl, originNote.id, originNote.plantId);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  overlay.querySelector('.slideshow-close').addEventListener('click', close);
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    }
  });
  nextBtn.addEventListener('click', () => {
    if (currentIndex < sequence.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  let touchStartX = null;
  photoArea.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0]?.clientX ?? null;
  }, { passive: true });
  photoArea.addEventListener('touchend', (e) => {
    if (touchStartX == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const deltaX = endX - touchStartX;
    touchStartX = null;
    if (deltaX > 40 && currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    } else if (deltaX < -40 && currentIndex < sequence.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
  renderCurrent();
}

function openPhotoFullscreen(url, noteId = null, plantId = null, bare = false) {
  if (!url) return;

  let matchingNote = bare
    ? null
    : noteId
      ? notes.find(n => n.id === noteId)
      : notes.find(n => n.photoUrl === url);
  const resolvedPlantId = plantId ?? matchingNote?.plantId ?? null;

  const photoSequence = resolvedPlantId
    ? notes
        .filter(n => n.plantId === resolvedPlantId && n.photoUrl)
        .slice()
        .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    : [];

  let currentIndex = 0;
  if (matchingNote) {
    const idx = photoSequence.findIndex(n => n.id === matchingNote.id);
    if (idx >= 0) currentIndex = idx;
  }

  // Bare-image mode (no note resolved) — preserved untouched.
  if (!matchingNote) {
    const div = document.createElement('div');
    div.className = 'photo-fullscreen-overlay is-zoomed';
    div.innerHTML = `
      <button type="button" class="photo-fullscreen-close" aria-label="Close">&times;</button>
      <div class="photo-fullscreen-photo-area">
        <img src="${escapeHtml(url)}" alt="" />
      </div>
    `;
    const close = () => {
      div.remove();
      document.body.classList.remove('photo-overlay-open');
      document.removeEventListener('keydown', onKey);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    };
    div.querySelector('.photo-fullscreen-close')?.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(div);
    document.body.classList.add('photo-overlay-open');
    return;
  }

  // Note-context mode — redesigned layout (Brief #218).
  const currentPlant = plants.find(p => p.id === matchingNote.plantId);
  const photoCount = photoSequence.length;

  const plantTileInner = currentPlant?.photoUrl
    ? `<img src="${escapeHtml(currentPlant.photoUrl)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : escapeHtml(currentPlant?.emoji ?? '🪴');

  const thumbsHtml = photoSequence.map(n =>
    `<img class="photo-fullscreen-thumb" src="${escapeHtml(n.photoUrl)}" alt="" />`
  ).join('');

  const div = document.createElement('div');
  div.className = 'photo-fullscreen-overlay';
  div.innerHTML = `
    <div class="photo-fullscreen-header">
      <div class="photo-fullscreen-plant-chip">
        <span class="photo-fullscreen-plant-tile">${plantTileInner}</span>
        <div>
          <div class="photo-fullscreen-plant-name">${escapeHtml(currentPlant?.name ?? '')}</div>
          <div class="photo-fullscreen-photo-count">${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}</div>
        </div>
      </div>
      <button type="button" class="photo-fullscreen-close" aria-label="Close">&times;</button>
    </div>
    <div class="photo-fullscreen-photo-card">
      <img src="${escapeHtml(url)}" alt="" />
      <button type="button" class="photo-fullscreen-prev" aria-label="Previous">&#8249;</button>
      <button type="button" class="photo-fullscreen-next" aria-label="Next">&#8250;</button>
      <div class="photo-fullscreen-zoom-icon">⤢</div>
    </div>
    <div class="photo-fullscreen-thumbs">${thumbsHtml}</div>
    <div class="photo-fullscreen-meta-card">
      <div class="photo-fullscreen-note-label">NOTE</div>
      <div class="photo-fullscreen-note-text"></div>
      <div class="photo-fullscreen-meta-footer">
        <div class="photo-fullscreen-avatar-row">
          <span class="photo-fullscreen-avatar"></span>
          <span class="photo-fullscreen-member-name"></span>
        </div>
        <span class="photo-fullscreen-date-badge"></span>
      </div>
    </div>
  `;

  const photoCard  = div.querySelector('.photo-fullscreen-photo-card');
  const imgEl      = photoCard?.querySelector('img');
  const prevBtn    = div.querySelector('.photo-fullscreen-prev');
  const nextBtn    = div.querySelector('.photo-fullscreen-next');
  const thumbEls   = Array.from(div.querySelectorAll('.photo-fullscreen-thumb'));
  const noteTextEl = div.querySelector('.photo-fullscreen-note-text');
  const avatarEl   = div.querySelector('.photo-fullscreen-avatar');
  const memberEl   = div.querySelector('.photo-fullscreen-member-name');
  const dateEl     = div.querySelector('.photo-fullscreen-date-badge');

  const renderCurrent = () => {
    const note = photoSequence[currentIndex] ?? matchingNote;
    if (!note) return;

    if (imgEl) imgEl.src = note.photoUrl;

    if (noteTextEl) {
      const text = (note.note ?? '').trim();
      noteTextEl.textContent = text || 'No note added.';
    }

    const member = membersCache.find(m => m.id === note.memberId);
    if (avatarEl) {
      avatarEl.style.background = member?.color ?? '#888';
      avatarEl.textContent = (member?.display_name ?? note.author ?? '?')[0].toUpperCase();
    }
    if (memberEl) {
      memberEl.textContent = member?.display_name ?? note.author ?? '';
    }
    if (dateEl) {
      dateEl.textContent = note.createdAt
        ? new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
    }

    thumbEls.forEach((el, i) => el.classList.toggle('active', i === currentIndex));
    thumbEls[currentIndex]?.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    if (prevBtn) prevBtn.hidden = currentIndex === 0;
    if (nextBtn) nextBtn.hidden = currentIndex === photoSequence.length - 1;
  };

  const close = () => {
    div.remove();
    document.body.classList.remove('photo-overlay-open');
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
  };
  div.querySelector('.photo-fullscreen-close')?.addEventListener('click', close);

  prevBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    }
  });
  nextBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentIndex < photoSequence.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  thumbEls.forEach((el, i) => {
    el.addEventListener('click', () => {
      currentIndex = i;
      renderCurrent();
    });
  });

  const zoomIconEl = div.querySelector('.photo-fullscreen-zoom-icon');
  zoomIconEl?.addEventListener('click', () => {
    const currentUrl = photoSequence[currentIndex]?.photoUrl ?? url;
    openPhotoFullscreen(currentUrl, null, null, true);
  });

  document.addEventListener('keydown', onKey);
  document.body.appendChild(div);
  document.body.classList.add('photo-overlay-open');

  renderCurrent();
}

function renderPhotoCapSheet(plantId) {
  state.sheetMode = 'photo-cap';
  openSheet(`
    <div class="sheet-title">Photo limit reached</div>
    <div class="photo-cap-body">
      <div class="photo-cap-msg">Each plant can have up to ${PHOTO_CAP_PER_PLANT} photos. To add a new one, you'll need to remove an existing photo first.</div>
    </div>
    <div class="sheet-actions" style="flex-direction:column;gap:8px;">
      <button class="btn btn-primary" data-action="photo-cap-delete-oldest" data-plant="${escapeHtml(plantId)}">Delete oldest photo</button>
      <button class="btn btn-ghost" data-action="photo-cap-manage" data-plant="${escapeHtml(plantId)}">Manage photos</button>
      <button class="btn btn-ghost" data-action="photo-cap-back">Back</button>
    </div>
  `);
}

async function renderManagePhotosSheet(plantId) {
  state.sheetMode = 'manage-photos';
  openSheet(`
    <div class="sheet-title">Manage photos</div>
    <div class="manage-photos-list" id="manage-photos-list"><div class="manage-photos-loading">Loading…</div></div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="photo-cap-back">&#8592; Back</button>
    </div>
  `);
  const photos = await fetchAllPlantPhotos(plantId);
  const list = document.getElementById('manage-photos-list');
  if (!list || state.sheetMode !== 'manage-photos') return;
  if (photos.length === 0) {
    list.innerHTML = `<div class="manage-photos-empty">No photos yet.</div>`;
    return;
  }
  list.innerHTML = photos.map(p => {
    const date = p.created_at
      ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    return `
      <div class="manage-photos-row" data-photo-id="${escapeHtml(p.id)}">
        <img class="manage-photos-thumb" src="${escapeHtml(p.storage_url)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(p.storage_url)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #c8c8c8;" />
        <div class="manage-photos-date">${escapeHtml(date)}</div>
        <button class="manage-photos-delete" data-action="manage-photos-delete" data-photo-id="${escapeHtml(p.id)}" data-plant="${escapeHtml(plantId)}" data-note-id="${escapeHtml(p.note_id ?? '')}" data-url="${escapeHtml(p.storage_url ?? '')}">Delete</button>
      </div>`;
  }).join('');
}

function renderEditNotePhotoSection(note, lastPhoto, photoMeta) {
  if (note.photoUrl) {
    const dateSrc = photoMeta?.created_at ?? note.createdAt;
    const dateLabel = dateSrc
      ? new Date(dateSrc).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:8px;background:#fff;border:1px solid #e4e9e0;border-radius:10px;">
        <img class="notes-tab-thumb" src="${escapeHtml(note.photoUrl)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(note.photoUrl)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #c8c8c8;" />
        <div style="flex:1;font-size:13px;color:#1a2e1f;">${escapeHtml(dateLabel)}</div>
        <button class="manage-photos-delete" data-action="edit-note-delete-photo">Delete</button>
      </div>`;
  }
  let coachHtml = '';
  if (lastPhoto?.storage_url) {
    const dateLabel = lastPhoto.created_at
      ? new Date(lastPhoto.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : '';
    coachHtml = `
      <div class="add-note-coach" style="margin-top:8px;background:#eef5fc;border:1px solid #b8d4f0;">
        <div class="add-note-coach-text">
          <div class="add-note-coach-title" style="color:#1a4a7a;">💡 Match your last photo</div>
          <div class="add-note-coach-body" style="color:#2a5a8a;">Same angle helps track progress!</div>
        </div>
        <div class="add-note-coach-last">
          <img class="add-note-coach-last-thumb" src="${escapeHtml(lastPhoto.storage_url)}" alt="" data-action="add-note-view-photo" data-url="${escapeHtml(lastPhoto.storage_url)}" style="width:56px;height:56px;border-radius:8px;border:1.5px solid #c8c8c8;" />
          <div class="add-note-coach-last-label" style="color:#5a82aa;">Last photo${dateLabel ? ' · ' + escapeHtml(dateLabel) : ''}</div>
        </div>
      </div>`;
  }
  return `
    <button type="button" class="add-note-photo-btn" data-action="edit-note-pick-photo">📷 Add photo</button>
    ${coachHtml}`;
}

async function fetchPhotoForNote(noteId) {
  const { data, error } = await supabaseClient
    .from('plant_photos')
    .select('id, plant_id, note_id, storage_url, created_at')
    .eq('note_id', noteId)
    .maybeSingle();
  if (error) { console.error('fetchPhotoForNote error:', error); return null; }
  return data ?? null;
}

async function refreshEditNotePhotoSection() {
  const noteId = state.sheetData?.noteId;
  const plantId = state.sheetData?.plantId;
  if (!noteId || !plantId) return;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const area = document.getElementById('edit-note-photo-area');
  if (!area) return;

  if (note.photoUrl) {
    area.innerHTML = renderEditNotePhotoSection(note, null, state.sheetData?.editNotePhotoMeta ?? null);
    const meta = await fetchPhotoForNote(noteId);
    if (state.sheetMode !== 'edit-note' || state.sheetData?.noteId !== noteId) return;
    state.sheetData.editNotePhotoMeta = meta;
    const area2 = document.getElementById('edit-note-photo-area');
    if (area2 && note.photoUrl) area2.innerHTML = renderEditNotePhotoSection(note, null, meta);
  } else {
    state.sheetData.editNotePhotoMeta = null;
    area.innerHTML = renderEditNotePhotoSection(note, null, null);
    const lastPhoto = await fetchLastPlantPhoto(plantId);
    if (state.sheetMode !== 'edit-note' || state.sheetData?.noteId !== noteId) return;
    if (note.photoUrl) return;
    const area2 = document.getElementById('edit-note-photo-area');
    if (area2) area2.innerHTML = renderEditNotePhotoSection(note, lastPhoto, null);
  }
}

async function handleEditNotePhotoFileSelected(file) {
  if (!file || !file.type?.startsWith('image/')) return;
  const noteId = state.sheetData?.noteId;
  const plantId = state.sheetData?.plantId;
  if (!noteId || !plantId) return;
  const note = notes.find(n => n.id === noteId);
  if (!note) return;

  const count = await countPlantPhotos(plantId);
  if (count >= PHOTO_CAP_PER_PLANT) {
    showToast('Photo limit reached — manage photos first');
    return;
  }

  let blob;
  try {
    blob = await compressImage(file, 1200, 0.8);
  } catch (err) {
    console.error('[editNotePhoto] compress error:', err);
    showToast('Could not load that image');
    return;
  }
  if (!blob) return;

  try {
    const upRes = await uploadPlantPhoto(blob, plantId);
    const photoUrl = upRes.publicUrl;
    posthog.capture('photo_added', { plant_id: plantId });
    const { data: photoRow, error: ppErr } = await supabaseClient
      .from('plant_photos')
      .insert({ plant_id: plantId, note_id: noteId, storage_url: photoUrl })
      .select('id, plant_id, note_id, storage_url, created_at')
      .single();
    if (ppErr) throw ppErr;
    const { error: noteErr } = await supabaseClient
      .from('notes')
      .update({ photo_url: photoUrl })
      .eq('id', noteId);
    if (noteErr) throw noteErr;
    note.photoUrl = photoUrl;
    if (state.sheetData) state.sheetData.editNotePhotoMeta = photoRow;
    await refreshEditNotePhotoSection();
  } catch (err) {
    console.error('[editNotePhoto] upload/attach failed:', err);
    showToast('Could not save photo');
  }
}

function renderEditNoteSheet(plantId, noteId) {
  const note  = notes.find(n => n.id === noteId);
  const plant = getPlant(plantId);
  if (!note || !plant) return;

  state.sheetMode = 'edit-note';
  state.sheetData = { plantId, noteId };
  sheetEntryTab   = plantDetailTab;

  openSheet(`
    <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:0.5px solid #e8ece6;">
      <span style="width:36px;height:36px;background:#eef3eb;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${escapeHtml(plant.emoji ?? '🪴')}</span>
      <div style="display:flex;flex-direction:column;gap:1px;min-width:0;flex:1;">
        <div style="font-size:15px;font-weight:600;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(plant.name ?? '')}</div>
        <div style="font-size:12px;color:#8a8d86;">Edit note</div>
      </div>
    </div>

    <div style="padding:12px 16px 4px;">
      <textarea class="form-textarea" id="sheet-edit-note-text" style="min-height:110px;width:100%;box-sizing:border-box;">${escapeHtml(note.note ?? '')}</textarea>
    </div>

    <div id="edit-note-photo-area" style="padding:4px 16px 8px;">${renderEditNotePhotoSection(note, null, null)}</div>
    <input type="file" id="edit-note-file-input" accept="image/*" capture="environment" hidden />

    <div class="task-delete-section" style="padding:4px 16px 6px;">
      <button class="task-delete-link" data-action="sheet-delete-note" data-plant="${escapeHtml(plantId)}" data-note="${escapeHtml(noteId)}" style="font-size:13px;">Delete note</button>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions" style="padding:8px 16px 14px;">
        <button class="btn btn-ghost" data-action="sheet-cancel">&#8592; Cancel</button>
        <button class="btn btn-primary" data-action="sheet-save-edit-note" data-plant="${escapeHtml(plantId)}" data-note="${escapeHtml(noteId)}">Save Changes</button>
      </div>
    </div>
  `);

  refreshEditNotePhotoSection();
}

function renderEditPlantStep2Html(plant) {
  const sd = state.sheetData;
  const dateDisplay = plant.dateAcquired
    ? new Date(plant.dateAcquired + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Set date';
  const nameValue = sd.editPlantName ?? plant.name;

  let iconHtml;
  let sublabel;
  if (sd.editIconMode === 'photo') {
    const photoSrc = sd.pendingPlantPhoto?.previewUrl ?? sd.editExistingPhotoUrl ?? '';
    iconHtml = `<img src="${escapeHtml(photoSrc)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:1.5px solid #c8c8c8;flex-shrink:0;display:block;box-sizing:border-box;" />`;
    sublabel = 'Tap Change to retake, pick a new one, or use an icon';
  } else {
    const emoji = sd.selectedEmoji ?? plant.emoji ?? '🪴';
    iconHtml = `<div style="width:40px;height:40px;background:#f0f4f0;border:0.5px solid #d0dcd0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;line-height:1;box-sizing:border-box;">${escapeHtml(emoji)}</div>`;
    sublabel = 'Tap Change to pick a new icon or add a photo';
  }

  return `
    <div class="sheet-title edit-plant-sheet-title">Edit plant</div>

    <div class="edit-plant-field-label">PLANT ICON</div>
    <div id="edit-plant-icon-row" style="display:flex;align-items:center;gap:12px;margin-top:4px;padding-bottom:14px;">
      ${iconHtml}
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;color:#1a1a1a;">Plant icon</div>
        <div style="font-size:11px;color:#888;margin-top:2px;">${sublabel}</div>
      </div>
      <button data-action="edit-plant-change-icon" style="font-size:12px;color:#3a6b3a;background:transparent;border:0.5px solid #a8c4a8;border-radius:8px;padding:5px 10px;cursor:pointer;font-family:inherit;flex-shrink:0;">Change</button>
    </div>
    <div style="height:0.5px;background:var(--border);margin-bottom:14px;"></div>

    <div class="edit-plant-field-label" style="margin-top:0;">NAME</div>
    <div id="edit-plant-fields">
      <input type="text" class="form-input" id="sheet-plant-name" value="${escapeHtml(nameValue)}" placeholder="Plant name">
    </div>

    <div class="edit-plant-field-label" style="margin-top:14px;">ARRIVAL DATE</div>
    <div class="arrival-step2-row">
      <div class="arrival-step2-left">
        <span>🌱</span>
        <span>When did it arrive home?</span>
      </div>
      <label class="arrival-optional-pill${plant.dateAcquired ? ' has-value' : ''}" id="edit-plant-arrival-pill" for="sheet-acquired-date">
        <span id="arrival-date-display">${escapeHtml(dateDisplay)}</span>
        <input type="date" id="sheet-acquired-date" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:2;max-width:100%;" value="${escapeHtml(plant.dateAcquired ?? '')}">
      </label>
    </div>

    <div style="height:0.5px;background:var(--border);margin-top:20px;"></div>
    <div id="edit-plant-delete-wrap">
      <button data-action="edit-plant-show-delete" id="edit-plant-delete-btn" style="background:transparent;border:none;color:#c04040;font-size:13px;padding:10px 0;width:100%;text-align:left;cursor:pointer;font-family:inherit;">Delete plant</button>
      <div class="edit-plant-delete-confirm" id="edit-plant-delete-confirm" style="display:none;">
        <div class="edit-plant-delete-confirm-body">This will permanently delete the plant and all its tasks, notes, and care history. This cannot be undone.</div>
        <div class="edit-plant-delete-confirm-actions">
          <button class="btn btn-ghost" data-action="edit-plant-hide-delete" style="flex:1;">Cancel</button>
          <button class="btn" data-action="delete-plant" data-plant="${escapeHtml(String(plant.id))}" style="flex:1;background:#c62828;color:#fff;">Yes, delete forever</button>
        </div>
      </div>
    </div>
    <div style="height:0.5px;background:var(--border);"></div>

    <div style="margin-top:14px;display:flex;gap:8px;" id="edit-plant-save-row">
      <button class="btn btn-ghost" data-action="edit-plant-cancel" style="flex:1;">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-plant" style="flex:1;">Save changes</button>
    </div>`;
}

function renderEditPlantSheet(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;

  state.sheetMode = 'edit-plant';
  state.sheetData = {
    plantId,
    step: 2,
    selectedEmoji: plant.emoji,
    activeTab: 'all',
    editIconMode: plant.photoUrl ? 'photo' : 'emoji',
    editExistingPhotoUrl: plant.photoUrl ?? null,
    pendingPlantPhoto: null,
    editPlantName: null,
  };

  openSheet(renderEditPlantStep2Html(plant));
  attachArrivalDateListener('Set date');
}

async function handleSavePlant() {
  if (isSaving) return;
  isSaving = true;
  try {
  const sd = state.sheetData;
  const { plantId: pid } = sd;
  const plant = getPlant(pid);
  if (!plant) return;

  const name  = document.getElementById('sheet-plant-name')?.value?.trim();
  const emoji = sd.selectedEmoji
    || document.querySelector('#sheet .emoji-option.selected')?.dataset.emoji
    || document.getElementById('sheet-plant-emoji')?.value?.trim();
  const date  = document.getElementById('sheet-acquired-date')?.value;

  let newPhotoUrl = null;
  if (sd.editIconMode === 'photo') {
    if (sd.pendingPlantPhoto?.blob) {
      try {
        const upRes = await uploadPlantPhoto(sd.pendingPlantPhoto.blob, pid);
        newPhotoUrl = upRes.publicUrl;
      } catch (err) {
        console.error('handleSavePlant: photo upload error:', err);
        newPhotoUrl = sd.editExistingPhotoUrl;
      }
    } else {
      newPhotoUrl = sd.editExistingPhotoUrl;
    }
  }

  const localUpdates = {
    name:         name  || plant.name,
    emoji:        emoji || plant.emoji,
    photoUrl:     newPhotoUrl,
    dateAcquired: date  || null,
  };

  updatePlantInfo(pid, localUpdates);

  const dbUpdates = {
    name:         localUpdates.name,
    emoji:        localUpdates.emoji,
    photo_url:    newPhotoUrl,
    date_acquired: localUpdates.dateAcquired,
  };

  await supabaseClient
    .from('plants')
    .update(dbUpdates)
    .eq('id', pid)
    .then(({ error }) => { if (error) console.error('handleSavePlant error:', error); });

  if (sd.pendingPlantPhoto?.previewUrl) {
    URL.revokeObjectURL(sd.pendingPlantPhoto.previewUrl);
  }

  closeSheet();
  renderPlantDetail(pid);
  showToast('✅ Plant saved!');
  } finally {
    isSaving = false;
  }
}

function renderAddPlantSheet() {
  state.sheetMode = 'add-plant';
  state.sheetData = { step: 1, selectedEmoji: '🪴', activeTab: 'all', pendingPlantPhoto: null };
  openSheet(renderAddPlantStep1Html('all', '🪴', null));
}

async function handleAddPlantFileSelected(file) {
  if (!file || !file.type?.startsWith('image/')) return;
  try {
    const blob = await compressImage(file, 1200, 0.8);
    if (!blob) return;
    const previewUrl = URL.createObjectURL(blob);
    if (state.sheetData?.pendingPlantPhoto?.previewUrl) {
      URL.revokeObjectURL(state.sheetData.pendingPlantPhoto.previewUrl);
    }
    state.sheetData = state.sheetData || {};
    state.sheetData.pendingPlantPhoto = { blob, previewUrl };
    openSheet(renderAddPlantStep1Html(
      state.sheetData.activeTab || 'all',
      state.sheetData.selectedEmoji || '🪴',
      state.sheetData.pendingPlantPhoto
    ));
  } catch (err) {
    console.error('[addPlantFileSelected] error:', err);
    showToast('Could not load that image');
  }
}

function clearPendingPlantPhoto() {
  const p = state.sheetData?.pendingPlantPhoto;
  if (p?.previewUrl) URL.revokeObjectURL(p.previewUrl);
  if (state.sheetData) state.sheetData.pendingPlantPhoto = null;
}

async function handleSaveNewPlant() {
  if (isSaving) return;
  isSaving = true;

  const sheetContent = document.getElementById('sheet-content');
  const interactiveEls = sheetContent ? [...sheetContent.querySelectorAll('button, input, textarea')] : [];
  interactiveEls.forEach(el => { el.disabled = true; });

  const reEnable = () => {
    interactiveEls.forEach(el => { el.disabled = false; });
    isSaving = false;
  };

  try {
  const typedName = state.sheetData.plantName || document.getElementById('sheet-plant-name')?.value?.trim();
  if (!typedName) { alert('Please enter a plant name.'); reEnable(); return; }

  const isDuplicate = plants.some(p => p.name.toLowerCase() === typedName.toLowerCase());
  let name;
  if (isDuplicate) {
    const altName = document.getElementById('sheet-plant-alt-name')?.value?.trim();
    name = altName || `${typedName} 2`;
  } else {
    name = typedName;
  }

  const emoji = state.sheetData.selectedEmoji || '🪴';
  const dateAcquired = userTouchedArrivalDate ? (getSelectDate('arrival') || null) : null;
  const sortOrder = plants.length + 1;
  const pendingPhoto = state.sheetData.pendingPlantPhoto;

  const { data: inserted, error } = await supabaseClient
    .from('plants')
    .insert({
      household_id:  householdId,
      name,
      emoji,
      date_acquired: dateAcquired,
      sort_order:    sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('handleSaveNewPlant: Supabase insert error:', error);
    reEnable();
    return;
  }

  let photoUrl = null;
  if (pendingPhoto?.blob && inserted?.id) {
    try {
      const upRes = await uploadPlantPhoto(pendingPhoto.blob, inserted.id);
      photoUrl = upRes.publicUrl;
      const { error: updErr } = await supabaseClient
        .from('plants')
        .update({ photo_url: photoUrl })
        .eq('id', inserted.id);
      if (updErr) {
        console.error('handleSaveNewPlant: photo_url update error:', updErr);
        photoUrl = null;
      }
    } catch (err) {
      console.error('handleSaveNewPlant: photo upload error:', err);
    }
    if (pendingPhoto.previewUrl) URL.revokeObjectURL(pendingPhoto.previewUrl);
  }

  const newPlant = {
    id:           inserted?.id ?? uid(),
    name,
    emoji,
    dateAcquired: dateAcquired ?? '',
    photoUrl:     photoUrl,
    tasks:        [],
    careLog:      [],
  };

  plants.push(newPlant);
  state.sheetData.plantName = null;
  if (getOnboardingStep() === 1) {
    setOnboardingPlantId(newPlant.id);
    setOnboardingStep(2);
    closeSheet();
    navigateTo('home');
  } else {
    closeSheet();
    navigateTo('plant', newPlant.id);
  }
  showToast('🌱 Plant added!');
  } catch (err) {
    console.error('handleSaveNewPlant:', err);
    reEnable();
  } finally {
    isSaving = false;
  }
}

async function handleSaveNewTask() {
  if (isSaving) return;
  isSaving = true;
  try {
  const { plantId: pid, typeKey } = state.sheetData;
  const isCustom = typeKey === 'custom';

  // Resolve name, icon, type
  let name, icon, type, customName, customIcon;
  if (isCustom) {
    customName = document.getElementById('sheet-custom-name')?.value?.trim();
    if (!customName) { alert('Please enter a task name.'); return; }
    customIcon = document.querySelector('#sheet .icon-option.selected')?.dataset.icon ?? '🌿';
    name = customName;
    icon = customIcon;
    type = 'custom';
  } else {
    const cfg = TASK_CONFIG[typeKey];
    name = cfg.name;
    icon = cfg.icon;
    type = cfg.type;
  }

  const container = document.getElementById('recurrence-container');
  const recType = container?.classList.contains('recurrence-weekdays') ? 'weekdays'
                : container?.classList.contains('recurrence-one-off')  ? 'one-off'
                : 'interval';
  let frequencyDays = 7;
  let weekdays = [];

  if (recType === 'interval') {
    const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
    if (!freq || freq < 1) { alert('Please enter a valid frequency (minimum 1 day).'); return; }
    frequencyDays = freq;
  } else if (recType === 'weekdays') {
    weekdays = [...document.querySelectorAll('#sheet .weekday-btn.selected')].map(b => parseInt(b.dataset.day));
    if (weekdays.length === 0) { alert('Please select at least one day of the week.'); return; }
  }

  const firstDueVal = getSelectDate('task-due-oneoff');

  const selectedOwner = document.querySelector('#sheet .owner-pill.selected, #sheet .owner-option.selected');
  const owner = selectedOwner?.dataset.owner ?? Object.keys(USERS)[0];

  const plant = getPlant(pid);
  if (!plant) return;

  const ownerMember = membersCache.find(m => m.display_name === owner);
  const sortOrder = plant.tasks.length + 1;

  const supabaseRow = {
    plant_id:         pid,
    name,
    icon,
    type,
    recurrence: recType === 'one-off'
      ? { type: 'one-off' }
      : { type: recType, every: frequencyDays, unit: 'days', days: weekdays },
    owner_id:         ownerMember?.id ?? null,
    paused:           false,
    note:             '',
    sort_order:       sortOrder,
    next_due_override: firstDueVal,
  };

  const { data: inserted, error } = await supabaseClient
    .from('tasks')
    .insert(supabaseRow)
    .select()
    .single();

  if (error) {
    console.error('handleSaveNewTask: Supabase insert error:', error);
  } else {
    posthog.capture('task_created', { plant_id: pid, task_type: type });
  }

  const taskId = inserted?.id ?? uid();

  const newTask = {
    id: taskId,
    name,
    icon,
    type,
    recurrenceType: recType,
    frequencyDays,
    recurrenceUnit: 'days',
    weekdays,
    lastDone: null,
    nextDueOverride: firstDueVal,
    paused: false,
    owner,
    note: '',
    ...(isCustom ? { customName, customIcon } : {}),
  };

  plant.tasks.push(newTask);
  closeSheet();
  const _appEl = document.getElementById('app');
  _appEl.style.pointerEvents = 'none';
  if (sheetEntryTab) plantDetailTab = sheetEntryTab;
  sheetEntryTab = null;
  renderPlantDetail(pid);
  setTimeout(() => { _appEl.style.pointerEvents = ''; }, 350);
  showToast('✅ Task added!');
  } finally {
    isSaving = false;
  }
}

async function handleOnboardingFirstTask(plantId) {
  if (isSaving) return;
  isSaving = true;
  try {
  const plant = getPlant(plantId);
  if (!plant) return;

  const sortOrder = plant.tasks.length + 1;
  const ownerMember = membersCache.find(m => m.id === currentMemberId);

  const { data: inserted, error } = await supabaseClient
    .from('tasks')
    .insert({
      plant_id:          plantId,
      name:              'First watering',
      icon:              '💧',
      type:              'water',
      recurrence:        { type: 'one-off' },
      owner_id:          currentMemberId,
      paused:            false,
      note:              '',
      sort_order:        sortOrder,
      next_due_override: todayStr(),
    })
    .select()
    .single();

  if (error) {
    console.error('handleOnboardingFirstTask: insert error:', error);
    return;
  }

  const taskId = inserted?.id ?? uid();

  plant.tasks.push({
    id:              taskId,
    name:            'First watering',
    icon:            '💧',
    type:            'water',
    recurrenceType:  'one-off',
    frequencyDays:   7,
    recurrenceUnit:  'days',
    weekdays:        [],
    lastDone:        null,
    nextDueOverride: todayStr(),
    paused:          false,
    owner:           ownerMember?.display_name ?? activeUser,
    note:            '',
  });

  setOnboardingTaskId(taskId);
  setOnboardingStep(3);
  navigateTo('home');
  showToast('💧 Task added!', { duration: 4000 });
  } finally {
    isSaving = false;
  }
}

// ============================================================
// NAVIGATION
// ============================================================

function renderApp() {
  if (state.view === 'home') renderHome();
  else if (state.view === 'plant') renderPlantDetail(state.plantId);
  else if (state.view === 'manage-households') renderManageHouseholds();
}

function showOnboardingCompletionOverlay() {
  document.getElementById('app').innerHTML = `
    <div class="onboarding-complete-overlay" id="onboarding-complete-overlay">
      <div class="onboarding-complete-body">
        <div style="font-size:64px;line-height:1;margin-bottom:20px;">🌱</div>
        <h2 class="onboarding-complete-heading">You're all set!</h2>
        <p class="onboarding-complete-sub">Your first care action is logged. Here's what happens next.</p>
        <button class="onboarding-complete-btn" data-action="onboarding-complete-dismiss">Show me →</button>
      </div>
    </div>`;
  document.getElementById('onboarding-complete-overlay').addEventListener('click', e => {
    if (e.target.dataset.action === 'onboarding-complete-dismiss') {
      document.querySelector('.onboarding-complete-overlay')?.remove();
      if (currentMemberId) localStorage.setItem(`onboarding_show_coachmark_${currentMemberId}`, 'true');
      navigateTo('home');
    }
  });
}

function navigateTo(view, plantId = null) {
  closeSheet();
  state.view = view;
  state.plantId = plantId;
  if (view === 'home') renderHome();
  else if (view === 'plant') { plantDetailTab = 'summary'; renderPlantDetail(plantId); }
  else if (view === 'manage-households') renderManageHouseholds();
}

// ============================================================
// EVENT HANDLING
// ============================================================

async function handleEvent(e) {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  try {
  const action  = target.dataset.action;
  const plantId = target.dataset.plant;
  const taskId  = target.dataset.task;
  const noteId  = target.dataset.note;

  switch (action) {

    case 'login':
      handleLogin();
      break;

    case 'save-name':
      handleNameCapture();
      break;

    case 'save-new-password':
      handlePasswordReset();
      break;

    case 'sign-out':
      supabaseClient.auth.signOut().then(() => renderLoginScreen());
      break;

    case 'feedback':
      handleFeedbackTap();
      break;

    case 'toggle-household-switcher': {
      e.stopPropagation();
      const switcher = document.getElementById('household-switcher');
      const pill     = target.closest('.household-pill');
      const open     = switcher?.classList.toggle('open');
      pill?.classList.toggle('open', open);
      pill?.setAttribute('aria-expanded', open ? 'true' : 'false');
      break;
    }

    case 'open-manage-households': {
      const switcher = document.getElementById('household-switcher');
      const pill     = document.querySelector('.household-pill');
      switcher?.classList.remove('open');
      pill?.classList.remove('open');
      pill?.setAttribute('aria-expanded', 'false');
      manageHouseholdsEditingName = false;
      navigateTo('manage-households');
      break;
    }

    case 'switch-household': {
      const newId = target.dataset.householdId;
      if (!newId || newId === householdId) break;
      const switcher = document.getElementById('household-switcher');
      const pill     = document.querySelector('.household-pill');
      switcher?.classList.remove('open');
      pill?.classList.remove('open');
      pill?.setAttribute('aria-expanded', 'false');
      householdId = newId;
      activeTab = 'plants';
      await loadFromSupabase();
      navigateTo('home');
      break;
    }

    case 'manage-households-back':
      navigateTo('home');
      break;

    case 'manage-households-start-edit':
      manageHouseholdsEditingName = true;
      renderManageHouseholds();
      break;

    case 'manage-households-cancel-name':
      manageHouseholdsEditingName = false;
      renderManageHouseholds();
      break;

    case 'manage-households-save-name':
      await handleManageHouseholdsSaveName();
      break;

    case 'open-menu':
      openMenu();
      break;

    case 'close-menu':
      closeMenu();
      break;

    case 'change-password':
      closeMenu();
      renderChangePasswordSheet();
      break;

    case 'menu-notifications':
      closeMenu();
      renderNotificationsSheet();
      break;

    case 'sheet-enable-notifications':
      await subscribeToPush();
      closeSheet();
      showToast('🔔 Notifications enabled!');
      break;

    case 'save-change-password':
      await handleChangePassword();
      break;

    case 'menu-export-data': {
      closeMenu();
      const exportData = localStorage.getItem('plant-care-v1') ?? '[]';
      const exportBlob = new Blob([exportData], { type: 'application/json' });
      const exportUrl  = URL.createObjectURL(exportBlob);
      const exportA    = document.createElement('a');
      exportA.href     = exportUrl;
      exportA.download = 'plant-care-backup.json';
      exportA.click();
      URL.revokeObjectURL(exportUrl);
      break;
    }

    case 'menu-import-data': {
      closeMenu();
      const importInput = document.createElement('input');
      importInput.type   = 'file';
      importInput.accept = '.json,application/json';
      importInput.addEventListener('change', () => {
        const file = importInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const parsed = JSON.parse(ev.target.result);
            if (!Array.isArray(parsed)) throw new Error('Invalid format');
            localStorage.setItem('plant-care-v1', JSON.stringify(parsed));
            location.reload();
          } catch (_) {
            alert('Invalid backup file. Please select a valid plant-care-backup.json file.');
          }
        };
        reader.readAsText(file);
      });
      importInput.click();
      break;
    }

    case 'menu-show-onboarding': {
      closeMenu();
      if (currentMemberId) {
        localStorage.removeItem(`onboarding_step_${currentMemberId}`);
        localStorage.removeItem(`onboarding_plant_id_${currentMemberId}`);
        localStorage.removeItem(`onboarding_task_id_${currentMemberId}`);
        localStorage.removeItem(`onboarding_show_coachmark_${currentMemberId}`);
        localStorage.removeItem(`onboarding_show_pushsheet_${currentMemberId}`);
      }
      localStorage.removeItem('onboarding_coordination_shown');
      navigateTo('home');
      break;
    }

    case 'menu-sign-out':
      closeMenu();
      supabaseClient.auth.signOut().then(() => renderLoginScreen());
      break;

    case 'open-calendar-sync':
      closeMenu();
      openCalendarSyncSheet();
      break;

    case 'copy-calendar-link':
      await handleCopyCalendarLink(target);
      break;

    case 'subscribe-calendar': {
      const url = target.dataset.url;
      if (url) window.open(url);
      break;
    }

    case 'open-plant':
      navigateTo('plant', plantId);
      break;

    case 'onboarding-open-plant':
      closeSheet();
      state.view = 'plant';
      state.plantId = plantId;
      plantDetailTab = 'tasks';
      renderPlantDetail(plantId);
      break;

    case 'onboarding-add-first-task':
      handleOnboardingFirstTask(plantId);
      break;

    case 'go-home':
      navigateTo('home');
      break;

    case 'open-household-activity':
      openHouseholdActivity();
      posthog.capture('household_activity_viewed');
      break;

    case 'close-household-activity':
      closeHouseholdActivity();
      break;

    case 'switch-tab': {
      activeTab = target.dataset.tab;
      renderHome();
      posthog.capture('tab_viewed', { tab: activeTab === 'plants' ? 'my_plants' : 'caring' });
      break;
    }

    case 'view-schedule-tab': {
      activeTab = 'schedule';
      renderHome();
      break;
    }

    case 'enable-notifications': {
      console.log('enable-notifications handler reached');
      await subscribeToPush();
      if (Notification.permission === 'granted') showToast('Notifications enabled');
      renderHome();
      break;
    }

    case 'mark-done': {
      const _doneTask = getTask(plantId, taskId);
      const _doneName = getTaskConfig(_doneTask)?.name ?? _doneTask?.name ?? 'Task';
      const _isOnboardingDone = getOnboardingStep() === 3 && taskId === getOnboardingTaskId();
      markTaskDone(plantId, taskId);
      if (_isOnboardingDone) {
        setOnboardingStep(4);
        localStorage.setItem('onboarding_coordination_shown', '1');
        showOnboardingCompletionOverlay();
      } else {
        renderPlantDetail(state.plantId);
        showDoneToast(plantId, taskId, _doneName);
      }
      break;
    }

    case 'toast-add-note': {
      const pid = target.dataset.plant;
      const tid = target.dataset.task;
      const _toastEl = document.getElementById('toast');
      _toastEl?.classList.remove('visible', 'toast--interactive');
      const _appEl2 = document.getElementById('app');
      _appEl2.style.pointerEvents = 'none';
      setTimeout(() => { _appEl2.style.pointerEvents = ''; }, 350);
      if (pid && tid) renderPostTaskNoteSheet(pid, tid);
      break;
    }

    case 'mark-done-with-note':
      markTaskDone(plantId, taskId);
      renderPostTaskNoteSheet(plantId, taskId);
      break;

    case 'undo-mark-done':
      undoMarkTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'tasks-mark-done': {
      const _tasksRow = target.closest('.task-row');
      const _tasksList = _tasksRow?.parentElement;
      if (!_tasksRow || !_tasksList || _tasksRow.dataset.sliding === '1') break;
      const _rowRect  = _tasksRow.getBoundingClientRect();
      const _listRect = _tasksList.getBoundingClientRect();
      const _dy = Math.max(0, _listRect.bottom - _rowRect.bottom);
      _tasksRow.dataset.sliding = '1';
      _tasksRow.style.pointerEvents = 'none';
      _tasksRow.style.transition = 'transform 300ms ease, opacity 300ms ease';
      target.classList.add('done');
      requestAnimationFrame(() => {
        _tasksRow.style.transform = `translateY(${_dy}px)`;
        _tasksRow.style.opacity = '0';
      });
      setTimeout(() => {
        markTaskDone(plantId, taskId);
        renderPlantDetail(state.plantId);
      }, 300);
      break;
    }

    case 'tasks-undo-done':
      undoMarkTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'home-mark-done': {
      const _homeRow = target.closest('.attention-row, .upcoming-row');
      if (!_homeRow || _homeRow.classList.contains('marking-done')) break;
      const _homeTask = getTask(plantId, taskId);
      const _homeName = getTaskConfig(_homeTask)?.name ?? _homeTask?.name ?? 'Task';
      const _homePlantName = getPlant(plantId)?.name ?? '';
      target.classList.add('done');
      _homeRow.style.height = _homeRow.offsetHeight + 'px';
      _homeRow.style.overflow = 'hidden';
      requestAnimationFrame(() => { _homeRow.classList.add('marking-done'); });
      setTimeout(() => {
        markTaskDone(plantId, taskId);
        showUndoDoneToast(plantId, taskId, _homeName, _homePlantName);
      }, 280);
      break;
    }

    case 'summary-mark-done': {
      const _sumRow = target.closest('.attention-row');
      if (!_sumRow || _sumRow.classList.contains('marking-done')) break;
      const _sumTask = getTask(plantId, taskId);
      const _sumName = getTaskConfig(_sumTask)?.name ?? _sumTask?.name ?? 'Task';
      target.classList.add('done');
      _sumRow.style.height = _sumRow.offsetHeight + 'px';
      _sumRow.style.overflow = 'hidden';
      requestAnimationFrame(() => { _sumRow.classList.add('marking-done'); });
      setTimeout(() => {
        markTaskDone(plantId, taskId);
        showDoneToast(plantId, taskId, _sumName);
        renderPlantDetail(state.plantId);
      }, 320);
      break;
    }

    case 'caring-undo-done': {
      const _undoPid = target.dataset.plant;
      const _undoTid = target.dataset.task;
      const _undoToastEl = document.getElementById('toast');
      _undoToastEl?.classList.remove('visible', 'toast--interactive');
      clearTimeout(_undoToastEl?._hideTimeout);
      if (_undoPid && _undoTid) {
        undoMarkTaskDone(_undoPid, _undoTid);
        renderApp();
      }
      break;
    }

    case 'schedule-mark-done': {
      const _schedTask = getTask(plantId, taskId);
      const _schedName = getTaskConfig(_schedTask)?.name ?? _schedTask?.name ?? 'Task';
      markTaskDone(plantId, taskId);
      renderHome();
      showDoneToast(plantId, taskId, _schedName);
      break;
    }

    case 'caring-overdue-row-tap':
      openOverdueActionSheet(plantId, taskId);
      break;

    case 'caring-action-mark-done': {
      const _caTask = getTask(plantId, taskId);
      const _caName = getTaskConfig(_caTask)?.name ?? _caTask?.name ?? 'Task';
      const _caPlantName = getPlant(plantId)?.name ?? '';
      closeSheet();
      markTaskDone(plantId, taskId);
      renderApp();
      showUndoDoneToast(plantId, taskId, _caName, _caPlantName);
      break;
    }

    case 'caring-skip-task': {
      closeSheet();
      await skipTask(plantId, taskId);
      renderApp();
      break;
    }

    case 'reschedule-close':
    case 'reschedule-keep-original': {
      const direction = target.dataset.direction ?? null;
      const daysOffset = Number(target.dataset.days ?? 0);
      const recurrenceType = getTask(plantId, taskId)?.recurrenceType ?? 'interval';
      closeReschedulePrompt();
      if (action === 'reschedule-keep-original') {
        posthog.capture('schedule_adjusted', {
          choice: 'original',
          direction,
          days_offset: daysOffset,
          recurrence_type: recurrenceType,
        });
      }
      break;
    }

    case 'reschedule-modify': {
      const overlay = document.getElementById('reschedule-overlay');
      const newOverride = overlay?.dataset.modifiedFirstDate || null;
      const shiftedWeekdaysRaw = overlay?.dataset.modifiedWeekdays;
      const direction = target.dataset.direction ?? null;
      const daysOffset = Number(target.dataset.days ?? 0);
      const task = getTask(plantId, taskId);
      const recurrenceType = task?.recurrenceType ?? 'interval';
      if (task && newOverride) {
        const updates = { nextDueOverride: newOverride };
        if (recurrenceType === 'weekdays' && shiftedWeekdaysRaw) {
          try { updates.weekdays = JSON.parse(shiftedWeekdaysRaw); } catch {}
        }
        await updateTask(plantId, taskId, updates);
      }
      closeReschedulePrompt();
      posthog.capture('schedule_adjusted', {
        choice: 'modified',
        direction,
        days_offset: daysOffset,
        recurrence_type: recurrenceType,
      });
      renderApp();
      break;
    }

    case 'schedule-mark-done-with-note':
      markTaskDone(plantId, taskId);
      renderPostTaskNoteSheet(plantId, taskId);
      break;

    case 'schedule-undo-mark-done':
      undoMarkTaskDone(plantId, taskId);
      renderHome();
      break;

    case 'user-filter-toggle': {
      const user = target.dataset.user;
      activeFilter = activeFilter.includes(user)
        ? activeFilter.filter(u => u !== user)
        : [...activeFilter, user];
      renderApp();
      refreshHouseholdActivity();
      break;
    }

    case 'carelog-toggle-filters':
      careLogFiltersOpen = !careLogFiltersOpen;
      renderPlantDetail(state.plantId);
      break;

    case 'carelog-mode':
      careLogMode = target.dataset.mode;
      renderPlantDetail(state.plantId);
      break;

    case 'reassign-task':
      reassignTask(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'pause-task':
      pauseTask(plantId, taskId);
      closeSheet();
      renderPlantDetail(state.plantId);
      break;

    case 'resume-task':
      resumeTask(plantId, taskId);
      closeSheet();
      renderPlantDetail(state.plantId);
      break;

    case 'delete-plant': {
      const plantToDelete = getPlant(plantId);
      if (!plantToDelete) break;
      const deletedName = plantToDelete.name;
      await deletePlant(plantId);
      closeSheet();
      navigateTo('home');
      showToast(`🗑️ ${deletedName} deleted`);
      break;
    }

    case 'delete-task':
      if (confirm('Permanently delete this task? This cannot be undone.')) {
        deleteTask(plantId, taskId);
        closeSheet();
        renderPlantDetail(state.plantId);
        showToast('🗑️ Task deleted!');
      }
      break;

    case 'caring-open-edit-task':
      openedFromCaring = true;
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'carelog-open-edit-task':
      if (!taskId) break;
      openedFromCareLog = true;
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'carelog-open-edit-note': {
      const noteId2 = target.dataset.note;
      if (!noteId2) break;
      const activeMemberId2 = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToOpen = notes.find(n => n.id === noteId2);
      if (!noteToOpen || noteToOpen.memberId !== activeMemberId2) break;
      renderEditNoteSheet(target.dataset.plant, noteId2);
      break;
    }

    case 'edit-task':
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'edit-plant':
    case 'open-edit-plant':
      renderEditPlantSheet(plantId);
      break;

    case 'edit-plant-change-icon': {
      const nameInput = document.getElementById('sheet-plant-name');
      if (nameInput) state.sheetData.editPlantName = nameInput.value;

      state.sheetData.subSheetSnapshot = {
        selectedEmoji: state.sheetData.selectedEmoji,
        pendingPlantPhoto: state.sheetData.pendingPlantPhoto,
        activeTab: state.sheetData.activeTab,
      };

      if (state.sheetData.editIconMode === 'photo') {
        state.sheetData.pendingPlantPhoto = null;
        state.sheetData.selectedEmoji = null;
      }

      state.sheetData.step = 1;
      openSheet(renderAddPlantStep1Html(
        state.sheetData.activeTab || 'all',
        state.sheetData.selectedEmoji,
        state.sheetData.pendingPlantPhoto
      ));
      break;
    }

    case 'edit-plant-change-cancel': {
      const snap = state.sheetData.subSheetSnapshot;
      if (snap) {
        const cur = state.sheetData.pendingPlantPhoto;
        if (cur && cur !== snap.pendingPlantPhoto && cur.blob && cur.previewUrl) {
          URL.revokeObjectURL(cur.previewUrl);
        }
        state.sheetData.selectedEmoji = snap.selectedEmoji;
        state.sheetData.pendingPlantPhoto = snap.pendingPlantPhoto;
        state.sheetData.activeTab = snap.activeTab;
        state.sheetData.subSheetSnapshot = null;
      }
      state.sheetData.step = 2;
      const editPlant = getPlant(state.sheetData.plantId);
      openSheet(renderEditPlantStep2Html(editPlant));
      attachArrivalDateListener('Set date');
      break;
    }

    case 'edit-plant-cancel':
      if (state.sheetData?.pendingPlantPhoto?.blob && state.sheetData.pendingPlantPhoto.previewUrl) {
        URL.revokeObjectURL(state.sheetData.pendingPlantPhoto.previewUrl);
      }
      closeSheet();
      break;

    case 'edit-plant-show-delete': {
      document.getElementById('edit-plant-delete-btn').style.display = 'none';
      document.getElementById('edit-plant-delete-confirm').style.display = '';
      const lockStyle = 'pointer-events:none;opacity:0.4;';
      const iconRow = document.getElementById('edit-plant-icon-row');
      if (iconRow) iconRow.style.cssText = lockStyle;
      document.getElementById('edit-plant-fields').style.cssText = lockStyle;
      document.getElementById('edit-plant-arrival-pill').style.cssText = lockStyle;
      document.getElementById('edit-plant-save-row').style.cssText = `${lockStyle}margin-top:14px;display:flex;gap:8px;`;
      break;
    }

    case 'edit-plant-hide-delete': {
      document.getElementById('edit-plant-delete-btn').style.display = '';
      document.getElementById('edit-plant-delete-confirm').style.display = 'none';
      const iconRow = document.getElementById('edit-plant-icon-row');
      if (iconRow) iconRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin-top:4px;padding-bottom:14px;';
      document.getElementById('edit-plant-fields').style.cssText = '';
      document.getElementById('edit-plant-arrival-pill').style.cssText = '';
      document.getElementById('edit-plant-save-row').style.cssText = 'margin-top:14px;display:flex;gap:8px;';
      break;
    }

    case 'add-note':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;

    case 'summary-fab-toggle': {
      document.getElementById('summary-fab')?.classList.toggle('expanded');
      break;
    }

    case 'summary-fab-collapse': {
      document.getElementById('summary-fab')?.classList.remove('expanded');
      break;
    }

    case 'summary-fab-add-note': {
      document.getElementById('summary-fab')?.classList.remove('expanded');
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;
    }

    case 'summary-fab-add-task': {
      document.getElementById('summary-fab')?.classList.remove('expanded');
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddTaskStep1(plantId);
      break;
    }

    case 'close-sheet':
      closeSheet();
      break;

    case 'summary-carelog-add-note':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;

    case 'summary-carelog-undo': {
      if (plantId && taskId) {
        undoMarkTaskDone(plantId, taskId);
        renderPlantDetail(state.plantId);
      }
      break;
    }

    case 'delete-note': {
      const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToDelete = notes.find(n => n.id === noteId);
      if (!noteToDelete || noteToDelete.memberId !== activeMemberId) break;
      if (confirm('Delete this note?')) {
        await deleteNote(noteId);
        renderPlantDetail(state.plantId);
      }
      break;
    }

    case 'edit-note': {
      const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToEdit = notes.find(n => n.id === noteId);
      if (!noteToEdit || noteToEdit.memberId !== activeMemberId) break;
      renderEditNoteSheet(plantId ?? noteToEdit.plantId, noteId);
      break;
    }

    case 'sheet-save-edit-note': {
      const _nid = target.dataset.note;
      const textarea = document.getElementById('sheet-edit-note-text');
      const newText = textarea?.value?.trim();
      if (!newText) { alert('Note cannot be empty.'); return; }
      await updateNote(_nid, newText);
      await loadActivityFeed();
      const _restoreTab = sheetEntryTab;
      sheetEntryTab = null;
      closeSheet();
      if (_restoreTab && state.view === 'plant') plantDetailTab = _restoreTab;
      renderPlantDetail(state.plantId);
      break;
    }

    case 'sheet-delete-note': {
      const _nid = target.dataset.note;
      const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
      const noteToDelete = notes.find(n => n.id === _nid);
      if (!noteToDelete || noteToDelete.memberId !== activeMemberId) break;
      if (!confirm('Delete this note?')) break;
      await deleteNote(_nid);
      await loadActivityFeed();
      const _restoreTab = sheetEntryTab;
      sheetEntryTab = null;
      closeSheet();
      if (_restoreTab && state.view === 'plant') plantDetailTab = _restoreTab;
      renderPlantDetail(state.plantId);
      break;
    }

    case 'edit-note-pick-photo': {
      const input = document.getElementById('edit-note-file-input');
      if (input) { input.value = ''; input.click(); }
      break;
    }

    case 'edit-note-delete-photo': {
      const _nid = state.sheetData?.noteId;
      if (!_nid) break;
      const _note = notes.find(n => n.id === _nid);
      if (!_note?.photoUrl) break;
      if (!confirm('Delete this photo?')) break;
      let _meta = state.sheetData?.editNotePhotoMeta;
      if (!_meta?.id) _meta = await fetchPhotoForNote(_nid);
      if (!_meta?.id) { showToast('Could not find photo'); break; }
      await deletePlantPhoto({ id: _meta.id, storage_url: _meta.storage_url, note_id: _nid });
      if (state.sheetData) state.sheetData.editNotePhotoMeta = null;
      await refreshEditNotePhotoSection();
      break;
    }

    case 'toggle-notes-show-all':
      if (notesShowAll.has(plantId)) {
        notesShowAll.delete(plantId);
      } else {
        notesShowAll.add(plantId);
      }
      renderPlantDetail(state.plantId);
      break;

    case 'add-plant':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddPlantSheet();
      break;

    case 'add-plant-tab': {
      const tab = target.dataset.tab;
      state.sheetData.activeTab = tab;
      const tabEmojis = tab === 'all' ? PLANT_EMOJIS : (EMOJI_CATEGORIES[tab] ?? PLANT_EMOJIS);
      const grid = document.getElementById('add-plant-emoji-grid');
      if (grid) {
        grid.innerHTML = renderAddPlantEmojiItems(tabEmojis, state.sheetData.selectedEmoji);
      }
      document.querySelectorAll('#sheet .emoji-cat-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
      });
      break;
    }

    case 'add-plant-next': {
      state.sheetData.step = 2;
      if (state.sheetMode === 'edit-plant') {
        const newIconMode = state.sheetData.pendingPlantPhoto ? 'photo' : 'emoji';
        if (newIconMode === 'emoji' && !state.sheetData.selectedEmoji) {
          state.sheetData.selectedEmoji = state.sheetData.subSheetSnapshot?.selectedEmoji || '🪴';
        }
        state.sheetData.editIconMode = newIconMode;
        state.sheetData.subSheetSnapshot = null;
        const editPlant = getPlant(state.sheetData.plantId);
        openSheet(renderEditPlantStep2Html(editPlant));
        attachArrivalDateListener('Set date');
      } else {
        const emoji = state.sheetData.selectedEmoji || '🪴';
        state.sheetData.selectedEmoji = emoji;
        openSheet(renderAddPlantStep2Html(emoji));
        attachAddPlantNameListener();
        const savedName = state.sheetData.plantName;
        if (savedName) {
          const nameInput = document.getElementById('sheet-plant-name');
          if (nameInput) nameInput.value = savedName;
        }
        attachAddPlantStep2State();
        setTimeout(() => document.getElementById('sheet-plant-name')?.focus(), 80);
      }
      break;
    }

    case 'add-plant-to-step3': {
      const name = document.getElementById('sheet-plant-name')?.value?.trim();
      if (!name) return;
      state.sheetData.plantName = name;
      state.sheetData.step = 3;
      openSheet(renderAddPlantStep3Html(state.sheetData.selectedEmoji || '🪴', state.sheetData.plantName));
      attachArrivalSelectListeners();
      break;
    }

    case 'add-plant-back': {
      const curStep = state.sheetData.step ?? 1;
      if (curStep === 3) {
        state.sheetData.step = 2;
        openSheet(renderAddPlantStep2Html(state.sheetData.selectedEmoji || '🪴'));
        attachAddPlantNameListener();
        const savedName = state.sheetData.plantName;
        if (savedName) {
          const nameInput = document.getElementById('sheet-plant-name');
          if (nameInput) nameInput.value = savedName;
        }
        attachAddPlantStep2State();
      } else {
        state.sheetData.step = 1;
        openSheet(renderAddPlantStep1Html(state.sheetData.activeTab || 'all', state.sheetData.selectedEmoji || '🪴', state.sheetData.pendingPlantPhoto));
      }
      break;
    }

    case 'add-plant-change-emoji':
      state.sheetData.step = 1;
      openSheet(renderAddPlantStep1Html(state.sheetData.activeTab || 'all', state.sheetData.selectedEmoji || '🪴', state.sheetData.pendingPlantPhoto));
      break;

    case 'add-plant-pick-photo': {
      const input = document.getElementById('add-plant-file-input');
      if (input) { input.value = ''; input.click(); }
      break;
    }

    case 'add-plant-remove-photo':
      clearPendingPlantPhoto();
      openSheet(renderAddPlantStep1Html(
        state.sheetData.activeTab || 'all',
        state.sheetData.selectedEmoji || '🪴',
        null
      ));
      break;

    case 'add-task':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddTaskStep1(plantId);
      break;

    case 'add-task-select-type': {
      const typeKey = target.dataset.typeKey;
      const pid = target.dataset.plant;
      renderAddTaskStep2(pid, typeKey);
      break;
    }

    case 'add-task-back': {
      const pid = target.dataset.plant;
      renderAddTaskStep1(pid);
      break;
    }

    case 'add-task-pick-icon':
      document.querySelectorAll('#sheet .icon-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      break;

    case 'edit-task-toggle-icon-picker': {
      const picker = document.getElementById('edit-task-icon-picker');
      if (picker) picker.style.display = picker.style.display === 'none' ? '' : 'none';
      break;
    }

    case 'edit-task-pick-icon': {
      const icon = target.dataset.icon;
      const tile = document.querySelector('#sheet .edit-task-icon-tile');
      if (tile && icon) { tile.textContent = icon; tile.dataset.emoji = icon; }
      document.querySelectorAll('#sheet #edit-task-icon-picker .icon-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      const picker = document.getElementById('edit-task-icon-picker');
      if (picker) picker.style.display = 'none';
      break;
    }

    case 'pick-plant-emoji':
      document.querySelectorAll('#sheet .emoji-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      if (state.sheetMode === 'add-plant' || state.sheetMode === 'edit-plant') state.sheetData.selectedEmoji = target.dataset.emoji;
      break;

    case 'sheet-save-new-plant':
      handleSaveNewPlant();
      break;

    case 'sheet-save-new-task':
      handleSaveNewTask();
      break;

    case 'sheet-cancel':
      if (openedFromCaring) {
        openedFromCaring = false;
        sheetEntryTab = null;
        closeSheet();
        activeTab = 'schedule';
        renderHome();
      } else if (openedFromCareLog) {
        openedFromCareLog = false;
        sheetEntryTab = null;
        closeSheet();
        plantDetailTab = 'carelog';
        renderPlantDetail(state.plantId);
      } else {
        if (sheetEntryTab && state.view === 'plant') {
          plantDetailTab = sheetEntryTab;
          closeSheet();
          renderPlantDetail(state.plantId);
        } else {
          closeSheet();
        }
        sheetEntryTab = null;
      }
      break;

    case 'sheet-set-owner':
      document.querySelectorAll('#sheet .owner-option, #sheet .owner-pill').forEach(btn => btn.classList.remove('selected'));
      target.classList.add('selected');
      break;

    case 'sheet-toggle-recurrence': {
      const rtype = target.dataset.rtype;
      const container = document.getElementById('recurrence-container');
      if (container) container.className = `recurrence-${rtype}`;
      document.querySelectorAll('#sheet .recurrence-option').forEach(o => o.classList.remove('selected'));
      target.classList.add('selected');
      updateRecurrenceSummary();
      break;
    }

    case 'toggle-repeating-task': {
      const toggleBtn = document.getElementById('repeating-toggle');
      if (!toggleBtn) break;
      const isOn      = toggleBtn.getAttribute('aria-checked') === 'true';
      const willTurnOn = !isOn;

      // Edit Task: confirm before stripping recurrence from an existing recurring task
      if (!willTurnOn && state.sheetMode === 'edit-task') {
        const { plantId: _pid, taskId: _tid } = state.sheetData;
        const _existTask = getTask(_pid, _tid);
        if ((_existTask?.recurrenceType ?? 'interval') !== 'one-off') {
          if (!confirm('This will remove the recurrence schedule. The task will become a one-off. Continue?')) break;
        }
      }

      toggleBtn.setAttribute('aria-checked', String(willTurnOn));
      toggleBtn.classList.toggle('on', willTurnOn);

      const toggleRow = document.getElementById('repeating-toggle-row');
      const block     = document.getElementById('task-recurrence-block');
      const container = document.getElementById('recurrence-container');
      const label     = document.getElementById('task-due-label');
      const pauseRow  = document.getElementById('pause-toggle-row');

      if (willTurnOn) {
        toggleRow?.classList.add('task-toggle-row--expanded');
        if (block)     block.style.display = '';
        if (container) {
          container.className = 'recurrence-interval';
          document.querySelectorAll('#sheet .recurrence-option').forEach(o => {
            o.classList.toggle('selected', o.dataset.rtype === 'interval');
          });
        }
        if (label)    label.textContent = 'First due date';
        if (pauseRow) pauseRow.style.display = '';
      } else {
        toggleRow?.classList.remove('task-toggle-row--expanded');
        if (block)     block.style.display = 'none';
        if (container) container.className = 'recurrence-one-off';
        if (label)     label.textContent = 'Due date';
        if (pauseRow)  pauseRow.style.display = 'none';
      }
      updateRecurrenceSummary();
      break;
    }

    case 'toggle-task-pause': {
      const btn = document.getElementById('pause-toggle');
      if (!btn) break;
      const isOn = btn.getAttribute('aria-checked') === 'true';
      btn.setAttribute('aria-checked', String(!isOn));
      btn.classList.toggle('on', !isOn);
      break;
    }

    case 'sheet-toggle-weekday':
      target.classList.toggle('selected');
      updateRecurrenceSummary();
      break;

    case 'sheet-save-task': {
      const { plantId: pid, taskId: tid } = state.sheetData;

      const container = document.getElementById('recurrence-container');
      const recType = container?.classList.contains('recurrence-weekdays') ? 'weekdays'
                    : container?.classList.contains('recurrence-one-off')  ? 'one-off'
                    : 'interval';

      let frequencyDays = getTask(pid, tid)?.frequencyDays ?? 1;
      let weekdays = [];

      if (recType === 'interval') {
        const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
        if (!freq || freq < 1) { alert('Please enter a valid frequency (minimum 1 day).'); return; }
        frequencyDays = freq;
      } else if (recType === 'weekdays') {
        weekdays = [...document.querySelectorAll('#sheet .weekday-btn.selected')].map(b => parseInt(b.dataset.day));
        if (weekdays.length === 0) { alert('Please select at least one day of the week.'); return; }
      }

      const selectedOwner = document.querySelector('#sheet .owner-pill.selected, #sheet .owner-option.selected');
      const lastDoneEl  = document.getElementById('sheet-last-done');
      const overrideVal = getSelectDate('task-override');

      const taskUpdates = {
        recurrenceType: recType,
        frequencyDays,
        weekdays,
        owner: selectedOwner?.dataset.owner ?? 'Matu',
        nextDueOverride: overrideVal || null,
      };
      if (lastDoneEl) taskUpdates.lastDone = lastDoneEl.value || null;
      const pauseToggleEl = document.getElementById('pause-toggle');
      if (pauseToggleEl) taskUpdates.paused = pauseToggleEl.getAttribute('aria-checked') === 'true';

      if (!TASK_CONFIG[tid]) {
        const nameVal = document.getElementById('sheet-task-name')?.value?.trim();
        if (nameVal) taskUpdates.name = nameVal;
        const iconVal = document.querySelector('#sheet .edit-task-icon-tile')?.dataset.emoji;
        if (iconVal) taskUpdates.icon = iconVal;
      }

      updateTask(pid, tid, taskUpdates);
      closeSheet();
      if (openedFromCaring) {
        openedFromCaring = false;
        sheetEntryTab = null;
        activeTab = 'schedule';
        renderHome();
      } else if (openedFromCareLog) {
        openedFromCareLog = false;
        sheetEntryTab = null;
        plantDetailTab = 'carelog';
        renderPlantDetail(pid);
      } else {
        if (sheetEntryTab) plantDetailTab = sheetEntryTab;
        sheetEntryTab = null;
        renderPlantDetail(pid);
      }
      showToast('✅ Task saved!');
      break;
    }

    case 'add-note-pick-photo': {
      console.log('[pickPhoto] tapped', { sheetMode: state.sheetMode, sheetData: state.sheetData });
      const textEl = document.getElementById('sheet-note-text');
      if (textEl) state.sheetData.pendingText = textEl.value;
      const input = document.getElementById('add-note-file-input');
      console.log('[pickPhoto] input element', { found: !!input, prevValue: input?.value, prevFiles: input?.files?.length });
      if (input) { input.value = ''; input.click(); }
      break;
    }

    case 'add-note-remove-photo':
      clearPendingPhoto();
      refreshAddNotePhotoArea();
      break;

    case 'add-note-view-photo':
      openPhotoFullscreen(target.dataset.url, target.dataset.noteId, target.dataset.plantId);
      break;

    case 'open-slideshow': {
      const pid = target.dataset.plant;
      openSlideshow(pid, null);
      break;
    }

    case 'photo-cap-delete-oldest': {
      const pid = target.dataset.plant;
      await deleteOldestPlantPhoto(pid);
      // Resume the save flow with the original plantId + preserved sheetData
      renderAddNoteSheet(pid);
      // Auto-trigger save since the user already committed
      await runSaveNoteFlow(pid);
      break;
    }

    case 'photo-cap-manage': {
      await renderManagePhotosSheet(target.dataset.plant);
      break;
    }

    case 'photo-cap-back': {
      const pid = state.sheetData?.plantId;
      if (pid) renderAddNoteSheet(pid);
      break;
    }

    case 'manage-photos-delete': {
      const photoId = target.dataset.photoId;
      const pid     = target.dataset.plant;
      const noteId  = target.dataset.noteId || null;
      const url     = target.dataset.url || null;
      await deletePlantPhoto({ id: photoId, storage_url: url, note_id: noteId });
      await renderManagePhotosSheet(pid);
      break;
    }

    case 'sheet-save-note': {
      const { plantId: pid } = state.sheetData;
      await runSaveNoteFlow(pid);
      break;
    }

    case 'sheet-save-post-task-note': {
      const { plantId: pid, taskId: tid } = state.sheetData;
      const text = document.getElementById('post-task-note-text')?.value?.trim();
      closeSheet();
      if (text) await addNote(pid, text, tid);
      if (state.view === 'plant') renderPlantDetail(pid);
      else renderHome();
      break;
    }

    case 'sheet-skip-post-task-note':
      closeSheet();
      break;

    case 'export-data': {
      const data = localStorage.getItem('plant-care-v1') ?? '[]';
      const blob = new Blob([data], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'plant-care-backup.json';
      a.click();
      URL.revokeObjectURL(url);
      break;
    }

    case 'import-data': {
      const fileInput = document.createElement('input');
      fileInput.type   = 'file';
      fileInput.accept = '.json,application/json';
      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parsed = JSON.parse(e.target.result);
            if (!Array.isArray(parsed)) throw new Error('Invalid format');
            localStorage.setItem('plant-care-v1', JSON.stringify(parsed));
            location.reload();
          } catch (_) {
            alert('Invalid backup file. Please select a valid plant-care-backup.json file.');
          }
        };
        reader.readAsText(file);
      });
      fileInput.click();
      break;
    }

    case 'plant-detail-tab':
      plantDetailTab = target.dataset.tab;
      renderPlantDetail(state.plantId);
      posthog.capture('tab_viewed', { tab: plantDetailTab === 'carelog' ? 'care_log' : plantDetailTab });
      break;

    case 'carelog-segment':
      careLogSegment = target.dataset.segment;
      renderPlantDetail(state.plantId);
      break;

    case 'sheet-save-plant':
      handleSavePlant();
      break;

    // DEV TOOLS — remove before public launch
    case 'dev-seed-empty':     showDevToolsConfirm('empty',     'Empty state');  break;
    case 'dev-seed-heavy-v3':  showDevToolsConfirm('heavy-v3',  'Heavy v3');     break;
    case 'dev-seed-heavy-v4':  showDevToolsConfirm('heavy-v4',  'Heavy v4');     break;
    case 'dev-tools-cancel': document.getElementById('dev-tools-body').innerHTML = `
      <button class="dev-tools-btn" data-action="dev-seed-empty">🌱 Empty state</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy-v3">🌳 Heavy v3</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy-v4">🌲 Heavy v4</button>`; break;
    case 'dev-tools-confirm': {
      if (target.disabled) break;
      target.disabled = true;
      const _origLabel = target.textContent;
      target.textContent = 'Running…';
      const _ok = await runDevSeed(target.dataset.scenario);
      if (!_ok) {
        target.disabled = false;
        target.textContent = _origLabel;
      }
      break;
    }
  }
  } catch (err) {
    console.error('handleEvent error:', err);
  }
}

// ============================================================
// PUSH NOTIFICATIONS
// ============================================================

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('[SW] registration failed:', err);
  }
}

async function subscribeToPush() {
  if (!swRegistration || !('PushManager' in window)) return;

  let permission = Notification.permission;
  if (permission === 'default') permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    if (membersCache.length === 0) await loadFromSupabase();
    const member = membersCache.find(m => m.display_name === activeUser);
    if (!member) return;

    const { error } = await supabaseClient
      .from('push_subscriptions')
      .upsert(
        { household_member_id: member.id, subscription: subscription.toJSON() },
        { onConflict: 'household_member_id' }
      );
    if (error) {
      console.error('[Push] upsert error:', error);
    } else {
      localStorage.setItem(`push_accepted_${activeUser}`, '1');
    }
  } catch (err) {
    console.error('[Push] subscription failed:', err);
  }
}

// ============================================================
// THREE-SELECT DATE PICKERS
// ============================================================

const SEL_MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month is 1-indexed
}

function attachDowLabel(prefix) {
  const dayEl   = document.getElementById(`${prefix}-day`);
  const monthEl = document.getElementById(`${prefix}-month`);
  const yearEl  = document.getElementById(`${prefix}-year`);
  const labelEl = document.getElementById(`${prefix}-dow-label`);
  if (!dayEl || !monthEl || !yearEl || !labelEl) return;

  function update() {
    const d = parseInt(dayEl.value);
    const m = parseInt(monthEl.value);
    const y = parseInt(yearEl.value);
    if (!d || !m || !y) { labelEl.textContent = ''; return; }
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime()) || date.getDate() !== d) { labelEl.textContent = ''; return; }
    labelEl.textContent = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  dayEl.addEventListener('change',   update);
  monthEl.addEventListener('change', update);
  yearEl.addEventListener('change',  update);
  update();
}

function renderDateSelectHtml(prefix, initialDate, yearMin, yearMax) {
  const ref = (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) ? initialDate : todayStr();
  const [ry, rm, rd] = ref.split('-').map(Number);
  const initYear  = Math.max(yearMin, Math.min(yearMax, ry));
  const initMonth = rm;
  const maxD      = daysInMonth(initYear, initMonth);
  const initDay   = Math.min(rd, maxD);

  const dayOpts = Array.from({length: maxD}, (_, i) => {
    const v = i + 1;
    return `<option value="${v}"${v === initDay ? ' selected' : ''}>${v}</option>`;
  }).join('');

  const monthOpts = SEL_MONTH_NAMES.map((name, i) => {
    const v = i + 1;
    return `<option value="${v}"${v === initMonth ? ' selected' : ''}>${name}</option>`;
  }).join('');

  const yearOpts = [];
  for (let y = yearMin; y <= yearMax; y++) {
    yearOpts.push(`<option value="${y}"${y === initYear ? ' selected' : ''}>${y}</option>`);
  }

  setTimeout(() => attachDowLabel(prefix), 0);

  return `<div style="display:flex;gap:8px;width:100%;">
    <select id="${prefix}-day" class="form-input" style="flex:1;">${dayOpts}</select>
    <select id="${prefix}-month" class="form-input" style="flex:2;">${monthOpts}</select>
    <select id="${prefix}-year" class="form-input" style="flex:1.5;">${yearOpts}</select>
  </div>
  <div id="${prefix}-dow-label" class="date-select-dow-label"></div>`;
}

function getSelectDate(prefix) {
  const d = parseInt(document.getElementById(`${prefix}-day`)?.value  ?? '');
  const m = parseInt(document.getElementById(`${prefix}-month`)?.value ?? '');
  const y = parseInt(document.getElementById(`${prefix}-year`)?.value  ?? '');
  if (!d || !m || !y) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// Arrival picker — past-only constraints, sets userTouchedArrivalDate flag
function attachArrivalSelectListeners() {
  userTouchedArrivalDate = false;
  const today = todayStr();
  const [ty, tm, td] = today.split('-').map(Number);

  const dayEl   = document.getElementById('arrival-day');
  const monthEl = document.getElementById('arrival-month');
  const yearEl  = document.getElementById('arrival-year');
  if (!dayEl || !monthEl || !yearEl) return;

  function refresh(setFlag) {
    if (setFlag) userTouchedArrivalDate = true;
    const y = parseInt(yearEl.value);
    const m = parseInt(monthEl.value);
    const d = parseInt(dayEl.value);

    // Constrain month options: if year == today's year, max month = today's month
    const maxM = (y === ty) ? tm : 12;
    const curM = Math.min(m, maxM);
    monthEl.innerHTML = SEL_MONTH_NAMES.map((name, i) => {
      const v = i + 1;
      if (v > maxM) return '';
      return `<option value="${v}"${v === curM ? ' selected' : ''}>${name}</option>`;
    }).join('');

    // Constrain day options: respect month length; if year+month == today, max day = today
    const dMax  = daysInMonth(y, curM);
    const maxD  = (y === ty && curM === tm) ? Math.min(td, dMax) : dMax;
    const curD  = Math.min(d, maxD);
    dayEl.innerHTML = Array.from({length: maxD}, (_, i) => {
      const v = i + 1;
      if (v > maxD) return '';
      return `<option value="${v}"${v === curD ? ' selected' : ''}>${v}</option>`;
    }).join('');

    // Safety: if result is still in future, snap to today
    const built = `${y}-${String(curM).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
    if (built > today) {
      yearEl.value  = String(ty);
      refresh(false);
    }
  }

  yearEl.addEventListener('change',  () => refresh(true));
  monthEl.addEventListener('change', () => refresh(true));
  dayEl.addEventListener('change',   () => refresh(true));
  refresh(false); // apply initial constraints without touching the flag
}

// Task-due / task-override pickers — future-only constraints
function attachFutureDateSelectListeners(prefix) {
  const today = todayStr();
  const [ty, tm, td] = today.split('-').map(Number);

  const dayEl   = document.getElementById(`${prefix}-day`);
  const monthEl = document.getElementById(`${prefix}-month`);
  const yearEl  = document.getElementById(`${prefix}-year`);
  if (!dayEl || !monthEl || !yearEl) return;

  function refresh() {
    const y = parseInt(yearEl.value);
    const m = parseInt(monthEl.value);
    const d = parseInt(dayEl.value);

    // Constrain month options: if year == today's year, min month = today's month
    const minM = (y === ty) ? tm : 1;
    const curM = Math.max(m, minM);
    monthEl.innerHTML = SEL_MONTH_NAMES.map((name, i) => {
      const v = i + 1;
      if (v < minM) return '';
      return `<option value="${v}"${v === curM ? ' selected' : ''}>${name}</option>`;
    }).join('');

    // Constrain day options: if year+month == today, min day = today
    const dMax  = daysInMonth(y, curM);
    const minD  = (y === ty && curM === tm) ? td : 1;
    const curD  = Math.min(Math.max(d, minD), dMax);
    dayEl.innerHTML = Array.from({length: dMax}, (_, i) => {
      const v = i + 1;
      if (v < minD) return '';
      return `<option value="${v}"${v === curD ? ' selected' : ''}>${v}</option>`;
    }).join('');

    // Safety: if result is still in past, snap to today
    const built = `${y}-${String(curM).padStart(2, '0')}-${String(curD).padStart(2, '0')}`;
    if (built < today) {
      yearEl.value = String(ty);
      refresh();
    }
  }

  yearEl.addEventListener('change',  refresh);
  monthEl.addEventListener('change', refresh);
  dayEl.addEventListener('change',   refresh);
  refresh(); // apply initial constraints
}

// Rebuilds the Edit/Add Task recurrence summary line from current DOM state.
function updateRecurrenceSummary() {
  const el = document.getElementById('recurrence-summary');
  if (!el) return;

  const toggleBtn = document.getElementById('repeating-toggle');
  const isOn = toggleBtn?.getAttribute('aria-checked') === 'true';
  if (!isOn) { el.style.display = 'none'; return; }

  const prefix = document.getElementById('task-override-day') ? 'task-override'
               : document.getElementById('task-due-oneoff-day') ? 'task-due-oneoff'
               : null;
  const firstDue = prefix ? getSelectDate(prefix) : null;
  if (!firstDue) { el.style.display = 'none'; return; }

  const container = document.getElementById('recurrence-container');
  const rtype = container?.classList.contains('recurrence-weekdays') ? 'weekdays' : 'interval';

  let tail = '';
  if (rtype === 'interval') {
    const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
    if (!freq || freq < 1) { el.style.display = 'none'; return; }
    tail = `recurs every ${freq} day${freq === 1 ? '' : 's'}`;
  } else {
    const selected = Array.from(document.querySelectorAll('#sheet .weekday-btn.selected'))
      .map(b => parseInt(b.dataset.day))
      .filter(n => !Number.isNaN(n))
      .sort((a, b) => a - b);
    if (selected.length === 0) { el.style.display = 'none'; return; }
    const SHORT_DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    tail = `recurs every ${selected.map(d => SHORT_DOW[d]).join(', ')}`;
  }

  const startLabel = new Date(firstDue + 'T12:00:00')
    .toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const verb = el.dataset.started === 'true' ? 'Started' : 'Starts';
  el.textContent = `${verb} ${startLabel} · ${tail}`;
  el.style.display = '';
}

// Compacts the shared date selects for the Add/Edit Task sheet (arrival picker unaffected).
function applyCompactDateSelectStyles(prefix) {
  const apply = (el, flexVal) => {
    if (!el) return;
    el.style.flex     = flexVal;
    el.style.fontSize = '13px';
    el.style.padding  = '6px 8px';
  };
  apply(document.getElementById(`${prefix}-day`),   '0.7');
  apply(document.getElementById(`${prefix}-month`), '1.6');
  apply(document.getElementById(`${prefix}-year`),  '0.9');
  const dow = document.getElementById(`${prefix}-dow-label`);
  if (dow) { dow.style.fontSize = '11px'; dow.style.color = '#7a8a7a'; }
}

function attachRecurrenceSummaryListeners(datePrefix) {
  const update = () => updateRecurrenceSummary();
  document.getElementById('sheet-frequency')?.addEventListener('input', update);
  ['day', 'month', 'year'].forEach(part => {
    document.getElementById(`${datePrefix}-${part}`)?.addEventListener('change', update);
  });
  update();
}

// ============================================================
// ARRIVAL DATE LISTENER
// ============================================================

function attachArrivalDateListener(emptyText = 'Set date') {
  const input = document.getElementById('sheet-acquired-date');
  if (!input) return;

  input.max = todayStr();

  document.querySelector('.arrival-date-btn, .arrival-optional-pill')?.addEventListener('click', function(e) {
    e.preventDefault();
    input.max = todayStr();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  });

  input.addEventListener('change', function() {
    const display = document.getElementById('arrival-date-display');
    const btn = this.closest('.arrival-date-btn') ?? this.closest('.arrival-optional-pill');
    if (this.value) {
      if (display) display.textContent = new Date(this.value + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      btn?.classList.add('has-value');
    } else {
      if (display) display.textContent = emptyText;
      btn?.classList.remove('has-value');
    }
  });
}

// ============================================================
// FEEDBACK
// ============================================================

function handleFeedbackTap() {
  const key = `feedbackCaseCount_${currentUserId ?? 'anon'}`;
  const count = (parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + 1;
  localStorage.setItem(key, String(count));

  const displayName = activeUser ?? membersCache.find(m => m.display_name)?.display_name ?? 'User';
  const caseNum = String(count).padStart(3, '0');
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';

  const message = [
    '[Plant Care Feedback]',
    `Case: ${displayName}-#${caseNum}`,
    `Build: ${buildTime}`,
    '',
    'What happened:',
  ].join('\n');

  window.open(`https://wa.me/56994343285?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
}

// ============================================================
// DEV TOOLS — remove before public launch
// ============================================================

function attachDevToolsTrigger() {
  const el = document.getElementById('dev-build-ts');
  if (!el) return;
  let _lpTimer = null;
  el.addEventListener('pointerdown', () => {
    _lpTimer = setTimeout(() => openDevToolsPanel(), 500);
  });
  el.addEventListener('pointerup',   () => clearTimeout(_lpTimer));
  el.addEventListener('pointerleave', () => clearTimeout(_lpTimer));
}

function openDevToolsPanel() {
  openSheet(`
    <div style="width:36px;height:4px;background:#ddd;border-radius:2px;margin:0 auto 16px;"></div>
    <div style="font-size:13px;font-weight:500;color:#222;margin-bottom:4px;">Dev Tools</div>
    <div style="font-size:11px;color:#888;margin-bottom:16px;">Seed data scenarios — replaces all current household data</div>
    <div id="dev-tools-body">
      <button class="dev-tools-btn" data-action="dev-seed-empty">🌱 Empty state</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy-v3">🌳 Heavy v3</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy-v4">🌲 Heavy v4</button>
    </div>
    <button class="add-plant-back-link" data-action="close-sheet" style="margin-top:12px;">Cancel</button>
  `);
}

function showDevToolsConfirm(scenario, label) {
  document.getElementById('dev-tools-body').innerHTML = `
    <p style="font-size:13px;color:#333;margin-bottom:16px;">
      Replace all data with <strong>${escapeHtml(label)}</strong> state? This cannot be undone.
    </p>
    <div style="display:flex;gap:8px;">
      <button class="dev-tools-btn" style="flex:1;" data-action="dev-tools-cancel">Cancel</button>
      <button class="dev-tools-btn" style="flex:1;background:#c0392b;color:#fff;border-color:#c0392b;"
              data-action="dev-tools-confirm" data-scenario="${escapeHtml(scenario)}">Yes, replace data</button>
    </div>`;
}

async function runDevSeed(scenario) {
  const labels = {
    empty:      'Empty state',
    'heavy-v3': 'Heavy v3',
    'heavy-v4': 'Heavy v4',
  };
  try {
    if (scenario === 'empty')    await seedEmpty({ resetOnboarding: true });
    if (scenario === 'heavy-v3') await seedHeavyV3();
    if (scenario === 'heavy-v4') await seedHeavyV4();
    closeSheet();
    await loadFromSupabase();
    navigateTo('home');
    showToast(`✅ ${labels[scenario]} data loaded`);
    return true;
  } catch (err) {
    console.error('[DevTools] seed error:', err);
    showToast('❌ Seed failed — check console');
    return false;
  }
}

// Wipe all plants in household (tasks/care_log/notes are plant-scoped)
async function seedEmpty({ resetOnboarding = false } = {}) {
  const now = new Date().toISOString();
  const { data: rows } = await supabaseClient
    .from('plants').select('id').eq('household_id', householdId).is('deleted_at', null);
  if (rows?.length) {
    await supabaseClient.from('plants').update({ deleted_at: now })
      .in('id', rows.map(r => r.id));
  }
  if (resetOnboarding) {
    if (currentMemberId) {
      localStorage.removeItem(`onboarding_step_${currentMemberId}`);
      localStorage.removeItem(`onboarding_plant_id_${currentMemberId}`);
      localStorage.removeItem(`onboarding_task_id_${currentMemberId}`);
      localStorage.removeItem(`onboarding_show_coachmark_${currentMemberId}`);
      localStorage.removeItem(`onboarding_show_pushsheet_${currentMemberId}`);
    }
    localStorage.removeItem('onboarding_coordination_shown');
    if (activeUser) localStorage.removeItem(`push_accepted_${activeUser}`);
  }
}

async function seedHeavyV3() {
  // Teardown — same sequence as seedHeavyV2 (children before parent).
  if (householdId) {
    const { data: allPlants } = await supabaseClient
      .from('plants').select('id').eq('household_id', householdId);
    const plantIds = (allPlants ?? []).map(r => r.id);
    if (plantIds.length) {
      await supabaseClient.from('plant_photos').delete().in('plant_id', plantIds);
      await supabaseClient.from('care_log').delete().in('plant_id', plantIds);
      await supabaseClient.from('notes').delete().in('plant_id', plantIds);
      await supabaseClient.from('tasks').delete().in('plant_id', plantIds);
      await supabaseClient.from('plants').delete().in('id', plantIds);
    }
  }

  const today = todayStr();
  const memberA = membersCache[0]?.id ?? null;
  const memberB = (membersCache[1] ?? membersCache[0])?.id ?? null;

  const insertPlant = async (name, emoji, sortOrder, daysAgo) => {
    const { data } = await supabaseClient.from('plants').insert({
      household_id:  householdId,
      name,
      emoji,
      date_acquired: addDays(today, -daysAgo),
      sort_order:    sortOrder,
    }).select().single();
    return data;
  };

  const insertTask = async (plantId, idx, def) => {
    const { data } = await supabaseClient.from('tasks').insert({
      plant_id:          plantId,
      name:              def.name,
      icon:              def.icon,
      type:              def.type,
      recurrence:        def.rec,
      owner_id:          def.owner,
      paused:            def.paused ?? false,
      note:              '',
      sort_order:        idx + 1,
      last_done:         def.ld ?? null,
      next_due_override: def.ndo ?? null,
    }).select().single();
    return data;
  };

  // 1. Mandarin Tree — overdue watering (non-multiple displacement; prompt fires)
  const mandarin = await insertPlant('Mandarin Tree', '🍊', 1, 100);
  await insertTask(mandarin.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -10), ndo: null,
  });
  const mandarinFert = await insertTask(mandarin.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 5, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5), ndo: null,
  });
  const mandarinTs = new Date(); mandarinTs.setDate(mandarinTs.getDate() - 5); mandarinTs.setHours(10, 0, 0, 0);
  await supabaseClient.from('care_log').insert({
    plant_id:            mandarin.id,
    task_id:             mandarinFert.id,
    household_member_id: memberB,
    task_name:           'Fertilizing',
    task_type:           'fertilize',
    date:                addDays(today, -5),
    created_at:          mandarinTs.toISOString(),
  });

  // 2. Pothos — overdue watering with exact-multiple displacement (prompt suppressed);
  //    rotation done today (also produces a care_log entry below).
  const pothos = await insertPlant('Pothos', '🪴', 2, 60);
  await insertTask(pothos.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -14), ndo: null,
  });
  const pothosRotation = await insertTask(pothos.id, 1, {
    name: 'Rotation', icon: '🔄', type: 'rotate',
    rec: { type: 'interval', every: 3, unit: 'days', days: [] },
    owner: memberB, ld: today, ndo: null,
  });

  const rotTs = new Date(); rotTs.setHours(10, 0, 0, 0);
  await supabaseClient.from('care_log').insert({
    plant_id:            pothos.id,
    task_id:             pothosRotation.id,
    household_member_id: memberB,
    task_name:           'Rotation',
    task_type:           'rotate',
    date:                today,
    created_at:          rotTs.toISOString(),
  });

  // 3. Cactus — overdue weekdays-task (two weekdays excluding today and tomorrow,
  //    so the task reliably looks "overdue" instead of conveniently due today);
  //    paused fertilizing.
  const cactus = await insertPlant('Cactus', '🌵', 3, 80);
  const todayDow = new Date().getDay(); // 0=Sun … 6=Sat
  const candidateDays = [1, 2, 3, 4, 5]; // Mon–Fri only
  const safeDays = candidateDays.filter(
    d => d !== todayDow && d !== (todayDow === 5 ? 1 : todayDow + 1)
  );
  const cactusWeekdays = [safeDays[0], safeDays[1]];
  await insertTask(cactus.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'weekdays', days: cactusWeekdays },
    owner: memberA, ld: addDays(today, -12), ndo: null,
  });
  const cactusFert = await insertTask(cactus.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5), ndo: null, paused: true,
  });
  const cactusTs = new Date(); cactusTs.setDate(cactusTs.getDate() - 5); cactusTs.setHours(10, 0, 0, 0);
  await supabaseClient.from('care_log').insert({
    plant_id:            cactus.id,
    task_id:             cactusFert.id,
    household_member_id: memberB,
    task_name:           'Fertilizing',
    task_type:           'fertilize',
    date:                addDays(today, -5),
    created_at:          cactusTs.toISOString(),
  });

  // 4. Bougainvillea — upcoming watering (mark-done-early test); pending one-off repot.
  //    Photo set on the plant itself so it renders as the plant icon.
  const { data: bougainvillea } = await supabaseClient.from('plants').insert({
    household_id:  householdId,
    name:          'Bougainvillea',
    emoji:         '🌸',
    date_acquired: addDays(today, -90),
    sort_order:    4,
    photo_url:     'https://kmkfywdzoitgdtbttxaa.supabase.co/storage/v1/object/public/plant-photos/test-assets/bugam-photo.jpeg',
  }).select().single();
  const bougainWater = await insertTask(bougainvillea.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -3), ndo: null,
  });
  const bougainTs = new Date(); bougainTs.setDate(bougainTs.getDate() - 3); bougainTs.setHours(10, 0, 0, 0);
  await supabaseClient.from('care_log').insert({
    plant_id:            bougainvillea.id,
    task_id:             bougainWater.id,
    household_member_id: memberA,
    task_name:           'Watering',
    task_type:           'water',
    date:                addDays(today, -3),
    created_at:          bougainTs.toISOString(),
  });
  await insertTask(bougainvillea.id, 1, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberB, ld: null, ndo: addDays(today, 2),
  });

  // 5. Fern — due-today misting + 3 notes (last two with photos).
  const fern = await insertPlant('Fern', '🌿', 5, 40);
  const fernMisting = await insertTask(fern.id, 0, {
    name: 'Misting', icon: '💦', type: 'water',
    rec: { type: 'interval', every: 2, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -2), ndo: null,
  });
  const fernTs = new Date(); fernTs.setDate(fernTs.getDate() - 2); fernTs.setHours(10, 0, 0, 0);
  await supabaseClient.from('care_log').insert({
    plant_id:            fern.id,
    task_id:             fernMisting.id,
    household_member_id: memberA,
    task_name:           'Misting',
    task_type:           'water',
    date:                addDays(today, -2),
    created_at:          fernTs.toISOString(),
  });

  const FERN_PHOTO_BASE = 'https://kmkfywdzoitgdtbttxaa.supabase.co/storage/v1/object/public/plant-photos/test-assets';
  const note1Ts = new Date(); note1Ts.setDate(note1Ts.getDate() - 5);
  const note2Ts = new Date(); note2Ts.setDate(note2Ts.getDate() - 2);
  const note3Ts = new Date();

  await supabaseClient.from('notes').insert({
    plant_id:            fern.id,
    household_member_id: memberA,
    note:                'New leaves coming in on the left side 🌱',
    photo_url:           null,
    created_at:          note1Ts.toISOString(),
  });
  await supabaseClient.from('notes').insert({
    plant_id:            fern.id,
    household_member_id: memberB,
    note:                'Looking healthy after the last watering',
    photo_url:           `${FERN_PHOTO_BASE}/Fiddle01.jpeg`,
    created_at:          note2Ts.toISOString(),
  });
  await supabaseClient.from('notes').insert({
    plant_id:            fern.id,
    household_member_id: memberA,
    note:                "New growth on the right too — it's spreading",
    photo_url:           `${FERN_PHOTO_BASE}/Fiddle02.jpeg`,
    created_at:          note3Ts.toISOString(),
  });
}

async function seedHeavyV4() {

  // Teardown — same sequence as seedHeavyV3
  if (householdId) {
    const { data: allPlants } = await supabaseClient
      .from('plants').select('id').eq('household_id', householdId);
    const plantIds = (allPlants ?? []).map(r => r.id);
    if (plantIds.length) {
      await supabaseClient.from('plant_photos').delete().in('plant_id', plantIds);
      await supabaseClient.from('care_log').delete().in('plant_id', plantIds);
      await supabaseClient.from('notes').delete().in('plant_id', plantIds);
      await supabaseClient.from('tasks').delete().in('plant_id', plantIds);
      await supabaseClient.from('plants').delete().in('id', plantIds);
    }
  }

  const today = todayStr();
  const memberA = membersCache[0]?.id ?? null;
  const memberB = (membersCache[1] ?? membersCache[0])?.id ?? null;

  const PHOTO_BASE = 'https://kmkfywdzoitgdtbttxaa.supabase.co/storage/v1/object/public/plant-photos/test-assets';

  const insertPlant = async (name, emoji, sortOrder, daysAgo, photoUrl = null) => {
    const payload = {
      household_id:  householdId,
      name,
      emoji,
      date_acquired: addDays(today, -daysAgo),
      sort_order:    sortOrder,
    };
    if (photoUrl) payload.photo_url = photoUrl;
    const { data } = await supabaseClient.from('plants').insert(payload).select().single();
    return data;
  };

  const insertTask = async (plantId, idx, def) => {
    const { data } = await supabaseClient.from('tasks').insert({
      plant_id:          plantId,
      name:              def.name,
      icon:              def.icon,
      type:              def.type,
      recurrence:        def.rec,
      owner_id:          def.owner,
      paused:            def.paused ?? false,
      note:              '',
      sort_order:        idx + 1,
      last_done:         def.ld ?? null,
      next_due_override: def.ndo ?? null,
    }).select().single();
    return data;
  };

  const logCare = async (plantId, taskId, memberId, taskName, taskType, daysAgo, hourOfDay = 10) => {
    const ts = new Date();
    ts.setDate(ts.getDate() - daysAgo);
    ts.setHours(hourOfDay, 0, 0, 0);
    await supabaseClient.from('care_log').insert({
      plant_id:            plantId,
      task_id:             taskId,
      household_member_id: memberId,
      task_name:           taskName,
      task_type:           taskType,
      date:                addDays(today, -daysAgo),
      created_at:          ts.toISOString(),
    });
  };

  const insertNote = async (plantId, memberId, noteText, photoUrl, daysAgo, hourOfDay = 11) => {
    const ts = new Date();
    ts.setDate(ts.getDate() - daysAgo);
    ts.setHours(hourOfDay, 0, 0, 0);
    await supabaseClient.from('notes').insert({
      plant_id:            plantId,
      household_member_id: memberId,
      note:                noteText,
      photo_url:           photoUrl ?? null,
      created_at:          ts.toISOString(),
    });
  };

  const todayDow = new Date().getDay();
  const tomorrowDow = todayDow === 6 ? 1 : todayDow + 1;
  const safeDays = [1, 2, 3, 4, 5].filter(d => d !== todayDow && d !== tomorrowDow);

  // 1. MANDARIN TREE — attention plant
  const mandarin = await insertPlant('Mandarin Tree', '🍊', 1, 180);
  // 5 overdue
  const manWater = await insertTask(mandarin.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -10),
  });
  const manFert = await insertTask(mandarin.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 14, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -16),
  });
  const manPruning = await insertTask(mandarin.id, 2, {
    name: 'Pruning', icon: '✂️', type: 'prune',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -32),
  });
  const manCheck = await insertTask(mandarin.id, 3, {
    name: 'Check leaves', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: safeDays },
    owner: memberB, ld: addDays(today, -8),
  });
  const manMisting = await insertTask(mandarin.id, 4, {
    name: 'Misting', icon: '💦', type: 'water',
    rec: { type: 'interval', every: 3, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -5),
  });

  // 5 due today
  const manRotation = await insertTask(mandarin.id, 5, {
    name: 'Rotation', icon: '🔄', type: 'rotate',
    rec: { type: 'interval', every: 5, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5),
  });
  const manRepot = await insertTask(mandarin.id, 6, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberA, ld: null, ndo: today,
  });
  const manSoilCheck = await insertTask(mandarin.id, 7, {
    name: 'Soil check', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: safeDays },
    owner: memberB, ld: addDays(today, -7),
  });
  const manDeepWater = await insertTask(mandarin.id, 8, {
    name: 'Deep watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 10, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -10),
  });
  const manHumidity = await insertTask(mandarin.id, 9, {
    name: 'Humidity check', icon: '🌡️', type: 'check',
    rec: { type: 'interval', every: 2, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -2),
  });

  await logCare(mandarin.id, manWater.id,     memberA, 'Watering',       'water',     10);
  await logCare(mandarin.id, manFert.id,      memberB, 'Fertilizing',    'fertilize', 16);
  await logCare(mandarin.id, manPruning.id,   memberA, 'Pruning',        'prune',     32);
  await logCare(mandarin.id, manCheck.id,     memberB, 'Check leaves',   'check',      8);
  await logCare(mandarin.id, manMisting.id,   memberA, 'Misting',        'water',      5);
  await logCare(mandarin.id, manRotation.id,  memberB, 'Rotation',       'rotate',     5);
  await logCare(mandarin.id, manSoilCheck.id, memberB, 'Soil check',     'check',      7);
  await logCare(mandarin.id, manDeepWater.id, memberA, 'Deep watering',  'water',     10);
  await logCare(mandarin.id, manHumidity.id,  memberB, 'Humidity check', 'check',      2);
  await insertNote(mandarin.id, memberA, 'First fruits forming on the lower branches 🍊', `${PHOTO_BASE}/bugam-photo.jpeg`, 78);
  await insertNote(mandarin.id, memberB, 'Some yellowing on older leaves — might be overwatering', null, 65);
  await insertNote(mandarin.id, memberA, 'Yellowing resolved, new growth looking healthy', `${PHOTO_BASE}/Fiddle01.jpeg`, 52);
  await insertNote(mandarin.id, memberB, 'Moved closer to the window for more light', null, 38);
  await insertNote(mandarin.id, memberA, 'Tiny new fruits visible on two branches!', `${PHOTO_BASE}/Fiddle02.jpeg`, 24);
  await insertNote(mandarin.id, memberB, 'Noticed some scale insects on the stem — treated with neem oil', null, 12);
  await insertNote(mandarin.id, memberA, 'Recovery looking good after neem treatment', `${PHOTO_BASE}/bugam-photo.jpeg`, 3);

  // 2. POTHOS — attention plant
  const pothos = await insertPlant('Pothos', '🪴', 2, 150);
  const potWater = await insertTask(pothos.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -14),
  });
  const potRotation = await insertTask(pothos.id, 1, {
    name: 'Rotation', icon: '🔄', type: 'rotate',
    rec: { type: 'interval', every: 3, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -3),
  });
  const potCheck = await insertTask(pothos.id, 2, {
    name: 'Check soil', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: [safeDays[1], safeDays[3]] },
    owner: memberA, ld: addDays(today, -4),
  });
  await insertTask(pothos.id, 3, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 21, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -10), paused: true,
  });
  const potRepot = await insertTask(pothos.id, 4, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberA, ld: addDays(today, -60),
  });
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 0, 10);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 14);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 21);
  await logCare(pothos.id, potWater.id,    memberB, 'Watering', 'water', 28);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 35);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 42);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 49);
  await logCare(pothos.id, potWater.id,    memberB, 'Watering', 'water', 56);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 63);
  await logCare(pothos.id, potWater.id,    memberA, 'Watering', 'water', 70);
  await logCare(pothos.id, potWater.id,    memberB, 'Watering', 'water', 77);
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 3);
  await logCare(pothos.id, potRotation.id, memberA, 'Rotation', 'rotate', 6);
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 9);
  await logCare(pothos.id, potRotation.id, memberB, 'Rotation', 'rotate', 12);
  await logCare(pothos.id, potCheck.id,    memberA, 'Check soil', 'check', 4);
  await logCare(pothos.id, potCheck.id,    memberA, 'Check soil', 'check', 11);
  await logCare(pothos.id, potCheck.id,    memberB, 'Check soil', 'check', 18);
  await logCare(pothos.id, potRepot.id,    memberA, 'Repot', 'repot', 60);
  await insertNote(pothos.id, memberB, 'Repotted into a bigger pot — roots were totally bound 🪴', `${PHOTO_BASE}/bugam-photo.jpeg`, 60);
  await insertNote(pothos.id, memberA, 'New growth after repot, three new leaves in a week', null, 50);
  await insertNote(pothos.id, memberB, 'Trailing vines getting long — might need a trim soon', `${PHOTO_BASE}/Fiddle01.jpeg`, 35);
  await insertNote(pothos.id, memberA, 'Soil still moist, skipping watering today', null, 20);
  await insertNote(pothos.id, memberB, 'Two leaves yellowing at the base — normal aging', null, 8);
  await insertNote(pothos.id, memberA, 'Looking lush after move to brighter spot', `${PHOTO_BASE}/Fiddle02.jpeg`, 2);

  // 3. FERN — attention plant
  const fern = await insertPlant('Fern', '🌿', 3, 120);
  const fernMisting = await insertTask(fern.id, 0, {
    name: 'Misting', icon: '💦', type: 'water',
    rec: { type: 'interval', every: 2, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -5),
  });
  const fernWater = await insertTask(fern.id, 1, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -7),
  });
  const fernCheck = await insertTask(fern.id, 2, {
    name: 'Check humidity', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: [safeDays[0], safeDays[2], safeDays[4]] },
    owner: memberA, ld: addDays(today, -3),
  });
  await insertTask(fern.id, 3, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -15), paused: true,
  });
  const fernHumidity = await insertTask(fern.id, 4, {
    name: 'Humidity check', icon: '🌡️', type: 'check',
    rec: { type: 'one-off' },
    owner: memberA, ld: addDays(today, -30),
  });
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 5);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 7);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 9);
  await logCare(fern.id, fernMisting.id,  memberB, 'Misting', 'water', 11);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 15);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 20);
  await logCare(fern.id, fernMisting.id,  memberB, 'Misting', 'water', 25);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 30);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 40);
  await logCare(fern.id, fernMisting.id,  memberB, 'Misting', 'water', 50);
  await logCare(fern.id, fernMisting.id,  memberA, 'Misting', 'water', 60);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 7);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 14);
  await logCare(fern.id, fernWater.id,    memberA, 'Watering', 'water', 21);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 28);
  await logCare(fern.id, fernWater.id,    memberA, 'Watering', 'water', 42);
  await logCare(fern.id, fernWater.id,    memberB, 'Watering', 'water', 56);
  await logCare(fern.id, fernCheck.id,    memberA, 'Check humidity', 'check', 3);
  await logCare(fern.id, fernCheck.id,    memberA, 'Check humidity', 'check', 10);
  await logCare(fern.id, fernCheck.id,    memberB, 'Check humidity', 'check', 17);
  await logCare(fern.id, fernHumidity.id, memberA, 'Humidity check', 'check', 30);
  await insertNote(fern.id, memberA, 'Moved to the bathroom — humidity is perfect in there', `${PHOTO_BASE}/bugam-photo.jpeg`, 85);
  await insertNote(fern.id, memberB, 'Tips going brown — air is too dry. Moving it back', null, 70);
  await insertNote(fern.id, memberA, 'Misting daily for a week seems to have helped a lot', null, 55);
  await insertNote(fern.id, memberB, 'New leaves uncurling beautifully 🌿', `${PHOTO_BASE}/Fiddle01.jpeg`, 40);
  await insertNote(fern.id, memberA, 'Still growing steadily — one new frond this week', null, 25);
  await insertNote(fern.id, memberB, 'Looking really full now compared to when we got it', `${PHOTO_BASE}/Fiddle02.jpeg`, 10);
  await insertNote(fern.id, memberA, 'Brown tips back — might need to increase misting again', null, 2);

  // 4. BOUGAINVILLEA — healthy plant
  const { data: bougainvillea } = await supabaseClient.from('plants').insert({
    household_id:  householdId,
    name:          'Bougainvillea',
    emoji:         '🌸',
    date_acquired: addDays(today, -200),
    sort_order:    4,
    photo_url:     `${PHOTO_BASE}/bugam-photo.jpeg`,
  }).select().single();
  const bouWater = await insertTask(bougainvillea.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'interval', every: 7, unit: 'days', days: [] },
    owner: memberA, ld: addDays(today, -3),
  });
  const bouFert = await insertTask(bougainvillea.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 21, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5),
  });
  const bouCheck = await insertTask(bougainvillea.id, 2, {
    name: 'Check flowers', icon: '🔍', type: 'check',
    rec: { type: 'weekdays', days: [safeDays[1], safeDays[3]] },
    owner: memberA, ld: addDays(today, -2),
  });
  await insertTask(bougainvillea.id, 3, {
    name: 'Repot', icon: '🪴', type: 'repot',
    rec: { type: 'one-off' },
    owner: memberB, ld: null, ndo: addDays(today, 5),
  });
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 3);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 10);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 17);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 24);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 31);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 38);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 45);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 52);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 59);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 66);
  await logCare(bougainvillea.id, bouWater.id,  memberA, 'Watering', 'water', 73);
  await logCare(bougainvillea.id, bouWater.id,  memberB, 'Watering', 'water', 80);
  await logCare(bougainvillea.id, bouFert.id,   memberB, 'Fertilizing', 'fertilize', 5);
  await logCare(bougainvillea.id, bouFert.id,   memberB, 'Fertilizing', 'fertilize', 26);
  await logCare(bougainvillea.id, bouFert.id,   memberA, 'Fertilizing', 'fertilize', 47);
  await logCare(bougainvillea.id, bouFert.id,   memberB, 'Fertilizing', 'fertilize', 68);
  await logCare(bougainvillea.id, bouCheck.id,  memberA, 'Check flowers', 'check', 2);
  await logCare(bougainvillea.id, bouCheck.id,  memberB, 'Check flowers', 'check', 9);
  await logCare(bougainvillea.id, bouCheck.id,  memberA, 'Check flowers', 'check', 16);
  await logCare(bougainvillea.id, bouCheck.id,  memberB, 'Check flowers', 'check', 30);
  await insertNote(bougainvillea.id, memberA, 'Blooming heavily this season — absolutely stunning 🌸', `${PHOTO_BASE}/bugam-photo.jpeg`, 75);
  await insertNote(bougainvillea.id, memberB, 'Pruned back the longest stems after flowering', null, 60);
  await insertNote(bougainvillea.id, memberA, 'New pink bracts forming on all the pruned stems', `${PHOTO_BASE}/Fiddle01.jpeg`, 45);
  await insertNote(bougainvillea.id, memberB, 'Moving to a sunnier spot for the summer', null, 28);
  await insertNote(bougainvillea.id, memberA, 'Second bloom cycle starting — three new clusters', `${PHOTO_BASE}/Fiddle02.jpeg`, 12);
  await insertNote(bougainvillea.id, memberB, 'Root-bound in current pot — scheduled repot for next week', null, 3);

  // 5. CACTUS — healthy plant
  const cactus = await insertPlant('Cactus', '🌵', 5, 240);
  const cactusWeekdays = [safeDays[0], safeDays[1]];
  const cacWater = await insertTask(cactus.id, 0, {
    name: 'Watering', icon: '💧', type: 'water',
    rec: { type: 'weekdays', days: cactusWeekdays },
    owner: memberA, ld: addDays(today, -2),
  });
  const cacFert = await insertTask(cactus.id, 1, {
    name: 'Fertilizing', icon: '🌿', type: 'fertilize',
    rec: { type: 'interval', every: 30, unit: 'days', days: [] },
    owner: memberB, ld: addDays(today, -5),
  });
  const cacHealth = await insertTask(cactus.id, 2, {
    name: 'Health check', icon: '🔍', type: 'check',
    rec: { type: 'one-off' },
    owner: memberA, ld: addDays(today, -30),
  });
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 2);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 9);
  await logCare(cactus.id, cacWater.id,  memberB, 'Watering', 'water', 16);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 23);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 30);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 44);
  await logCare(cactus.id, cacWater.id,  memberB, 'Watering', 'water', 58);
  await logCare(cactus.id, cacWater.id,  memberA, 'Watering', 'water', 72);
  await logCare(cactus.id, cacFert.id,   memberB, 'Fertilizing', 'fertilize', 5);
  await logCare(cactus.id, cacFert.id,   memberB, 'Fertilizing', 'fertilize', 35);
  await logCare(cactus.id, cacFert.id,   memberA, 'Fertilizing', 'fertilize', 65);
  await logCare(cactus.id, cacHealth.id, memberA, 'Health check', 'check', 30);
  await insertNote(cactus.id, memberA, 'Tiny new growth on the top — first sign of life in months 🌵', null, 80);
  await insertNote(cactus.id, memberB, 'Spine color looks slightly off — keeping an eye on it', null, 65);
  await insertNote(cactus.id, memberA, 'All good — spine color normal, just a lighting issue', `${PHOTO_BASE}/bugam-photo.jpeg`, 50);
  await insertNote(cactus.id, memberB, 'Growing visibly taller, maybe 2cm since we got it', null, 30);
  await insertNote(cactus.id, memberA, 'Still going strong with minimal care 💪', `${PHOTO_BASE}/Fiddle01.jpeg`, 15);
  await insertNote(cactus.id, memberB, 'Considering moving it to the windowsill for more sun', null, 4);

} // end seedHeavyV4

// DEV TOOLS — handleEvent cases added inline in the switch statement

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await registerServiceWorker();
  } catch (e) {
    console.warn('Service worker registration failed:', e);
  }

  document.getElementById('app').addEventListener('click', handleEvent);
  document.getElementById('sheet').addEventListener('click', handleEvent);
  document.getElementById('menu-panel').addEventListener('click', handleEvent);
  document.getElementById('toast').addEventListener('click', handleEvent);

  document.getElementById('sheet').addEventListener('change', (ev) => {
    console.log('[sheet change]', { targetId: ev.target?.id, filesCount: ev.target?.files?.length });
    if (ev.target?.id === 'add-note-file-input') {
      const file = ev.target.files?.[0];
      if (file) handleAddNoteFileSelected(file);
    } else if (ev.target?.id === 'edit-note-file-input') {
      const file = ev.target.files?.[0];
      if (file) handleEditNotePhotoFileSelected(file);
    } else if (ev.target?.id === 'add-plant-file-input') {
      const file = ev.target.files?.[0];
      if (file) handleAddPlantFileSelected(file);
    }
  });
  document.getElementById('overlay').addEventListener('click', closeSheet);
  document.getElementById('menu-overlay').addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => {
    const sheetActive = document.getElementById('sheet')?.classList.contains('active');
    if (!sheetActive) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      const cancelBtn = document.querySelector('#sheet [data-action="sheet-cancel"]');
      if (cancelBtn) cancelBtn.click();
      else closeSheet();
      return;
    }

    if (e.key === 'Enter' && !e.isComposing) {
      const el = document.activeElement;
      if (el?.tagName === 'TEXTAREA' || el?.isContentEditable) return;
      const primary = document.querySelector('#sheet .btn-primary:not([disabled])');
      if (primary) {
        e.preventDefault();
        primary.click();
      }
    }
  });

  document.addEventListener('click', (ev) => {
    const switcher = document.getElementById('household-switcher');
    if (!switcher || !switcher.classList.contains('open')) return;
    if (switcher.contains(ev.target)) return;
    if (ev.target.closest?.('.household-pill')) return;
    switcher.classList.remove('open');
    const pill = document.querySelector('.household-pill');
    pill?.classList.remove('open');
    pill?.setAttribute('aria-expanded', 'false');
  });

  localStorage.removeItem('active-user');

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      inRecovery = true;
      renderPasswordResetScreen();
      return;
    }

    if (event !== 'INITIAL_SESSION') return;

    // If the URL carried a recovery token, let the PASSWORD_RECOVERY event handle it.
    // Use initialHash (captured before createClient clears window.location.hash).
    if (initialHash.includes('type=recovery')) return;

    if (!session) {
      renderLoginScreen();
      return;
    }

    await routeAfterAuth();
  });
});
