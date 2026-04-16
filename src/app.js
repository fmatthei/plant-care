'use strict';

// ============================================================
// CONSTANTS
// ============================================================

const TASK_CONFIG = {
  'normal-water': { name: 'Normal Watering',           icon: '💧', type: 'water' },
  'refill-pot':   { name: 'Refill Self-Watering Pot',  icon: '🪣', type: 'refill' },
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
let scheduleFilter = null; // null = uninitialized; array of display_names to show
let tasksFilter = null;    // null = uninitialized
let careLogFilter = []; // [] = all users (no individual selection)
let careLogFiltersOpen = false;
let careLogMode = 'tasks'; // 'tasks' | 'all'
let plantDetailTab = 'summary';
let careLogSegment = 'full';
let membersCache = []; // household_members rows: { id, display_name }
let currentMemberId = null;
let householdId = null;
let activityFeed = []; // merged care_log + notes, top 5 across all plants
let currentUserId = null;
let swRegistration = null;

// ============================================================
// ACTIVE USER
// ============================================================

function getActiveUser() {
  return localStorage.getItem('active-user');
}

function setActiveUser(name) {
  activeUser = name;
  localStorage.setItem('active-user', name);
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
  } else {
    const saved = getActiveUser();
    if (saved) {
      activeUser = saved;
      navigateTo('home');
    } else {
      renderUserSelect();
    }
  }
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
  setTimeout(renderLoginScreen, 2000);
}

function renderUserSelect() {
  document.getElementById('app').innerHTML = `
    <div class="user-select-screen">
      <h2>Who are you?</h2>
      <div class="user-select-buttons">
        <button class="user-select-btn" data-action="select-user" data-user="Matu">Matu</button>
        <button class="user-select-btn" data-action="select-user" data-user="Vale">Vale</button>
      </div>
    </div>`;
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

  // Update the cache immediately so the rest of the app sees the new name
  const m = membersCache.find(m => m.id === currentMemberId);
  if (m) m.display_name = name;

  const saved = getActiveUser();
  if (saved) {
    activeUser = saved;
    navigateTo('home');
  } else {
    renderUserSelect();
  }
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

  // 2. Look up household_id from household_members
  const { data: member } = await supabaseClient
    .from('household_members')
    .select('household_id, id')
    .eq('user_id', user.id)
    .single();
  if (!member) return;

  householdId = member.household_id;
  currentMemberId = member.id;

  // 3. Fetch all non-deleted plants and all household_members in parallel
  const [{ data: plantRows }, { data: memberRows }] = await Promise.all([
    supabaseClient
      .from('plants')
      .select('*')
      .eq('household_id', householdId)
      .is('deleted_at', null),
    supabaseClient
      .from('household_members')
      .select('id, display_name, color')
      .eq('household_id', householdId),
  ]);
  if (!plantRows) return;

  // Cache members for write operations — must be set before any early return
  // so handleSaveNewPlant() always has a valid membersCache even with no plants.
  membersCache = memberRows ?? [];
  if (activeUser && scheduleFilter === null) scheduleFilter = [activeUser];
  if (activeUser && tasksFilter === null) tasksFilter = [activeUser];

  if (plantRows.length === 0) {
    plants = [];
    notes  = [];
    activityFeed = [];
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
      id:       r.id,
      date:     r.date,
      author:   ownerMap[r.household_member_id] ?? 'Unknown',
      taskId:   r.task_id,
      taskName: r.task_name,
      taskType: r.task_type,
    }));

    return {
      id:               plantRow.id,
      name:             plantRow.name,
      emoji:            plantRow.emoji            ?? '🪴',
      dateAcquired: plantRow.date_acquired ?? '',
      tasks,
      careLog,
    };
  });

  await loadActivityFeed();
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
      .limit(10),
    supabaseClient
      .from('notes')
      .select('plant_id, note, household_member_id, created_at')
      .in('plant_id', plantIds)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const careItems = (careRows ?? []).map(r => ({
    type:      'care',
    sortKey:   r.created_at,
    plantName: plantMap[r.plant_id]?.name ?? '',
    taskName:  r.task_name,
    taskType:  r.task_type,
    member:    ownerMap[r.household_member_id] ?? '',
  }));

  const noteItems = (noteRows ?? []).map(r => ({
    type:      'note',
    sortKey:   r.created_at,
    plantName: plantMap[r.plant_id]?.name ?? '',
    note:      r.note,
    member:    ownerMap[r.household_member_id] ?? '',
  }));

  activityFeed = [...careItems, ...noteItems]
    .sort((a, b) => (b.sortKey ?? '').localeCompare(a.sortKey ?? ''))
    .slice(0, 5);
}

// ============================================================
// DATE UTILITIES
// ============================================================

function lastCareLabel(plant) {
  const entry = plant.careLog?.[0];
  if (!entry) return '';
  const diff = daysBetween(entry.date, todayStr());
  const when = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
  return `<div class="last-care-line">Last care: ${escapeHtml(entry.taskName)} · ${when}</div>`;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Returns b - a in whole days
function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / msPerDay);
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
  const d = new Date(dateStr);
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

// Positive = days remaining, 0 = due today, negative = overdue, Infinity = complete (one-off done)
function daysUntilDue(task) {
  const next = computeNextDue(task);
  if (next === null) return Infinity;
  return daysBetween(todayStr(), next);
}

function isDue(task) {
  if (task.paused) return false;
  if ((task.recurrenceType ?? 'interval') === 'weekdays' && task.lastDone === todayStr()) return false;
  return daysUntilDue(task) <= 0;
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

function todayFormatted() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
  const plant = getPlant(plantId);
  const task = plant?.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.lastDone = todayStr();
  task.nextDueOverride = null; // clear any manual override when marking done

  const taskCfg = getTaskConfig(task);
  plant.careLog.unshift({
    id: uid(),
    date: todayStr(),
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
    .then(({ error }) => { if (error) console.error('markTaskDone care_log insert error:', error); });

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
  const plant = getPlant(plantId);
  if (!plant) return;
  plant.tasks = plant.tasks.filter(t => t.id !== taskId);

  await supabaseClient
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('deleteTask error:', error); });
}

async function deletePlant(plantId) {
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
}

async function addNote(plantId, noteText, taskId) {
  const member = membersCache.find(m => m.display_name === activeUser);
  const { data: inserted, error } = await supabaseClient
    .from('notes')
    .insert({ plant_id: plantId, household_member_id: member?.id ?? null, note: noteText, task_id: taskId ?? null })
    .select()
    .single();
  if (error) { console.error('addNote error:', error); return; }
  notes.unshift({
    id:        inserted.id,
    plantId:   inserted.plant_id,
    memberId:  inserted.household_member_id,
    author:    activeUser,
    note:      inserted.note,
    createdAt: inserted.created_at,
    taskId:    inserted.task_id ?? null,
  });
  await loadActivityFeed();
}

async function deleteNote(noteId) {
  const { error } = await supabaseClient
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId);
  if (error) { console.error('deleteNote error:', error); return; }
  notes = notes.filter(n => n.id !== noteId);
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
// ADD PLANT — TWO-STEP FLOW
// ============================================================

function renderAddPlantEmojiItems(emojis, selectedEmoji) {
  return emojis.map(e => {
    const sel = e === selectedEmoji ? ' selected' : '';
    return `<div class="emoji-option${sel}" data-action="pick-plant-emoji" data-emoji="${e}">${e}</div>`;
  }).join('');
}

function renderAddPlantStep1Html(activeTab, selectedEmoji) {
  const emojis = activeTab === 'all' ? PLANT_EMOJIS : (EMOJI_CATEGORIES[activeTab] ?? PLANT_EMOJIS);
  return `
    <div class="sheet-title">Add a plant</div>
    <div class="add-plant-subtitle">Pick an icon that looks like yours</div>
    <div class="emoji-cat-tabs">
      <button class="emoji-cat-tab${activeTab === 'all' ? ' active' : ''}" data-action="add-plant-tab" data-tab="all">All (35)</button>
      <button class="emoji-cat-tab${activeTab === 'foliage' ? ' active' : ''}" data-action="add-plant-tab" data-tab="foliage">🌿 Foliage</button>
      <button class="emoji-cat-tab${activeTab === 'flowers' ? ' active' : ''}" data-action="add-plant-tab" data-tab="flowers">🌸 Flowers</button>
      <button class="emoji-cat-tab${activeTab === 'edibles' ? ' active' : ''}" data-action="add-plant-tab" data-tab="edibles">🍋 Edibles</button>
    </div>
    <div class="add-plant-emoji-grid" id="add-plant-emoji-grid">
      ${renderAddPlantEmojiItems(emojis, selectedEmoji)}
    </div>
    <div class="emoji-custom-divider"></div>
    <div class="emoji-custom-row-split">
      <span class="emoji-custom-label">Can't find yours? Paste any emoji</span>
      <button class="emoji-paste-btn" data-action="add-plant-custom-emoji-trigger">📋 Paste emoji</button>
    </div>
    <input type="text" id="sheet-plant-custom-emoji" class="emoji-custom-input form-input" placeholder="Paste emoji here" autocomplete="off">
    <div class="sheet-actions" style="margin-top:16px;">
      <button class="btn btn-primary" data-action="add-plant-next" style="flex:1;">Next →</button>
    </div>`;
}

