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
let scheduleShowAll = false;
let plantDetailTab = 'summary';
let careLogSegment = 'full';
let membersCache = []; // household_members rows: { id, display_name }
let householdId = null;
let activityFeed = []; // merged care_log + notes, top 5 across all plants

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

  // 2. Look up household_id from household_members
  const { data: member } = await supabaseClient
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();
  if (!member) return;

  householdId = member.household_id;

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
      author:   r.task_name,
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

const PLANT_EMOJIS = ['🌱','🪴','🌿','🍃','🌵','🎋','🎍','🌾','🌲','🌳','🌴','🍀','🍁','🍂','🌸','🌺','🌻','🌹','🌷','💐','🍊','🍋','🍇','🍓','🫐','🥦','🌶️','🧅','🧄'];

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
// RENDER: HOME
// ============================================================

function renderHeaderRight() {
  const activeMember = membersCache.find(m => m.display_name === activeUser);
  const userColor    = activeMember?.color ?? '#2e7d51';
  const initial      = (activeUser ?? '?')[0].toUpperCase();
  return `
    <div class="header-right">
      <span class="date-label">${todayFormatted()}</span>
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

function renderHome() {
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
    // isDue() already returns false for paused tasks, so the count is correct
    const totalDue = plants.reduce((sum, p) => sum + p.tasks.filter(isDue).length, 0);

    if (totalDue > 0) {
      html += `
    <div class="due-banner">
      &#9888;&#65039; ${totalDue} task${totalDue !== 1 ? 's' : ''} due today
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

      let dueBadgeHtml = '';
      if (plant.tasks.length === 0) {
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
      ${dueTasks.length > 0 ? `<div class="due-tasks-row">${taskPillsHtml}</div>` : ''}
    </div>`;
    }

    html += '</div>';

    if (plants.length > 0) {
      html += `<button class="fab-add-plant" data-action="add-plant">&#43; Add Plant</button>`;
    }

    html += `<div style="text-align:center;font-size:10px;color:var(--text-muted);margin-top:4px;opacity:0.6;">Built: ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}</div>`;
  } else {
    html += renderSchedule();
  }

  document.getElementById('app').innerHTML = html;
}

// ============================================================
// RENDER: SCHEDULE
// ============================================================