function renderAddPlantStep2Html(selectedEmoji) {
  return `
    <button class="add-plant-emoji-confirm" data-action="add-plant-change-emoji">
      <span class="add-plant-confirm-emoji">${escapeHtml(selectedEmoji)}</span>
      <div class="add-plant-confirm-info">
        <span class="add-plant-confirm-label">Your icon</span>
        <span class="add-plant-confirm-change">Tap to change</span>
      </div>
    </button>
    <div class="form-group" style="margin-top:16px;">
      <label class="form-label">What do you call it?</label>
      <input type="text" class="form-input" id="sheet-plant-name" placeholder="e.g. Monstera" autocomplete="off">
    </div>
    <div class="name-hint">e.g. Monstera, My green one, The big one, Bathroom plant</div>
    <div id="add-plant-duplicate-nudge" class="duplicate-nudge" style="display:none;margin-bottom:12px;"></div>
    <div class="arrival-date-card">
      <div class="arrival-date-top-row">
        <span class="arrival-date-icon">📅</span>
        <span class="arrival-date-title">When did it arrive home?</span>
      </div>
      <div class="arrival-date-sub">We'll show you how long you've cared for it. (Optional)</div>
      <button class="arrival-date-btn" type="button">
        <span id="arrival-date-display">Set arrival date</span>
        <input type="date" id="sheet-acquired-date" style="position:absolute;top:0;left:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:2;max-width:100%;" max="">
      </button>
    </div>
    <div class="sheet-actions" style="margin-top:16px;">
      <button class="btn btn-primary" data-action="sheet-save-new-plant" style="flex:1;">Add your plant</button>
    </div>
    <button class="add-plant-back-link" data-action="add-plant-back">← Back</button>`;
}

function attachAddPlantNameListener() {
  const nameInput = document.getElementById('sheet-plant-name');
  if (!nameInput) return;
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

// ============================================================
// RENDER: HOME
// ============================================================

function renderHeaderRight() {
  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();
  return `
    <div class="header-right">
      <span class="date-label">${todayFormatted()}</span>
      <button class="header-feedback-btn" data-action="feedback">💬</button>
      <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
    </div>`;
}

function renderHomeActivityFeed() {
  if (activityFeed.length === 0) return '';

  let html = `
  <div class="home-section-label">Recent activity</div>
  <div class="home-activity-feed"><div class="activity-list">`;

  for (const item of activityFeed) {
    const time = formatActivityTime(item.sortKey);
    if (item.type === 'care') {
      const verb = CARE_VERB[item.taskType];
      const icon = CARE_ICON[item.taskType] ?? '🌿';
      const text = verb
        ? `${escapeHtml(item.member)} ${escapeHtml(verb)} ${escapeHtml(item.plantName)}`
        : `${escapeHtml(item.member)} · ${escapeHtml(item.taskName)} — ${escapeHtml(item.plantName)}`;
      html += `
      <div class="activity-row">
        <span class="activity-icon">${icon}</span>
        <span class="activity-text">${text}</span>
        <span class="activity-time">${time}</span>
      </div>`;
    } else {
      html += `
      <div class="activity-row">
        <span class="activity-icon">📝</span>
        <span class="activity-text">${escapeHtml(item.member)} · <span class="activity-note-preview">${escapeHtml(item.note)}</span> — ${escapeHtml(item.plantName)}</span>
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
    <div class="app-header">
      <h1>Plant Care</h1>
      ${renderHeaderRight()}
    </div>
    <div class="tab-bar">
      <button class="tab-btn${activeTab === 'plants' ? ' active' : ''}" data-action="switch-tab" data-tab="plants">&#127807; My Plants</button>
      <button class="tab-btn${activeTab === 'schedule' ? ' active' : ''}" data-action="switch-tab" data-tab="schedule">&#128197; Schedule</button>
    </div>`;

  if (activeTab === 'plants') {
    if (shouldShowOnboardingBanner()) html += renderOnboardingBanner();

    // isDue() already returns false for paused tasks, so the count is correct
    const totalDue = plants.reduce((sum, p) => sum + p.tasks.filter(isDue).length, 0);

    if (totalDue > 0 && getOnboardingStep() !== 3) {
      html += `
    <div class="due-banner">
      &#9888;&#65039; ${totalDue} task${totalDue !== 1 ? 's' : ''} due today
    </div>`;
    }

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
      <h2>Welcome to Plant Care</h2>
      <p>Add your first plant to get started</p>
      <button class="btn-add-task-detail" data-action="add-plant">Add my first plant 🌱</button>
    </div>`;
    }

    html += '<div class="plants-list">';

    for (const plant of plants) {
      const dueTasks = plant.tasks.filter(isDue);

      const suppressOnboarding = getOnboardingStep() === 3 && plant.id === getOnboardingPlantId();

      let dueBadgeHtml = '';
      if (suppressOnboarding) {
        dueBadgeHtml = '';
      } else if (plant.tasks.length === 0) {
        dueBadgeHtml = '';
      } else if (dueTasks.length > 0) {
        dueBadgeHtml = `<span class="due-count-badge">${dueTasks.length} due</span>`;
      } else {
        dueBadgeHtml = `<span class="all-good-badge">&#10003; All good</span>`;
      }

      let taskPillsHtml = '';
      for (const task of dueTasks) {
        const cfg = getTaskConfig(task);
        taskPillsHtml += `<span class="task-due-badge ${cfg.type}">${cfg.icon} ${cfg.name}</span>`;
      }

      const suppressPills = suppressOnboarding;
      html += `
    <div class="plant-card" data-action="open-plant" data-plant="${plant.id}">
      <div class="plant-card-row">
        <span class="plant-card-emoji">${plant.emoji}</span>
        <div class="plant-card-meta">
          <div class="plant-card-name">${escapeHtml(plant.name)}</div>
          ${lastCareLabel(plant)}
        </div>
        <div class="plant-card-right">
          ${dueBadgeHtml}
          <span class="plant-card-arrow">&#8250;</span>
        </div>
      </div>
      ${!suppressPills && dueTasks.length > 0 ? `<div class="due-tasks-row">${taskPillsHtml}</div>` : ''}
    </div>`;
    }

    html += '</div>';

    if (plants.length > 0) {
      html += `<button class="fab-add-plant" data-action="add-plant">&#43; Add Plant</button>`;
    }

    html += `<div id="dev-build-ts" style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:4px;opacity:0.6;">Built: ${typeof __BUILD_TIME__ !== 'undefined' ? new Date(__BUILD_TIME__).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : 'dev'}</div>`;
  } else {
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
          <div style="width:32px;height:32px;background:#3a6b3a;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🌿</div>
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
    showNotifStep();
  });
}

// ============================================================
// RENDER: SCHEDULE
// ============================================================

function renderSchedule() {
  const today = todayStr();
  const thisMonday = getMondayOfWeek(today);
  const nextMonday = addDays(thisMonday, 7);

  const activeFilter = scheduleFilter ?? [activeUser];

  // Collect relevant (non-paused) task items
  const items = [];
  for (const plant of plants) {
    for (const task of plant.tasks) {
      if (task.paused) continue;
      if (activeFilter.length > 0 && !activeFilter.includes(task.owner)) continue;
      items.push({ plant, task });
    }
  }

  // Overdue: nextDue strictly before today
  const overdueItems = items.filter(({ task }) => computeNextDue(task) < today);

  const thisWeekDays = Array.from({ length: 7 }, (_, i) => addDays(thisMonday, i));
  const nextWeekDays = Array.from({ length: 7 }, (_, i) => addDays(nextMonday, i));

  function itemsForDay(dateStr) {
    return items.filter(({ task }) => computeNextDue(task) === dateStr);
  }

  function renderTaskRow(plant, task, extraClass) {
    const cfg = getTaskConfig(task);
    const showOwner = activeFilter.length !== 1;
    const ownerTag = showOwner
      ? ` <span class="sched-owner-tag" style="color:${USERS[task.owner]?.color ?? 'inherit'};background:${(USERS[task.owner]?.color ?? '#666666')}26">👤 ${escapeHtml(task.owner)}</span>`
      : '';
    const doneToday = task.lastDone === today;
    const doneBtn = doneToday
      ? `<button class="sched-done-btn" data-action="schedule-undo-mark-done" data-plant="${plant.id}" data-task="${task.id}" title="Undo">↩️</button>`
      : `<span class="sched-done-btns">
           <button class="sched-done-btn" data-action="schedule-mark-done" data-plant="${plant.id}" data-task="${task.id}" title="Mark done">✅</button>
           <button class="sched-done-btn" data-action="schedule-mark-done-with-note" data-plant="${plant.id}" data-task="${task.id}" title="Mark done + add note">📝</button>
         </span>`;
    return `<div class="sched-task${extraClass ? ' ' + extraClass : ''}">
        <span class="sched-task-label">${cfg.icon} <strong>${escapeHtml(cfg.name)}</strong> · ${escapeHtml(plant.name)}${ownerTag}</span>
        ${doneBtn}
      </div>`;
  }

  function renderDay(dateStr) {
    const label = new Date(dateStr + 'T12:00:00')
      .toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const isToday = dateStr === today;
    const isPast  = dateStr < today;
    const dayClass = isToday ? ' sched-day-today' : isPast ? ' sched-day-past' : '';
    const dayItems = itemsForDay(dateStr);
    let h = `<div class="sched-day${dayClass}">`;
    h += `<div class="sched-day-header">${label}</div>`;
    if (dayItems.length === 0) {
      h += `<div class="sched-empty">🌞 All clear!</div>`;
    } else {
      for (const { plant, task } of dayItems) {
        h += renderTaskRow(plant, task, null);
      }
    }
    h += `</div>`;
    return h;
  }

  let html = renderUserFilterPills('schedule', activeFilter);

  if (overdueItems.length > 0) {
    html += `<div class="sched-section sched-section-overdue">`;
    html += sectionHeader('⚠️ Overdue', '#BA7517', overdueItems.length);
    for (const { plant, task } of overdueItems) {
      const daysAgo = Math.abs(daysUntilDue(task));
      const cfg = getTaskConfig(task);
      const showOwner = activeFilter.length !== 1;
      const ownerTag = showOwner
        ? ` <span class="sched-owner-tag" style="color:${USERS[task.owner]?.color ?? 'inherit'};background:${(USERS[task.owner]?.color ?? '#666666')}26">👤 ${escapeHtml(task.owner)}</span>`
        : '';
      const doneToday = task.lastDone === today;
      const overdueDoneBtn = doneToday
        ? `<button class="sched-done-btn" data-action="schedule-undo-mark-done" data-plant="${plant.id}" data-task="${task.id}" title="Undo">↩️</button>`
        : `<span class="sched-done-btns">
             <button class="sched-done-btn" data-action="schedule-mark-done" data-plant="${plant.id}" data-task="${task.id}" title="Mark done">✅</button>
             <button class="sched-done-btn" data-action="schedule-mark-done-with-note" data-plant="${plant.id}" data-task="${task.id}" title="Mark done + add note">📝</button>
           </span>`;
      html += `<div class="sched-task sched-task-overdue">
        <span class="sched-task-label">${cfg.icon} <strong>${escapeHtml(cfg.name)}</strong> · ${escapeHtml(plant.name)}${ownerTag} <span class="sched-overdue-days">(${daysAgo} day${daysAgo !== 1 ? 's' : ''} overdue)</span></span>
        ${overdueDoneBtn}
      </div>`;
    }
    html += `</div>`;
  }

  const thisWeekCount = thisWeekDays.reduce((sum, d) => sum + itemsForDay(d).length, 0);
  const nextWeekCount = nextWeekDays.reduce((sum, d) => sum + itemsForDay(d).length, 0);

  html += `<div class="sched-section">`;
  html += sectionHeader('This Week', '#185FA5', thisWeekCount);

  for (const day of thisWeekDays) {
    html += renderDay(day);
  }

  html += `</div>
    <div class="sched-section">`;
  html += sectionHeader('Next Week', '#3B6D11', nextWeekCount);

  for (const day of nextWeekDays) {
    html += renderDay(day);
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
  <div class="app-header">
    <button class="back-btn" data-action="go-home">&#8249;</button>
    <div class="detail-header-title">
      <span class="detail-header-emoji-circle">${plant.emoji}</span>
      <span class="detail-header-name">${escapeHtml(plant.name)}</span>
      <button class="header-edit-plant-btn" data-action="open-edit-plant" data-plant="${plant.id}">Edit</button>
    </div>
    <button class="header-feedback-btn" data-action="feedback">💬</button>
    <button class="user-initial-circle" data-action="open-menu" style="background:${escapeHtml(userColor)}">${escapeHtml(initial)}</button>
  </div>
  <div class="plant-detail-tabs">
    <button class="detail-tab-btn${plantDetailTab === 'summary'  ? ' active' : ''}" data-action="plant-detail-tab" data-tab="summary">Summary</button>
    <button class="detail-tab-btn${plantDetailTab === 'tasks'    ? ' active' : ''}" data-action="plant-detail-tab" data-tab="tasks">Tasks</button>
    <button class="detail-tab-btn${plantDetailTab === 'notes'    ? ' active' : ''}" data-action="plant-detail-tab" data-tab="notes">Notes</button>
    <button class="detail-tab-btn${plantDetailTab === 'carelog'  ? ' active' : ''}" data-action="plant-detail-tab" data-tab="carelog">Care Log</button>
  </div>
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
  html += `<div class="detail-fab-stack">`;
  if (showNote) {
    html += `<button class="detail-fab detail-fab-note" data-action="add-note" data-plant="${plant.id}">&#128221; Add note</button>`;
  }
  if (showTask) {
    html += `<button class="detail-fab detail-fab-task" data-action="add-task" data-plant="${plant.id}">&#43; Add task</button>`;
  }
  html += `</div>`;

  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);
}