function renderSchedule() {
  const today = todayStr();
  const thisMonday = getMondayOfWeek(today);
  const nextMonday = addDays(thisMonday, 7);

  // Collect relevant (non-paused) task items
  const items = [];
  for (const plant of plants) {
    for (const task of plant.tasks) {
      if (task.paused) continue;
      if (!scheduleShowAll && task.owner !== activeUser) continue;
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
    const ownerTag = scheduleShowAll
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

  let html = `
    <div class="sched-toolbar">
      <label class="sched-toggle-label">
        <input type="checkbox" class="sched-toggle-cb" data-action="schedule-toggle-all"${scheduleShowAll ? ' checked' : ''}>
        Show all tasks
      </label>
    </div>`;

  if (overdueItems.length > 0) {
    html += `<div class="sched-section sched-section-overdue">
      <div class="sched-section-title">⚠️ Overdue</div>`;
    for (const { plant, task } of overdueItems) {
      const daysAgo = Math.abs(daysUntilDue(task));
      const cfg = getTaskConfig(task);
      const ownerTag = scheduleShowAll
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

  html += `<div class="sched-section">
      <div class="sched-section-title">This Week</div>`;

  for (const day of thisWeekDays) {
    html += renderDay(day);
  }

  html += `</div>
    <div class="sched-section">
      <div class="sched-section-title">Next Week</div>`;

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
    </div>
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
  const showNote = plantDetailTab === 'summary' || plantDetailTab === 'notes' || plantDetailTab === 'carelog';
  const showTask = plantDetailTab === 'summary' || plantDetailTab === 'tasks' || plantDetailTab === 'carelog';
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
    html += `<div class="detail-section-label detail-section-label--overdue">&#9888; Overdue</div>`;
    for (const task of overdueTasks) {
      html += renderExpandedTaskRow(plant.id, task);
    }
  }

  // ── Due today ─────────────────────────────────────────────
  if (dueTodayTasks.length > 0) {
    html += `<div class="detail-section-label">Due today</div>`;
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
  html += `
  <div class="detail-section-row">
    <span class="detail-section-label">Upcoming</span>
    <button class="detail-section-link" data-action="plant-detail-tab" data-tab="tasks">see all</button>
  </div>`;
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

  html += `
  <div class="detail-section-row">
    <span class="detail-section-label">Recent activity</span>
    <button class="detail-section-link" data-action="plant-detail-tab" data-tab="carelog">view log</button>
  </div>`;
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
  if (plant.tasks.length === 0) {
    return `<div class="detail-empty">No tasks yet</div>`;
  }
  let html = `<div class="task-list">`;
  for (const task of plant.tasks) {
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
  let html = `
  <div class="carelog-segmented">
    <button class="carelog-seg-btn${careLogSegment === 'past'     ? ' active' : ''}" data-action="carelog-segment" data-segment="past">Past</button>
    <button class="carelog-seg-btn${careLogSegment === 'upcoming' ? ' active' : ''}" data-action="carelog-segment" data-segment="upcoming">Upcoming</button>
    <button class="carelog-seg-btn${careLogSegment === 'full'     ? ' active' : ''}" data-action="carelog-segment" data-segment="full">Full Log</button>
  </div>`;

  const showUpcoming = careLogSegment === 'upcoming' || careLogSegment === 'full';
  const showPast     = careLogSegment === 'past'     || careLogSegment === 'full';

  if (showUpcoming) {
    if (careLogSegment === 'full') {
      html += `<div class="detail-section-label">Upcoming</div>`;
    }
    const upcomingTasks = plant.tasks
      .filter(t => !t.paused)
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
    html += `<div class="detail-section-label">Past</div>`;
  }

  if (showPast) {
    const careEntries = [...plant.careLog].sort((a, b) => b.date.localeCompare(a.date));
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
        html += renderCareLogPastRow(entry, linkedNote);
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

function renderCareLogPastRow(entry, linkedNote) {
  const icon       = '✅';
  const authorCls  = (entry.author ?? '').toLowerCase();
  const diff       = daysBetween(entry.date, todayStr());
  const when       = diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`;
  const noteLine   = linkedNote
    ? `<div class="carelog-past-note">${escapeHtml(linkedNote.note)}</div>`
    : '';

  return `
  <div class="carelog-past-row">
    <span class="carelog-row-icon">${icon}</span>
    <div class="carelog-past-meta">
      <div class="carelog-past-main">
        <span class="author-label ${authorCls}">${escapeHtml(entry.author)}</span> ${escapeHtml(entry.taskName)}
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

function renderTaskCard(plantId, task) {
  const cfg = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const ownerCls = task.owner.toLowerCase();
  const otherOwner = task.owner === 'Matu' ? 'Vale' : 'Matu';

  let html = `
  <div class="task-card${isPaused ? ' paused' : ''}">
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

  if (isPaused) {
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
  const authorCls = (note.author ?? '').toLowerCase();
  const activeMemberId = membersCache.find(m => m.display_name === activeUser)?.id;
  const isOwn = note.memberId && note.memberId === activeMemberId;
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
        <span class="author-label ${authorCls}">${escapeHtml(note.author ?? '')}</span>
        &middot; ${formatNoteDate(note.createdAt)}${taskMeta}
      </span>
      ${actions}
    </div>
    ${body}
  </div>`;
}

function renderCareLogEntry(entry) {
  const type = entry.taskType ?? TASK_CONFIG[entry.taskId]?.type ?? 'custom';
  const authorCls = entry.author.toLowerCase();
  return `
  <div class="care-log-entry">
    <div class="care-log-dot ${type}"></div>
    <div class="care-log-info">
      <div class="care-log-task">${escapeHtml(entry.taskName)}</div>
      <div class="care-log-who"><span class="author-label ${authorCls}">${escapeHtml(entry.author)}</span></div>
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

function renderEditPlantSheet(plantId) {
  const plant = getPlant(plantId);
  if (!plant) return;

  state.sheetMode = 'edit-plant';
  state.sheetData = { plantId };

  openSheet(`
    <div class="sheet-title">Edit Plant Info</div>
    <div class="form-group">
      <label class="form-label">Plant Name</label>
      <input type="text" class="form-input" id="sheet-plant-name" value="${escapeHtml(plant.name)}">
    </div>
    <div class="form-group">
      <label class="form-label">Emoji</label>
      ${renderEmojiPickerHtml(plant.emoji)}
    </div>
    <div class="form-group">
      <label class="form-label">Arrival date (optional)</label>
      <div class="date-input-wrapper" style="cursor:pointer" onclick="this.querySelector('input').click()"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-acquired-date" value="${plant.dateAcquired ?? ''}"></div>
      <p class="form-hint">Track how long you've cared for it</p>
    </div>
    <div class="sheet-footer-sticky">
      <div class="sheet-actions">
        <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
        <button class="btn btn-primary" data-action="sheet-save-plant">Save</button>
      </div>
      <div class="sheet-danger-links">
        <button class="sheet-danger-link delete" data-action="delete-plant" data-plant="${plantId}">Delete Plant</button>
      </div>
    </div>
  `);
}

async function handleSavePlant() {
  const { plantId: pid } = state.sheetData;
  const plant = getPlant(pid);
  if (!plant) return;

  const name  = document.getElementById('sheet-plant-name')?.value?.trim();
  const selectedGridEmoji = document.querySelector('#sheet .emoji-option.selected')?.dataset.emoji ?? '';
  const emoji = selectedGridEmoji || document.getElementById('sheet-plant-emoji')?.value?.trim();
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
  state.sheetData = {};

  openSheet(`
    <div class="sheet-title">Add Plant</div>
    <div class="form-group">
      <label class="form-label">Plant Name</label>
      <input type="text" class="form-input" id="sheet-plant-name" placeholder="e.g. Monstera" autocomplete="off">
    </div>
    <div class="form-group">
      <label class="form-label">Emoji</label>
      ${renderEmojiPickerHtml('🪴')}
    </div>
    <div class="form-group">
      <label class="form-label">Arrival date (optional)</label>
      <div class="date-input-wrapper" style="cursor:pointer" onclick="this.querySelector('input').click()"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-acquired-date"></div>
      <p class="form-hint">Track how long you've cared for it</p>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-new-plant">Save</button>
    </div>
  `);
}

async function handleSaveNewPlant() {
  const name = document.getElementById('sheet-plant-name')?.value?.trim();
  if (!name) { alert('Please enter a plant name.'); return; }

  const selectedGridEmoji = document.querySelector('#sheet .emoji-option.selected')?.dataset.emoji ?? '';
  const emoji = selectedGridEmoji || document.getElementById('sheet-plant-emoji')?.value?.trim() || '🪴';
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
  closeSheet();
  navigateTo('plant', newPlant.id);
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

// ============================================================
// NAVIGATION
// ============================================================

function navigateTo(view, plantId = null) {
  closeSheet();
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

  const action  = target.dataset.action;
  const plantId = target.dataset.plant;
  const taskId  = target.dataset.task;
  const noteId  = target.dataset.note;

  switch (action) {

    case 'login':
      handleLogin();
      break;

    case 'save-new-password':
      handlePasswordReset();
      break;

    case 'sign-out':
      supabaseClient.auth.signOut().then(() => renderLoginScreen());
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

    case 'go-home':
      navigateTo('home');
      break;

    case 'switch-tab': {
      activeTab = target.dataset.tab;
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
      markTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      showDoneToast(plantId, taskId, _doneName);
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

    case 'schedule-toggle-all':
      scheduleShowAll = target.checked;
      renderHome();
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
      if (plantToDelete && confirm(`Delete ${plantToDelete.name}? This will remove the plant and all its tasks. This cannot be undone.`)) {
        const deletedName = plantToDelete.name;
        await deletePlant(plantId);
        closeSheet();
        navigateTo('home');
        showToast(`🗑️ ${deletedName} deleted`);
      }
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
      renderEditPlantSheet(plantId);
      break;

    case 'add-note':
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
      renderAddPlantSheet();
      break;

    case 'add-task':
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
  }
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
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

    const saved = getActiveUser();
    if (saved) {
      activeUser = saved;
      navigateTo('home');
    } else {
      renderUserSelect();
    }
  });
});