function renderUserFilterPills(filterId, selectedUsers) {
  const noneSelected = selectedUsers.length === 0;
  const allPillCls = noneSelected ? 'user-pill user-pill-all active' : 'user-pill user-pill-all';
  let html = `<div class="user-filter-row" data-filter="${filterId}">`;
  html += `<div class="${allPillCls}" data-action="user-filter-all" data-filter="${filterId}">All</div>`;
  html += `<div class="user-filter-sep"></div>`;
  for (const m of membersCache) {
    const active = selectedUsers.includes(m.display_name);
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
    html += `<div class="user-pill" data-action="user-filter-toggle" data-filter="${filterId}" data-user="${escapeHtml(m.display_name)}" style="${pillStyle}">
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
  let html = '';

  // ── Plant info card ───────────────────────────────────────
  const dateAcquired = plant.dateAcquired;
  if (dateAcquired) {
    const totalDays = daysBetween(dateAcquired, todayStr());
    const years     = Math.floor(totalDays / 365);
    const remDays   = totalDays % 365;
    const duration  = years > 0
      ? `${years} year${years !== 1 ? 's' : ''}, ${remDays} day${remDays !== 1 ? 's' : ''} of care 🌱`
      : `${totalDays} day${totalDays !== 1 ? 's' : ''} of care 🌱`;
    html += `
  <div class="plant-info-card" data-action="edit-plant" data-plant="${plant.id}">
    <div class="plant-info-card-body">
      <div class="plant-info-main">${escapeHtml(duration)}</div>
      <div class="plant-info-sub">Home since ${formatDate(dateAcquired)}</div>
    </div>
    <span class="plant-info-icon">&#9999;&#xFE0E;</span>
  </div>`;
  } else {
    html += `
  <div class="plant-info-card plant-info-card--empty" data-action="edit-plant" data-plant="${plant.id}">
    <div class="plant-info-card-body">
      <div class="plant-info-main">Add an arrival date</div>
      <div class="plant-info-sub">Track how long you&#8217;ve cared for it</div>
    </div>
    <span class="plant-info-icon">+</span>
  </div>`;
  }

  // ── Overdue ───────────────────────────────────────────────
  const overdueTasks = plant.tasks.filter(t => !t.paused && daysUntilDue(t) < 0);
  const dueTodayTasks = plant.tasks.filter(t => !t.paused && daysUntilDue(t) === 0);

  if (overdueTasks.length > 0) {
    html += sectionHeader('⚠️ Overdue', '#BA7517');
    for (const task of overdueTasks) {
      html += renderExpandedTaskRow(plant.id, task);
    }
  }

  // ── Due today ─────────────────────────────────────────────
  if (dueTodayTasks.length > 0) {
    html += sectionHeader('Due today', '#888780');
    for (const task of dueTodayTasks) {
      html += renderExpandedTaskRow(plant.id, task);
    }
  }

  if (overdueTasks.length === 0 && dueTodayTasks.length === 0) {
    html += `<div class="detail-all-clear">All caught up 🌿</div>`;
  }

  // ── Upcoming ──────────────────────────────────────────────
  const upcomingTasks = plant.tasks
    .filter(t => !t.paused && daysUntilDue(t) > 0 && daysUntilDue(t) !== Infinity)
    .sort((a, b) => daysUntilDue(a) - daysUntilDue(b));
  html += sectionHeader('Upcoming', '#185FA5');
  if (upcomingTasks.length === 0) {
    html += `<div class="detail-empty">No upcoming tasks</div>`;
  } else {
    html += `<div class="compact-task-list">`;
    for (const task of upcomingTasks) {
      html += renderCompactTaskRow(plant.id, task);
    }
    html += `</div>`;
  }

  // ── Recent activity ───────────────────────────────────────
  const plantNotes = notes.filter(n => n.plantId === plant.id);
  const activityItems = [
    ...plant.careLog.map(e  => ({ type: 'care', sortKey: e.date,                           data: e })),
    ...plantNotes.map(n     => ({ type: 'note', sortKey: (n.createdAt ?? '').split('T')[0], data: n })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 5);

  html += sectionHeader('Recent activity', '#888780');
  if (activityItems.length === 0) {
    html += `<div class="detail-empty">No activity yet</div>`;
  } else {
    html += `<div class="activity-list">`;
    for (const item of activityItems) {
      if (item.type === 'care') {
        const e    = item.data;
        const matchedTask = plant.tasks.find(t => t.id === e.taskId);
        const icon = matchedTask ? getTaskConfig(matchedTask).icon : '&#10003;';
        const diff = daysBetween(e.date, todayStr());
        const when = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
        html += `
      <div class="activity-row">
        <span class="activity-icon">${icon}</span>
        <span class="activity-text">${escapeHtml(e.taskName)}</span>
        <span class="activity-time">${when}</span>
      </div>`;
      } else {
        const n    = item.data;
        const diff = daysBetween(item.sortKey, todayStr());
        const when = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
        html += `
      <div class="activity-row">
        <span class="activity-icon">&#128221;</span>
        <span class="activity-text"><strong>${escapeHtml(n.author)}</strong> &middot; <span class="activity-note-preview">${escapeHtml(n.note)}</span></span>
        <span class="activity-time">${when}</span>
      </div>`;
      }
    }
    html += `</div>`;
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
  <button class="btn btn-primary onboarding-first-task-btn" data-action="onboarding-add-first-task" data-plant="${plant.id}">Add First Task</button>
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
  <div class="tasks-empty-icon">🌱</div>
  <div class="tasks-empty-title">No tasks yet</div>
  <div class="tasks-empty-sub">Add a task to start tracking care for this plant</div>
</div>`;
  }
  const activeFilter = tasksFilter ?? [activeUser];
  let html = renderUserFilterPills('tasks', activeFilter);
  const filtered = activeFilter.length === 0
    ? plant.tasks
    : plant.tasks.filter(t => activeFilter.includes(t.owner));
  if (filtered.length === 0) {
    html += `<div class="detail-empty">No tasks for selected users</div>`;
    return html;
  }
  html += `<div class="task-list">`;
  for (const task of filtered) {
    html += renderTaskCard(plant.id, task);
  }
  html += `</div>`;
  return html;
}

function renderNotesTab(plant) {
  const plantNotes = notes
    .filter(n => n.plantId === plant.id)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));

  if (plantNotes.length === 0) {
    return `<div class="detail-empty">No notes yet</div>`;
  }
  let html = `<div class="health-note-list">`;
  for (const note of plantNotes) {
    html += renderNoteCard(note);
  }
  html += `</div>`;
  return html;
}

function renderCareLogTab(plant) {
  const isNonDefault = careLogSegment !== 'full' || careLogMode !== 'tasks';
  let html = `<div class="carelog-filter-row">
  <button class="carelog-filter-btn${isNonDefault ? ' active' : ''}" data-action="carelog-toggle-filters">
    ☰ Filters${isNonDefault ? ' ●' : ''}
  </button>
</div>`;

  if (careLogFiltersOpen) {
    html += `<div class="carelog-filter-panel">
    <div class="carelog-filter-group">
      <div class="carelog-filter-group-header">
        <div class="carelog-filter-group-icon carelog-filter-icon-time">📅</div>
        <div class="carelog-filter-group-title">Time range</div>
        <div class="carelog-filter-group-desc">What period to show</div>
      </div>
      <div class="carelog-filter-seg">
        <button class="carelog-seg-btn${careLogSegment === 'past' ? ' active' : ''}" data-action="carelog-segment" data-segment="past">Past</button>
        <button class="carelog-seg-btn${careLogSegment === 'full' ? ' active' : ''}" data-action="carelog-segment" data-segment="full">Full log</button>
        <button class="carelog-seg-btn${careLogSegment === 'upcoming' ? ' active' : ''}" data-action="carelog-segment" data-segment="upcoming">Upcoming</button>
      </div>
    </div>
    <div class="carelog-filter-group carelog-filter-group-bordered">
      <div class="carelog-filter-group-header">
        <div class="carelog-filter-group-icon carelog-filter-icon-type">📋</div>
        <div class="carelog-filter-group-title">Activity type</div>
        <div class="carelog-filter-group-desc">What actions to include</div>
      </div>
      <div class="carelog-filter-seg">
        <button class="carelog-seg-btn${careLogMode === 'tasks' ? ' active' : ''}" data-action="carelog-mode" data-mode="tasks">Tasks only</button>
        <button class="carelog-seg-btn${careLogMode === 'all' ? ' active' : ''}" data-action="carelog-mode" data-mode="all">All activity</button>
      </div>
    </div>
  </div>`;
  }

  html += renderUserFilterPills('carelog', careLogFilter);

  const showUpcoming = careLogSegment === 'upcoming' || careLogSegment === 'full';
  const showPast     = careLogSegment === 'past'     || careLogSegment === 'full';

  if (showUpcoming) {
    const filteredUpcoming = careLogFilter.length === 0
      ? plant.tasks.filter(t => !t.paused)
      : plant.tasks.filter(t => !t.paused && careLogFilter.includes(t.owner));
    if (careLogSegment === 'full') {
      html += sectionHeader('Upcoming', '#185FA5', filteredUpcoming.length);
    }
    const upcomingTasks = filteredUpcoming
      .sort((a, b) => {
        const da = computeNextDue(a) ?? '9999-99-99';
        const db = computeNextDue(b) ?? '9999-99-99';
        return da.localeCompare(db);
      });
    if (upcomingTasks.length === 0) {
      html += `<div class="detail-empty">No tasks yet</div>`;
    } else {
      html += `<div class="carelog-upcoming-list">`;
      for (const task of upcomingTasks) {
        html += renderCareLogUpcomingRow(task);
      }
      html += `</div>`;
    }
  }

  if (careLogSegment === 'full') {
    html += `<div class="carelog-divider"></div>`;
    const filteredPastCount = careLogFilter.length === 0
      ? plant.careLog.length
      : plant.careLog.filter(e => careLogFilter.includes(e.author)).length;
    html += sectionHeader('Past', '#888780', filteredPastCount);
  }

  if (showPast) {
    const allEntries = [...plant.careLog].sort((a, b) => b.date.localeCompare(a.date));
    const careEntries = careLogFilter.length === 0
      ? allEntries
      : allEntries.filter(e => careLogFilter.includes(e.author));
    if (careEntries.length === 0) {
      html += `<div class="detail-empty">No care history yet</div>`;
    } else {
      html += `<div class="carelog-past-list">`;
      for (const entry of careEntries) {
        const linkedNote = notes.find(n =>
          n.plantId === plant.id &&
          n.taskId === entry.taskId &&
          (n.createdAt ?? '').startsWith(entry.date)
        );
        html += renderCareLogPastRow(entry, linkedNote, plant);
      }
      html += `</div>`;
    }
  }

  return html;
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

function closeSheet() {
  document.getElementById('sheet').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
  state.sheetMode = null;
  state.sheetData = {};
  // Clear content after transition to release DOM listeners and touch state
  setTimeout(() => { document.getElementById('sheet-content').innerHTML = ''; }, 320);
}

function openMenu() {
  renderMenuPanel();
  document.getElementById('menu-panel').classList.add('active');
  document.getElementById('menu-overlay').classList.add('active');
}

function closeMenu() {
  document.getElementById('menu-panel').classList.remove('active');
  document.getElementById('menu-overlay').classList.remove('active');
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
      <div class="menu-section-title">Account</div>
      <button class="menu-item" data-action="menu-switch-user">Switch User</button>
      <button class="menu-item" data-action="menu-export-data">&#8681; Export Backup</button>
      <button class="menu-item" data-action="menu-import-data">&#8679; Import Backup</button>
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
  const password = document.getElementById('sheet-new-password')?.value ?? '';
  const confirm  = document.getElementById('sheet-confirm-password')?.value ?? '';
  const errorEl  = document.getElementById('change-password-error');

  const showError = (msg) => {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  };

  if (password.length < 8) { showError('Password must be at least 8 characters.'); return; }
  if (password !== confirm) { showError('Passwords do not match.'); return; }

  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) { showError(error.message); return; }

  closeSheet();
  showToast('&#128274; Password updated!');
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
  const cfg = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const recType = task.recurrenceType ?? 'interval';

  state.sheetMode = 'edit-task';
  state.sheetData = { plantId, taskId };

  const weekdayBtns = WEEKDAY_NAMES.map((name, i) => {
    const sel = (task.weekdays ?? []).includes(i) ? 'selected' : '';
    return `<button class="weekday-btn ${sel}" data-action="sheet-toggle-weekday" data-day="${i}">${name}</button>`;
  }).join('');

  const isCustom = !TASK_CONFIG[task.id];

  openSheet(`
    <div class="sheet-title">${cfg.icon} ${cfg.name}</div>

    ${isCustom ? `
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input type="text" class="form-input" id="sheet-task-name" value="${escapeHtml(task.name ?? '')}">
    </div>` : ''}

    <div class="form-group">
      <label class="form-label">Owner</label>
      <div class="owner-pill-group">${renderOwnerPills(task.owner)}</div>
    </div>

    <div class="form-group">
      <label class="form-label">Recurrence</label>
      <div class="recurrence-type-toggle">
        <div class="recurrence-option ${recType === 'interval' ? 'selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="interval">Every X days</div>
        <div class="recurrence-option ${recType === 'weekdays' ? 'selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="weekdays">Days of week</div>
        <div class="recurrence-option ${recType === 'one-off' ? 'selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="one-off">One-off</div>
      </div>
    </div>

    <div id="recurrence-container" class="recurrence-${recType}">
      <div class="recurrence-interval-section form-group">
        <div class="freq-row">
          <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="${task.frequencyDays}">
          <span>days between tasks</span>
        </div>
      </div>
      <div class="recurrence-weekdays-section form-group">
        <div class="weekday-picker">${weekdayBtns}</div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Next due date</label>
      <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-next-due-override" value="${task.nextDueOverride ?? ''}"></div>
      <div class="form-hint">Leave empty to calculate automatically</div>
    </div>

    <div class="form-group">
      <label class="form-label">Note / Reminder</label>
      <textarea class="form-textarea" id="sheet-note" placeholder="e.g. Check for pests, rotate pot...">${escapeHtml(task.note ?? '')}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Last Done</label>
      <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-last-done" value="${task.lastDone ?? ''}"></div>
    </div>

    <div class="sheet-footer-sticky">
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
        <button class="btn btn-primary" data-action="sheet-save-task">Save</button>
      </div>
      <div class="sheet-danger-links">
        <button class="sheet-danger-link pause" data-action="${isPaused ? 'resume-task' : 'pause-task'}" data-plant="${plantId}" data-task="${taskId}">
          ${isPaused ? '&#9654; Resume Task' : '&#9646;&#9646; Pause Task'}
        </button>
        <button class="sheet-danger-link delete" data-action="delete-task" data-plant="${plantId}" data-task="${taskId}">&#128465; Delete Task</button>
      </div>
    </div>
  `);
}

function renderAddTaskStep1(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;
  const existingIds = new Set(plant.tasks.map(t => t.id));

  state.sheetMode = 'add-task-step1';
  state.sheetData = { plantId };

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

  const titleHtml = isCustom
    ? `<div class="sheet-title">Custom Task</div>`
    : `<div class="sheet-title">${cfg.icon} ${cfg.name}</div>`;

  const customFields = isCustom ? `
    <div class="form-group">
      <label class="form-label">Task Name</label>
      <input type="text" class="form-input" id="sheet-custom-name" placeholder="e.g. Mist leaves" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Icon</label>
      <div class="icon-picker" id="sheet-icon-picker">
        ${CUSTOM_ICONS.map((ic, i) =>
          `<div class="icon-option${i === 0 ? ' selected' : ''}" data-action="add-task-pick-icon" data-icon="${ic}">${ic}</div>`
        ).join('')}
      </div>
    </div>` : '';

  const todayVal = todayStr();

  openSheet(`
    ${titleHtml}
    ${customFields}
    <div class="form-group">
      <label class="form-label">Owner</label>
      <div class="owner-pill-group">${ownerPillsHtml}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Recurrence</label>
      <div class="recurrence-type-toggle">
        <div class="recurrence-option selected" data-action="sheet-toggle-recurrence" data-rtype="interval">Every X days</div>
        <div class="recurrence-option" data-action="sheet-toggle-recurrence" data-rtype="weekdays">Days of week</div>
        <div class="recurrence-option" data-action="sheet-toggle-recurrence" data-rtype="one-off">One-off</div>
      </div>
    </div>
    <div id="recurrence-container" class="recurrence-interval">
      <div class="recurrence-interval-section form-group">
        <div class="freq-row">
          <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="7">
          <span>days between tasks</span>
        </div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">First due date</label>
          <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-first-due-interval" value="${todayVal}"></div>
        </div>
      </div>
      <div class="recurrence-weekdays-section form-group">
        <div class="weekday-picker">${weekdayBtns}</div>
        <div class="form-group" style="margin-top:12px">
          <label class="form-label">Start from</label>
          <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-first-due-weekdays" value="${todayVal}"></div>
        </div>
      </div>
      <div class="recurrence-one-off-section form-group">
        <label class="form-label">Due date</label>
        <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-first-due-one-off" value="${todayVal}"></div>
      </div>
    </div>
    <div class="sheet-footer-sticky">
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-action="add-task-back" data-plant="${plantId}">&#8592; Back</button>
        <button class="btn btn-primary" data-action="sheet-save-new-task">Add Task</button>
      </div>
    </div>
  `);
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
  state.sheetData = { plantId };

  openSheet(`
    <div class="sheet-title">Add Note</div>
    <div class="form-group">
      <textarea class="form-textarea" id="sheet-note-text" placeholder="Describe what you observed..." style="min-height:110px"></textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="close-sheet">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-note">Save</button>
    </div>
  `);
}

function renderEditPlantStep2Html(plant, selectedEmoji) {
  const emoji = selectedEmoji ?? plant.emoji ?? '🪴';
  const dateDisplay = plant.dateAcquired
    ? new Date(plant.dateAcquired + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Set date';
  return `
    <div class="sheet-title edit-plant-sheet-title">Edit plant</div>
    <div class="edit-plant-field-label">ICON &amp; NAME</div>
    <div class="edit-plant-icon-name-row" id="edit-plant-fields">
      <button class="edit-plant-emoji-tile" data-action="add-plant-change-emoji">${escapeHtml(emoji)}</button>
      <input type="text" class="form-input" id="sheet-plant-name" value="${escapeHtml(plant.name)}" placeholder="Plant name" style="flex:1;">
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
    <div class="sheet-actions" style="margin-top:20px;" id="edit-plant-save-row">
      <button class="btn btn-primary" data-action="sheet-save-plant" style="flex:1;">Save changes</button>
    </div>
    <div class="edit-plant-delete-section">
      <button class="edit-plant-delete-btn" data-action="edit-plant-show-delete" id="edit-plant-delete-btn">Delete plant</button>
      <div class="edit-plant-delete-confirm" id="edit-plant-delete-confirm" style="display:none;">
        <div class="edit-plant-delete-confirm-body">This will permanently delete the plant and all its tasks, notes, and care history. This cannot be undone.</div>
        <div class="edit-plant-delete-confirm-actions">
          <button class="btn btn-ghost" data-action="edit-plant-hide-delete" style="flex:1;">Cancel</button>
          <button class="btn" data-action="delete-plant" data-plant="${escapeHtml(String(plant.id))}" style="flex:1;background:#c62828;color:#fff;">Yes, delete forever</button>
        </div>
      </div>
    </div>`;
}

function renderEditPlantSheet(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;

  state.sheetMode = 'edit-plant';
  state.sheetData = { plantId, step: 2, selectedEmoji: plant.emoji, activeTab: 'all' };

  openSheet(renderEditPlantStep2Html(plant, plant.emoji));
  attachArrivalDateListener('Set date');
}

async function handleSavePlant() {
  const { plantId: pid } = state.sheetData;
  const plant = getPlant(pid);
  if (!plant) return;

  const name  = document.getElementById('sheet-plant-name')?.value?.trim();
  const emoji = state.sheetData.selectedEmoji
    || document.querySelector('#sheet .emoji-option.selected')?.dataset.emoji
    || document.getElementById('sheet-plant-emoji')?.value?.trim();
  const date  = document.getElementById('sheet-acquired-date')?.value;

  const localUpdates = {
    name:         name  || plant.name,
    emoji:        emoji || plant.emoji,
    dateAcquired: date  || null,
  };

  updatePlantInfo(pid, localUpdates);

  const dbUpdates = {
    name:         localUpdates.name,
    emoji:        localUpdates.emoji,
    date_acquired: localUpdates.dateAcquired,
  };

  await supabaseClient
    .from('plants')
    .update(dbUpdates)
    .eq('id', pid)
    .then(({ error }) => { if (error) console.error('handleSavePlant error:', error); });

  closeSheet();
  renderPlantDetail(pid);
  showToast('✅ Plant saved!');
}

function renderAddPlantSheet() {
  state.sheetMode = 'add-plant';
  state.sheetData = { step: 1, selectedEmoji: '🪴', activeTab: 'all' };
  openSheet(renderAddPlantStep1Html('all', '🪴'));
}

async function handleSaveNewPlant() {
  const typedName = document.getElementById('sheet-plant-name')?.value?.trim();
  if (!typedName) { alert('Please enter a plant name.'); return; }

  const isDuplicate = plants.some(p => p.name.toLowerCase() === typedName.toLowerCase());
  let name;
  if (isDuplicate) {
    const altName = document.getElementById('sheet-plant-alt-name')?.value?.trim();
    name = altName || `${typedName} 2`;
  } else {
    name = typedName;
  }

  const emoji = state.sheetData.selectedEmoji
    || document.getElementById('sheet-plant-custom-emoji')?.value?.trim()
    || '🪴';
  const dateAcquired = document.getElementById('sheet-acquired-date')?.value || null;
  const sortOrder = plants.length + 1;

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
  }

  const newPlant = {
    id:           inserted?.id ?? uid(),
    name,
    emoji,
    dateAcquired: dateAcquired ?? '',
    tasks:        [],
    careLog:      [],
  };

  plants.push(newPlant);
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
}

async function handleSaveNewTask() {
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

  const firstDueInputId = recType === 'interval' ? 'sheet-first-due-interval'
                        : recType === 'weekdays'  ? 'sheet-first-due-weekdays'
                        :                           'sheet-first-due-one-off';
  const firstDueVal = document.getElementById(firstDueInputId)?.value || null;

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
  navigateTo('plant', pid);
  setTimeout(() => { _appEl.style.pointerEvents = ''; }, 350);
  showToast('✅ Task added!');
}

async function handleOnboardingFirstTask(plantId) {
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
}

// ============================================================
// NAVIGATION
// ============================================================

function renderApp() {
  if (state.view === 'home') renderHome();
  else if (state.view === 'plant') renderPlantDetail(state.plantId);
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
  if (scheduleFilter === null) scheduleFilter = [activeUser];
  if (tasksFilter === null) tasksFilter = [activeUser];
  state.view = view;
  state.plantId = plantId;
  if (view === 'home') renderHome();
  else if (view === 'plant') { plantDetailTab = 'summary'; renderPlantDetail(plantId); }
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

    case 'menu-switch-user': {
      closeMenu();
      const newUser = activeUser === 'Matu' ? 'Vale' : 'Matu';
      setActiveUser(newUser);
      renderHome();
      showToast(`Switched to ${newUser}`);
      break;
    }

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

    case 'menu-sign-out':
      closeMenu();
      supabaseClient.auth.signOut().then(() => renderLoginScreen());
      break;

    case 'open-plant':
      navigateTo('plant', plantId);
      break;

    case 'onboarding-open-plant':
      closeSheet();
      if (scheduleFilter === null) scheduleFilter = [activeUser];
      if (tasksFilter === null) tasksFilter = [activeUser];
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

    case 'switch-tab': {
      activeTab = target.dataset.tab;
      renderHome();
      break;
    }

    case 'enable-notifications': {
      console.log('enable-notifications handler reached');
      await subscribeToPush();
      renderHome();
      break;
    }

    case 'select-user': {
      const user = target.dataset.user;
      setActiveUser(user);
      navigateTo('home');
      break;
    }

    case 'switch-user': {
      setActiveUser(activeUser === 'Matu' ? 'Vale' : 'Matu');
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

    case 'schedule-mark-done': {
      const _schedTask = getTask(plantId, taskId);
      const _schedName = getTaskConfig(_schedTask)?.name ?? _schedTask?.name ?? 'Task';
      markTaskDone(plantId, taskId);
      renderHome();
      showDoneToast(plantId, taskId, _schedName);
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

    case 'user-filter-all': {
      const filterId = target.dataset.filter;
      if (filterId === 'schedule') scheduleFilter = [];
      if (filterId === 'tasks') tasksFilter = [];
      if (filterId === 'carelog') careLogFilter = [];
      renderApp();
      break;
    }

    case 'user-filter-toggle': {
      const filterId = target.dataset.filter;
      const user = target.dataset.user;
      if (filterId === 'schedule') {
        scheduleFilter = scheduleFilter.includes(user)
          ? scheduleFilter.filter(u => u !== user)
          : [...scheduleFilter, user];
      }
      if (filterId === 'tasks') {
        tasksFilter = tasksFilter.includes(user)
          ? tasksFilter.filter(u => u !== user)
          : [...tasksFilter, user];
      }
      if (filterId === 'carelog') {
        careLogFilter = careLogFilter.includes(user)
          ? careLogFilter.filter(u => u !== user)
          : [...careLogFilter, user];
      }
      renderApp();
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

    case 'edit-task':
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'edit-plant':
    case 'open-edit-plant':
      renderEditPlantSheet(plantId);
      break;

    case 'edit-plant-show-delete': {
      document.getElementById('edit-plant-delete-btn').style.display = 'none';
      document.getElementById('edit-plant-delete-confirm').style.display = '';
      const lockStyle = 'pointer-events:none;opacity:0.4;';
      document.getElementById('edit-plant-fields').style.cssText = lockStyle;
      document.getElementById('edit-plant-arrival-pill').style.cssText = lockStyle;
      document.getElementById('edit-plant-save-row').style.cssText = lockStyle;
      break;
    }

    case 'edit-plant-hide-delete': {
      document.getElementById('edit-plant-delete-btn').style.display = '';
      document.getElementById('edit-plant-delete-confirm').style.display = 'none';
      document.getElementById('edit-plant-fields').style.cssText = '';
      document.getElementById('edit-plant-arrival-pill').style.cssText = '';
      document.getElementById('edit-plant-save-row').style.cssText = '';
      break;
    }

    case 'add-note':
      if (document.querySelector('.coach-overlay, .notif-overlay')) return;
      renderAddNoteSheet(plantId);
      break;

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
      editingNoteId = noteId;
      renderPlantDetail(state.plantId);
      document.querySelector(`.note-edit-textarea[data-note="${noteId}"]`)?.focus();
      break;
    }

    case 'save-note-edit': {
      const textarea = document.querySelector(`.note-edit-textarea[data-note="${noteId}"]`);
      const newText = textarea?.value?.trim();
      if (!newText) { alert('Note cannot be empty.'); return; }
      await updateNote(noteId, newText);
      editingNoteId = null;
      renderPlantDetail(state.plantId);
      break;
    }

    case 'cancel-note-edit':
      editingNoteId = null;
      renderPlantDetail(state.plantId);
      break;

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
      const customEmoji = document.getElementById('sheet-plant-custom-emoji')?.value?.trim();
      const emoji = customEmoji || state.sheetData.selectedEmoji || '🪴';
      state.sheetData.selectedEmoji = emoji;
      state.sheetData.step = 2;
      if (state.sheetMode === 'edit-plant') {
        const editPlant = getPlant(state.sheetData.plantId);
        openSheet(renderEditPlantStep2Html(editPlant, emoji));
        attachArrivalDateListener('Set date');
      } else {
        openSheet(renderAddPlantStep2Html(emoji));
        attachArrivalDateListener('Set arrival date');
        attachAddPlantNameListener();
        setTimeout(() => document.getElementById('sheet-plant-name')?.focus(), 80);
      }
      break;
    }

    case 'add-plant-back':
    case 'add-plant-change-emoji':
      state.sheetData.step = 1;
      openSheet(renderAddPlantStep1Html(state.sheetData.activeTab || 'all', state.sheetData.selectedEmoji || '🪴'));
      break;

    case 'add-plant-custom-emoji-trigger': {
      const customInput = document.getElementById('sheet-plant-custom-emoji');
      if (customInput) {
        customInput.style.display = 'block';
        target.style.display = 'none';
        customInput.focus();
      }
      break;
    }

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
      closeSheet();
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
      break;
    }

    case 'sheet-toggle-weekday':
      target.classList.toggle('selected');
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
      const lastDoneVal = document.getElementById('sheet-last-done')?.value;
      const overrideVal = document.getElementById('sheet-next-due-override')?.value;

      const taskUpdates = {
        recurrenceType: recType,
        frequencyDays,
        weekdays,
        note: document.getElementById('sheet-note')?.value ?? '',
        owner: selectedOwner?.dataset.owner ?? 'Matu',
        lastDone: lastDoneVal || null,
        nextDueOverride: overrideVal || null,
      };

      if (!TASK_CONFIG[tid]) {
        const nameVal = document.getElementById('sheet-task-name')?.value?.trim();
        if (nameVal) taskUpdates.name = nameVal;
      }

      updateTask(pid, tid, taskUpdates);
      closeSheet();
      renderPlantDetail(pid);
      showToast('✅ Task saved!');
      break;
    }

    case 'sheet-save-note': {
      const { plantId: pid } = state.sheetData;
      const text = document.getElementById('sheet-note-text')?.value?.trim();
      if (!text) { alert('Please enter a note.'); return; }
      await addNote(pid, text);
      closeSheet();
      renderPlantDetail(pid);
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
      break;

    case 'carelog-segment':
      careLogSegment = target.dataset.segment;
      renderPlantDetail(state.plantId);
      break;

    case 'sheet-save-plant':
      handleSavePlant();
      break;

    // DEV TOOLS — remove before public launch
    case 'dev-seed-empty':   showDevToolsConfirm('empty',  'Empty state');    break;
    case 'dev-seed-medium':  showDevToolsConfirm('medium', 'Medium usage');   break;
    case 'dev-seed-heavy':   showDevToolsConfirm('heavy',  'Heavy usage');    break;
    case 'dev-tools-cancel': document.getElementById('dev-tools-body').innerHTML = `
      <button class="dev-tools-btn" data-action="dev-seed-empty">🌱 Empty state</button>
      <button class="dev-tools-btn" data-action="dev-seed-medium">🌿 Medium usage</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy">🌳 Heavy usage</button>`; break;
    case 'dev-tools-confirm': await runDevSeed(target.dataset.scenario); break;
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
// ARRIVAL DATE LISTENER
// ============================================================

function attachArrivalDateListener(emptyText = 'Set date') {
  const input = document.getElementById('sheet-acquired-date');
  if (!input) return;

  input.max = new Date().toLocaleDateString('en-CA');

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
      <button class="dev-tools-btn" data-action="dev-seed-medium">🌿 Medium usage</button>
      <button class="dev-tools-btn" data-action="dev-seed-heavy">🌳 Heavy usage</button>
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
  const labels = { empty: 'Empty state', medium: 'Medium usage', heavy: 'Heavy usage' };
  try {
    if (scenario === 'empty')  await seedEmpty();
    if (scenario === 'medium') await seedMedium();
    if (scenario === 'heavy')  await seedHeavy();
    closeSheet();
    await loadFromSupabase();
    navigateTo('home');
    showToast(`✅ ${labels[scenario]} data loaded`);
  } catch (err) {
    console.error('[DevTools] seed error:', err);
    showToast('❌ Seed failed — check console');
  }
}

// Wipe all plants in household (tasks/care_log/notes are plant-scoped)
async function seedEmpty() {
  const now = new Date().toISOString();
  const { data: rows } = await supabaseClient
    .from('plants').select('id').eq('household_id', householdId).is('deleted_at', null);
  if (rows?.length) {
    await supabaseClient.from('plants').update({ deleted_at: now })
      .in('id', rows.map(r => r.id));
  }
}

async function seedMedium() {
  await seedEmpty();

  const today  = todayStr();
  const member0 = membersCache[0]?.id ?? null;
  const member1 = (membersCache[1] ?? membersCache[0])?.id ?? null;

  // ── Plants ──────────────────────────────────────────────────
  const plantDefs = [
    { emoji: '🌿', name: 'Monstera',        days_ago: 45  },
    { emoji: '🌸', name: 'Bougainvillea',   days_ago: 120 },
    { emoji: '🍊', name: 'Mandarin Tree',   days_ago: 200 },
  ];

  const insertedPlants = [];
  for (let i = 0; i < plantDefs.length; i++) {
    const def = plantDefs[i];
    const { data } = await supabaseClient.from('plants').insert({
      household_id:  householdId,
      name:          def.name,
      emoji:         def.emoji,
      date_acquired: addDays(today, -def.days_ago),
      sort_order:    i + 1,
    }).select().single();
    insertedPlants.push(data);
  }

  const [monstera, bougain, mandarin] = insertedPlants;

  // ── Tasks ────────────────────────────────────────────────────
  const taskDefs = [
    { plant: monstera,  name: 'Normal Watering', icon: '💧', type: 'water',     recurrence: { type: 'interval', every: 7,  unit: 'days', days: [] }, last_done: addDays(today, -3),  next_due_override: null },
    { plant: monstera,  name: 'Fertilize',        icon: '🌱', type: 'fertilize', recurrence: { type: 'interval', every: 30, unit: 'days', days: [] }, last_done: addDays(today, -20), next_due_override: null },
    { plant: bougain,   name: 'Normal Watering', icon: '💧', type: 'water',     recurrence: { type: 'interval', every: 5,  unit: 'days', days: [] }, last_done: addDays(today, -6),  next_due_override: null },
    { plant: bougain,   name: 'Check Pests',     icon: '🐛', type: 'pest',      recurrence: { type: 'interval', every: 14, unit: 'days', days: [] }, last_done: addDays(today, -10), next_due_override: null },
    { plant: mandarin,  name: 'Normal Watering', icon: '💧', type: 'water',     recurrence: { type: 'interval', every: 7,  unit: 'days', days: [] }, last_done: today,              next_due_override: null },
    { plant: mandarin,  name: 'Repot',           icon: '🪴', type: 'repot',     recurrence: { type: 'one-off' },                                      last_done: null,               next_due_override: addDays(today, 5) },
  ];

  const insertedTasks = [];
  for (let i = 0; i < taskDefs.length; i++) {
    const t = taskDefs[i];
    const { data } = await supabaseClient.from('tasks').insert({
      plant_id:          t.plant.id,
      name:              t.name,
      icon:              t.icon,
      type:              t.type,
      recurrence:        t.recurrence,
      owner_id:          member0,
      paused:            false,
      note:              '',
      sort_order:        i + 1,
      last_done:         t.last_done,
      next_due_override: t.next_due_override,
    }).select().single();
    insertedTasks.push(data);
  }

  // ── Care log (5 entries over last 2 weeks) ───────────────────
  const careEntries = [
    { plant: monstera, task: insertedTasks[0], member: member0, days_ago: 3,  tname: 'Normal Watering', ttype: 'water'     },
    { plant: monstera, task: insertedTasks[1], member: member1, days_ago: 20, tname: 'Fertilize',       ttype: 'fertilize' },
    { plant: bougain,  task: insertedTasks[2], member: member0, days_ago: 6,  tname: 'Normal Watering', ttype: 'water'     },
    { plant: bougain,  task: insertedTasks[3], member: member1, days_ago: 10, tname: 'Check Pests',     ttype: 'pest'      },
    { plant: mandarin, task: insertedTasks[4], member: member0, days_ago: 0,  tname: 'Normal Watering', ttype: 'water'     },
  ];
  for (const e of careEntries) {
    const ts = new Date(); ts.setDate(ts.getDate() - e.days_ago); ts.setHours(10, 0, 0, 0);
    await supabaseClient.from('care_log').insert({
      plant_id:            e.plant.id,
      task_id:             e.task?.id ?? null,
      household_member_id: e.member,
      task_name:           e.tname,
      task_type:           e.ttype,
      created_at:          ts.toISOString(),
    });
  }

  // ── Notes (2) ────────────────────────────────────────────────
  const note1ts = new Date(); note1ts.setDate(note1ts.getDate() - 5);
  const note2ts = new Date(); note2ts.setDate(note2ts.getDate() - 12);
  await supabaseClient.from('notes').insert({ plant_id: monstera.id,  household_member_id: member0, note: 'New leaf coming in!',            created_at: note1ts.toISOString() });
  await supabaseClient.from('notes').insert({ plant_id: bougain.id,   household_member_id: member1, note: 'Spotted a few spider mites.',    created_at: note2ts.toISOString() });
}

async function seedHeavy() {
  await seedEmpty();

  const today  = todayStr();
  const member0 = membersCache[0]?.id ?? null;
  const member1 = (membersCache[1] ?? membersCache[0])?.id ?? null;

  // ── Plants ──────────────────────────────────────────────────
  const plantDefs = [
    { emoji: '🌿', name: 'Monstera',      days_ago: 365 },
    { emoji: '🌸', name: 'Bougainvillea', days_ago: 300 },
    { emoji: '🍊', name: 'Mandarin Tree', days_ago: 250 },
    { emoji: '🌵', name: 'Cactus',        days_ago: 180 },
    { emoji: '🎋', name: 'Bamboo',        days_ago: 90  },
    { emoji: '🌻', name: 'Sunflower',     days_ago: 30  },
  ];

  const insertedPlants = [];
  for (let i = 0; i < plantDefs.length; i++) {
    const def = plantDefs[i];
    const { data } = await supabaseClient.from('plants').insert({
      household_id:  householdId,
      name:          def.name,
      emoji:         def.emoji,
      date_acquired: addDays(today, -def.days_ago),
      sort_order:    i + 1,
    }).select().single();
    insertedPlants.push(data);
  }

  // ── Tasks (3-4 per plant) ─────────────────────────────────────
  const taskMatrix = [
    // Monstera
    [
      { name: 'Normal Watering', icon: '💧', type: 'water',     rec: { type: 'interval', every: 7,  unit: 'days', days: [] }, ld: addDays(today, -2), ndo: null },
      { name: 'Fertilize',       icon: '🌱', type: 'fertilize', rec: { type: 'interval', every: 30, unit: 'days', days: [] }, ld: addDays(today, -28), ndo: null },
      { name: 'Check Pests',     icon: '🐛', type: 'pest',      rec: { type: 'interval', every: 14, unit: 'days', days: [] }, ld: addDays(today, -10), ndo: null },
      { name: 'Rotate',          icon: '🔄', type: 'rotate',    rec: { type: 'interval', every: 14, unit: 'days', days: [] }, ld: addDays(today, -5),  ndo: null },
    ],
    // Bougainvillea
    [
      { name: 'Normal Watering', icon: '💧', type: 'water',     rec: { type: 'interval', every: 5,  unit: 'days', days: [] }, ld: addDays(today, -6),  ndo: null },
      { name: 'Prune',           icon: '✂️',  type: 'prune',     rec: { type: 'interval', every: 30, unit: 'days', days: [] }, ld: addDays(today, -25), ndo: null },
      { name: 'Check Pests',     icon: '🐛', type: 'pest',      rec: { type: 'interval', every: 14, unit: 'days', days: [] }, ld: addDays(today, -3),  ndo: null },
    ],
    // Mandarin Tree
    [
      { name: 'Normal Watering', icon: '💧', type: 'water',     rec: { type: 'interval', every: 7,  unit: 'days', days: [] }, ld: today,               ndo: null },
      { name: 'Fertilize',       icon: '🌱', type: 'fertilize', rec: { type: 'interval', every: 21, unit: 'days', days: [] }, ld: addDays(today, -1),  ndo: null },
      { name: 'Repot',           icon: '🪴', type: 'repot',     rec: { type: 'one-off' },                                     ld: null,                ndo: addDays(today, 3) },
    ],
    // Cactus
    [
      { name: 'Normal Watering', icon: '💧', type: 'water',     rec: { type: 'interval', every: 21, unit: 'days', days: [] }, ld: addDays(today, -1),  ndo: null },
      { name: 'Check',           icon: '🔍', type: 'check',     rec: { type: 'interval', every: 30, unit: 'days', days: [] }, ld: addDays(today, -29), ndo: null },
    ],
    // Bamboo
    [
      { name: 'Normal Watering', icon: '💧', type: 'water',     rec: { type: 'interval', every: 3,  unit: 'days', days: [] }, ld: addDays(today, -3),  ndo: null },
      { name: 'Fertilize',       icon: '🌱', type: 'fertilize', rec: { type: 'interval', every: 14, unit: 'days', days: [] }, ld: addDays(today, -12), ndo: null },
      { name: 'Rotate',          icon: '🔄', type: 'rotate',    rec: { type: 'interval', every: 7,  unit: 'days', days: [] }, ld: addDays(today, -2),  ndo: null },
    ],
    // Sunflower
    [
      { name: 'Normal Watering', icon: '💧', type: 'water',     rec: { type: 'interval', every: 2,  unit: 'days', days: [] }, ld: addDays(today, -2),  ndo: null },
      { name: 'Check',           icon: '🔍', type: 'check',     rec: { type: 'interval', every: 7,  unit: 'days', days: [] }, ld: addDays(today, -5),  ndo: null },
      { name: 'Fertilize',       icon: '🌱', type: 'fertilize', rec: { type: 'interval', every: 14, unit: 'days', days: [] }, ld: addDays(today, -7),  ndo: null },
    ],
  ];

  const allTasks = [];
  for (let pi = 0; pi < insertedPlants.length; pi++) {
    const plant = insertedPlants[pi];
    for (let ti = 0; ti < taskMatrix[pi].length; ti++) {
      const t = taskMatrix[pi][ti];
      const { data } = await supabaseClient.from('tasks').insert({
        plant_id:          plant.id,
        name:              t.name,
        icon:              t.icon,
        type:              t.type,
        recurrence:        t.rec,
        owner_id:          ti % 2 === 0 ? member0 : member1,
        paused:            false,
        note:              '',
        sort_order:        ti + 1,
        last_done:         t.ld,
        next_due_override: t.ndo,
      }).select().single();
      allTasks.push({ task: data, plant });
    }
  }

  // ── Care log (20 entries over last 3 months) ──────────────────
  const careTypes = [
    { tname: 'Normal Watering', ttype: 'water'     },
    { tname: 'Fertilize',       ttype: 'fertilize' },
    { tname: 'Check Pests',     ttype: 'pest'      },
    { tname: 'Rotate',          ttype: 'rotate'    },
    { tname: 'Prune',           ttype: 'prune'     },
  ];
  const careOffsets = [0, 2, 5, 7, 10, 14, 18, 21, 25, 30, 35, 42, 50, 58, 65, 75, 85, 95, 75, 90];
  for (let i = 0; i < 20; i++) {
    const entry = allTasks[i % allTasks.length];
    const ct    = careTypes[i % careTypes.length];
    const ts    = new Date(); ts.setDate(ts.getDate() - careOffsets[i]); ts.setHours(9 + (i % 8), 0, 0, 0);
    await supabaseClient.from('care_log').insert({
      plant_id:            entry.plant.id,
      task_id:             entry.task?.id ?? null,
      household_member_id: i % 2 === 0 ? member0 : member1,
      task_name:           ct.tname,
      task_type:           ct.ttype,
      created_at:          ts.toISOString(),
    });
  }

  // ── Notes (8 across plants) ───────────────────────────────────
  const noteDefs = [
    { pi: 0, member: member0, days_ago: 5,   text: 'New leaf coming in — 4th this year!' },
    { pi: 0, member: member1, days_ago: 30,  text: 'Moved closer to the window.' },
    { pi: 1, member: member0, days_ago: 8,   text: 'Spider mites spotted. Treated with neem oil.' },
    { pi: 1, member: member1, days_ago: 60,  text: 'Pruned back the leggy stems.' },
    { pi: 2, member: member0, days_ago: 15,  text: 'First flower buds forming!' },
    { pi: 3, member: member1, days_ago: 20,  text: 'Repotted into cactus mix.' },
    { pi: 4, member: member0, days_ago: 3,   text: 'Yellowing on lower stalks — may be overwatered.' },
    { pi: 5, member: member1, days_ago: 10,  text: 'Growing faster than expected.' },
  ];
  for (const n of noteDefs) {
    const ts = new Date(); ts.setDate(ts.getDate() - n.days_ago);
    await supabaseClient.from('notes').insert({
      plant_id:            insertedPlants[n.pi].id,
      household_member_id: n.member,
      note:                n.text,
      created_at:          ts.toISOString(),
    });
  }
}

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
  document.getElementById('overlay').addEventListener('click', closeSheet);
  document.getElementById('menu-overlay').addEventListener('click', closeMenu);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('sheet').classList.contains('active')) closeSheet();
  });

  supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
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

    await loadFromSupabase();

    const currentMember = membersCache.find(m => m.id === currentMemberId);
    if (currentMemberId && !currentMember?.display_name) {
      renderNameCaptureScreen();
      return;
    }

    const saved = getActiveUser();
    if (saved) {
      activeUser = saved;
      navigateTo('home');
    } else {
      renderUserSelect();
    }
  });
});
