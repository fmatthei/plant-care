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

const CUSTOM_ICONS = ['🌿', '💦', '🧴', '🌊', '✂️', '🔍', '🪴', '🐛', '🔄', '🌞', '🧪', '🌸', '🍃', '🌼', '🌡️', '🪥'];

const USERS = {
  Matu: { color: '#283593' },
  Vale: { color: '#880e4f' },
};

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DEFAULT_PLANTS = [
  {
    id: 'mandarin',
    name: 'Mandarin Tree',
    emoji: '🍊',
    dateTransplanted: '',
    tasks: [
      { id: 'normal-water', recurrenceType: 'interval', frequencyDays: 2,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'refill-pot',   recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'fertilize',    recurrenceType: 'interval', frequencyDays: 14, weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'check',        recurrenceType: 'interval', frequencyDays: 3,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: 'Check leaf color, pests, and soil condition' },
    ],
    healthNotes: [],
    careLog: [],
  },
  {
    id: 'bougainvillea',
    name: 'Bougainvillea',
    emoji: '🌺',
    dateTransplanted: '',
    tasks: [
      { id: 'normal-water', recurrenceType: 'interval', frequencyDays: 3,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'refill-pot',   recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'fertilize',    recurrenceType: 'interval', frequencyDays: 14, weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: '' },
      { id: 'check',        recurrenceType: 'interval', frequencyDays: 7,  weekdays: [], lastDone: null, nextDueOverride: null, paused: false, owner: 'Matu', note: 'Check for blooms and overall health' },
    ],
    healthNotes: [],
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
let activeUser = null;
let activeTab = 'plants';
let scheduleShowAll = false;
let membersCache = []; // household_members rows: { id, display_name }
let householdId = null;

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
      .select('id, display_name')
      .eq('household_id', householdId),
  ]);
  if (!plantRows) return;

  // Cache members for use in write operations
  membersCache = memberRows ?? [];

  // Build a map from household_members.id → display_name for resolving task owners
  const ownerMap = {};
  for (const m of membersCache) {
    ownerMap[m.id] = m.display_name;
  }

  // 4. Fetch tasks and care log entries for all plants in parallel
  const [taskResults, careLogResults] = await Promise.all([
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
  ]);

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
      dateTransplanted: plantRow.date_transplanted ?? '',
      tasks,
      healthNotes:      [],
      careLog,
    };
  });
}

// ============================================================
// DATE UTILITIES
// ============================================================

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Returns b - a in whole days
function daysBetween(a, b) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((new Date(b) - new Date(a)) / msPerDay);
}

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// Returns the nearest upcoming date (today or future) matching one of the given weekday numbers (0=Sun)
function nextWeekdayOccurrence(days) {
  if (!days || days.length === 0) return todayStr();
  const todayDow = new Date(todayStr() + 'T12:00:00').getDay();
  for (let d = 0; d <= 6; d++) {
    if (days.includes((todayDow + d) % 7)) return addDays(todayStr(), d);
  }
  return todayStr();
}

// Computes the next due date for a task (ignoring pause state)
function computeNextDue(task) {
  if (task.nextDueOverride) return task.nextDueOverride;
  const recType = task.recurrenceType ?? 'interval';
  if (recType === 'weekdays') {
    return nextWeekdayOccurrence(task.weekdays ?? []);
  }
  if (!task.lastDone) return todayStr();
  return addDays(task.lastDone, task.frequencyDays);
}

// Positive = days remaining, 0 = due today, negative = overdue
function daysUntilDue(task) {
  return daysBetween(todayStr(), computeNextDue(task));
}

function isDue(task) {
  if (task.paused) return false;
  return daysUntilDue(task) <= 0;
}

function dueLabelAndClass(task) {
  const days = daysUntilDue(task);
  const manual = task.nextDueOverride ? ' (manual)' : '';
  const recType = task.recurrenceType ?? 'interval';
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
  saveData();

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
  saveData();

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
  saveData();

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
  saveData();

  const dbUpdates = {};

  if ('lastDone'        in updates) dbUpdates.last_done         = updates.lastDone;
  if ('nextDueOverride' in updates) dbUpdates.next_due_override = updates.nextDueOverride;
  if ('paused'          in updates) dbUpdates.paused            = updates.paused;
  if ('note'            in updates) dbUpdates.note              = updates.note;

  if ('owner' in updates) {
    const member = membersCache.find(m => m.display_name === updates.owner);
    dbUpdates.owner_id = member?.id ?? null;
  }

  const recurrenceFields = ['recurrenceType', 'frequencyDays', 'recurrenceUnit', 'weekdays'];
  if (recurrenceFields.some(f => f in updates)) {
    dbUpdates.recurrence = {
      type:  task.recurrenceType,
      every: task.frequencyDays,
      unit:  task.recurrenceUnit ?? 'days',
      days:  task.weekdays ?? [],
    };
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
  if (task) { task.paused = true; saveData(); }

  await supabaseClient
    .from('tasks')
    .update({ paused: true })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('pauseTask error:', error); });
}

async function resumeTask(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (task) { task.paused = false; saveData(); }

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
  saveData();

  await supabaseClient
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)
    .then(({ error }) => { if (error) console.error('deleteTask error:', error); });
}

function addHealthNote(plantId, text, author) {
  const plant = getPlant(plantId);
  if (!plant || !text.trim()) return;
  plant.healthNotes.unshift({ id: uid(), date: todayStr(), author, text: text.trim() });
  saveData();
}

function editHealthNote(plantId, noteId, text) {
  const note = getPlant(plantId)?.healthNotes.find(n => n.id === noteId);
  if (!note || !text.trim()) return;
  note.text = text.trim();
  saveData();
}

function deleteHealthNote(plantId, noteId) {
  const plant = getPlant(plantId);
  if (!plant) return;
  plant.healthNotes = plant.healthNotes.filter(n => n.id !== noteId);
  saveData();
}

function updatePlantInfo(plantId, updates) {
  const plant = getPlant(plantId);
  if (!plant) return;
  Object.assign(plant, updates);
  saveData();
}

// ============================================================
// RENDER: HOME
// ============================================================

function renderHome() {
  let html = `
    <div class="app-header">
      <h1>Plant Care</h1>
      <div class="header-right">
        <span class="date-label">${todayFormatted()}</span>
        <button class="user-indicator" data-action="switch-user">&#128100; ${escapeHtml(activeUser)}</button>
        <button class="btn-sign-out" data-action="sign-out">Sign Out</button>
      </div>
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

    html += `<button class="btn-add-task-detail" data-action="add-plant">&#43; Add Plant</button>`;
    html += '<div class="plants-list">';

    for (const plant of plants) {
      const dueTasks = plant.tasks.filter(isDue);

      html += `
    <div class="plant-card" data-action="open-plant" data-plant="${plant.id}">
      <div class="plant-card-top">
        <span class="plant-card-emoji">${plant.emoji}</span>
        <div class="plant-card-meta">
          <h2>${escapeHtml(plant.name)}</h2>
          <span class="transplant-info">${plant.dateTransplanted ? 'Transplanted ' + formatDate(plant.dateTransplanted) : 'Transplant date not set'}</span>
        </div>
        <span class="plant-card-arrow">&#8250;</span>
      </div>
      <div class="due-tasks-row">`;

      if (dueTasks.length === 0) {
        html += `<span class="all-good-badge">&#10003; All good</span>`;
      } else {
        for (const task of dueTasks) {
          const cfg = getTaskConfig(task);
          html += `<span class="task-due-badge ${cfg.type}">${cfg.icon} ${cfg.name}</span>`;
        }
      }

      html += `</div></div>`;
    }

    html += '</div>';

    html += `
    <div class="data-footer">
      <button class="btn btn-ghost" data-action="export-data">&#8681; Export Backup</button>
      <button class="btn btn-ghost" data-action="import-data">&#8679; Import Backup</button>
    </div>`;
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
      : `<button class="sched-done-btn" data-action="schedule-mark-done" data-plant="${plant.id}" data-task="${task.id}" title="Mark done">✅</button>`;
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
        : `<button class="sched-done-btn" data-action="schedule-mark-done" data-plant="${plant.id}" data-task="${task.id}" title="Mark done">✅</button>`;
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

  let html = `
  <div class="page-header">
    <button class="back-btn" data-action="go-home">&#8249;</button>
    <div class="page-header-info">
      <h1>${escapeHtml(plant.name)}</h1>
    </div>
    <span class="page-header-emoji">${plant.emoji}</span>
  </div>
  <div class="plant-detail">`;

  // Plant Info
  html += `
  <div class="section">
    <div class="section-header">
      <span class="section-title">Plant Info</span>
      <button class="section-action" data-action="edit-plant" data-plant="${plant.id}">Edit</button>
    </div>
    <div class="info-card">
      <span class="info-card-label">&#128197; Date Transplanted</span>
      <span class="info-card-value">${plant.dateTransplanted ? formatDate(plant.dateTransplanted) : '\u2014'}</span>
    </div>
  </div>`;

  // Tasks
  html += `
  <div class="section">
    <div class="section-header">
      <span class="section-title">Care Tasks</span>
    </div>
    <button class="btn-add-task-detail" data-action="add-task" data-plant="${plant.id}">&#43; Add Task</button>
    <div class="task-list">`;

  for (const task of plant.tasks) {
    html += renderTaskCard(plant.id, task);
  }

  html += `</div></div>`;

  // Health Notes
  html += `
  <div class="section">
    <div class="section-header">
      <span class="section-title">Health Notes</span>
      <button class="section-action" data-action="add-health-note" data-plant="${plant.id}">+ Add</button>
    </div>`;

  if (plant.healthNotes.length === 0) {
    html += `<div class="empty-state">No health notes yet.</div>`;
  } else {
    html += `<div class="health-note-list">`;
    for (const note of plant.healthNotes) {
      html += renderHealthNoteCard(plant.id, note);
    }
    html += `</div>`;
  }

  html += `</div>`;

  // Care Log
  html += `
  <div class="section" style="margin-bottom:16px">
    <div class="section-header">
      <span class="section-title">Care Log</span>
    </div>`;

  if (plant.careLog.length === 0) {
    html += `<div class="empty-state">No activity logged yet.</div>`;
  } else {
    html += `<div class="care-log-list">`;
    for (const entry of plant.careLog.slice(0, 20)) {
      html += renderCareLogEntry(entry);
    }
    html += `</div>`;
  }

  html += `</div></div>`;

  document.getElementById('app').innerHTML = html;
  window.scrollTo(0, 0);
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
          <button class="btn btn-ghost" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">Edit</button>
        </div>`;
  } else {
    const doneToday = task.lastDone === todayStr();
    html += `
        <div class="task-actions">
          ${doneToday
            ? `<button class="btn btn-warning" data-action="undo-mark-done" data-plant="${plantId}" data-task="${task.id}">&#8630; Undo</button>`
            : `<button class="btn btn-primary" data-action="mark-done" data-plant="${plantId}" data-task="${task.id}">&#10003; Done</button>`
          }
          <button class="btn btn-secondary" data-action="reassign-task" data-plant="${plantId}" data-task="${task.id}">&#8644; ${escapeHtml(otherOwner)}</button>
          <button class="btn btn-ghost" data-action="edit-task" data-plant="${plantId}" data-task="${task.id}">Edit</button>
        </div>`;
  }

  html += `
      </div>
    </div>
  </div>`;

  return html;
}

function renderHealthNoteCard(plantId, note) {
  const authorCls = note.author.toLowerCase();
  return `
  <div class="health-note-card">
    <div class="health-note-header">
      <span class="health-note-meta">
        <span class="author-label ${authorCls}">${escapeHtml(note.author)}</span>
        &middot; ${formatDateShort(note.date)}
      </span>
      <div class="health-note-btns">
        <button class="icon-btn" data-action="edit-health-note" data-plant="${plantId}" data-note="${note.id}" title="Edit">&#9998;</button>
        <button class="icon-btn" data-action="delete-health-note" data-plant="${plantId}" data-note="${note.id}" title="Delete">&#10005;</button>
      </div>
    </div>
    <div class="health-note-text">${escapeHtml(note.text)}</div>
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

function renderEditTaskSheet(plantId, taskId) {
  const task = getTask(plantId, taskId);
  if (!task) return;
  const cfg = getTaskConfig(task);
  const isPaused = task.paused ?? false;
  const recType = task.recurrenceType ?? 'interval';

  state.sheetMode = 'edit-task';
  state.sheetData = { plantId, taskId };

  const matuSel = task.owner === 'Matu' ? 'selected' : '';
  const valeSel = task.owner === 'Vale' ? 'selected' : '';

  const weekdayBtns = WEEKDAY_NAMES.map((name, i) => {
    const sel = (task.weekdays ?? []).includes(i) ? 'selected' : '';
    return `<button class="weekday-btn ${sel}" data-action="sheet-toggle-weekday" data-day="${i}">${name}</button>`;
  }).join('');

  openSheet(`
    <div class="sheet-title">${cfg.icon} ${cfg.name}</div>

    <div class="form-group">
      <label class="form-label">Recurrence</label>
      <div class="recurrence-type-toggle">
        <div class="recurrence-option ${recType === 'interval' ? 'selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="interval">Every X days</div>
        <div class="recurrence-option ${recType === 'weekdays' ? 'selected' : ''}" data-action="sheet-toggle-recurrence" data-rtype="weekdays">Days of week</div>
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
      <label class="form-label">Override Next Due Date</label>
      <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-next-due-override" value="${task.nextDueOverride ?? ''}"></div>
      <div class="form-hint">Leave empty to use automatic calculation</div>
    </div>

    <div class="form-group">
      <label class="form-label">Owner</label>
      <div class="owner-toggle">
        <div class="owner-option matu ${matuSel}" data-action="sheet-set-owner" data-owner="Matu">Matu</div>
        <div class="owner-option vale ${valeSel}" data-action="sheet-set-owner" data-owner="Vale">Vale</div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">Note / Reminder</label>
      <textarea class="form-textarea" id="sheet-note" placeholder="e.g. Check for pests, rotate pot...">${escapeHtml(task.note ?? '')}</textarea>
    </div>

    <div class="form-group">
      <label class="form-label">Last Done</label>
      <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-last-done" value="${task.lastDone ?? ''}"></div>
    </div>

    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-task">Save</button>
    </div>

    <div class="sheet-divider"></div>
    <div class="sheet-danger">
      <button class="btn ${isPaused ? 'btn-secondary' : 'btn-warning'}" data-action="${isPaused ? 'resume-task' : 'pause-task'}" data-plant="${plantId}" data-task="${taskId}">
        ${isPaused ? '&#9654; Resume Task' : '&#9646;&#9646; Pause Task'}
      </button>
      <button class="btn btn-danger" data-action="delete-task" data-plant="${plantId}" data-task="${taskId}">
        Delete Task
      </button>
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

  const ownerOptions = Object.keys(USERS).map(name => {
    const sel = name === defaultOwner ? 'selected' : '';
    const cls = name.toLowerCase();
    return `<div class="owner-option ${cls} ${sel}" data-action="sheet-set-owner" data-owner="${escapeHtml(name)}">${escapeHtml(name)}</div>`;
  }).join('');

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

  openSheet(`
    ${titleHtml}
    ${customFields}
    <div class="form-group">
      <label class="form-label">Recurrence</label>
      <div class="recurrence-type-toggle">
        <div class="recurrence-option selected" data-action="sheet-toggle-recurrence" data-rtype="interval">Every X days</div>
        <div class="recurrence-option" data-action="sheet-toggle-recurrence" data-rtype="weekdays">Days of week</div>
      </div>
    </div>
    <div id="recurrence-container" class="recurrence-interval">
      <div class="recurrence-interval-section form-group">
        <div class="freq-row">
          <input type="number" class="form-input" id="sheet-frequency" min="1" max="365" value="7">
          <span>days between tasks</span>
        </div>
      </div>
      <div class="recurrence-weekdays-section form-group">
        <div class="weekday-picker">${weekdayBtns}</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Owner</label>
      <div class="owner-toggle">
        ${ownerOptions}
      </div>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="add-task-back" data-plant="${plantId}">&#8592; Back</button>
      <button class="btn btn-primary" data-action="sheet-save-new-task">Add Task</button>
    </div>
  `);
}

function renderHealthNoteSheet(plantId, noteId = null) {
  const plant = getPlant(plantId);
  if (!plant) return;
  const existing = noteId ? plant.healthNotes.find(n => n.id === noteId) : null;
  const isEdit = !!existing;

  state.sheetMode = 'health-note';
  state.sheetData = { plantId, noteId };

  const matuSel = (!existing || existing.author === 'Matu') ? 'selected' : '';
  const valeSel = existing?.author === 'Vale' ? 'selected' : '';

  openSheet(`
    <div class="sheet-title">${isEdit ? 'Edit' : 'Add'} Health Note</div>
    <div class="form-group">
      <label class="form-label">Author</label>
      <div class="owner-toggle">
        <div class="owner-option matu ${matuSel}" data-action="sheet-set-owner" data-owner="Matu">Matu</div>
        <div class="owner-option vale ${valeSel}" data-action="sheet-set-owner" data-owner="Vale">Vale</div>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Note</label>
      <textarea class="form-textarea" id="sheet-note-text" placeholder="Describe what you observed..." style="min-height:110px">${escapeHtml(existing?.text ?? '')}</textarea>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-health-note">Save</button>
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
      <input type="text" class="form-input" id="sheet-plant-emoji" value="${plant.emoji}" style="font-size:22px;text-align:center;letter-spacing:4px">
    </div>
    <div class="form-group">
      <label class="form-label">Date Transplanted</label>
      <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-transplant-date" value="${plant.dateTransplanted ?? ''}"></div>
    </div>
    <div class="sheet-actions">
      <button class="btn btn-ghost" data-action="sheet-cancel">Cancel</button>
      <button class="btn btn-primary" data-action="sheet-save-plant">Save</button>
    </div>
  `);
}

async function handleSavePlant() {
  const { plantId: pid } = state.sheetData;
  const plant = getPlant(pid);
  if (!plant) return;

  const name  = document.getElementById('sheet-plant-name')?.value?.trim();
  const emoji = document.getElementById('sheet-plant-emoji')?.value?.trim();
  const date  = document.getElementById('sheet-transplant-date')?.value;

  const localUpdates = {
    name:             name  || plant.name,
    emoji:            emoji || plant.emoji,
    dateTransplanted: date  || null,
  };

  updatePlantInfo(pid, localUpdates);

  const dbUpdates = {
    name:             localUpdates.name,
    emoji:            localUpdates.emoji,
    date_transplanted: localUpdates.dateTransplanted,
  };

  await supabaseClient
    .from('plants')
    .update(dbUpdates)
    .eq('id', pid)
    .then(({ error }) => { if (error) console.error('handleSavePlant error:', error); });

  closeSheet();
  renderPlantDetail(pid);
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
      <input type="text" class="form-input" id="sheet-plant-emoji" value="🪴" style="font-size:22px;text-align:center;letter-spacing:4px">
    </div>
    <div class="form-group">
      <label class="form-label">Date Transplanted</label>
      <div class="date-input-wrapper"><span class="date-icon">📅</span><input type="date" class="form-input" id="sheet-transplant-date"></div>
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

  const emoji = document.getElementById('sheet-plant-emoji')?.value?.trim() || '🪴';
  const dateTransplanted = document.getElementById('sheet-transplant-date')?.value || null;
  const sortOrder = plants.length + 1;

  const { data: inserted, error } = await supabaseClient
    .from('plants')
    .insert({
      household_id:      householdId,
      name,
      emoji,
      date_transplanted: dateTransplanted,
      sort_order:        sortOrder,
    })
    .select()
    .single();

  if (error) {
    console.error('handleSaveNewPlant: Supabase insert error:', error);
  }

  const newPlant = {
    id:               inserted?.id ?? uid(),
    name,
    emoji,
    dateTransplanted: dateTransplanted ?? '',
    tasks:            [],
    healthNotes:      [],
    careLog:          [],
  };

  plants.push(newPlant);
  saveData();
  closeSheet();
  navigateTo('plant', newPlant.id);
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
  const recType = container?.classList.contains('recurrence-weekdays') ? 'weekdays' : 'interval';
  let frequencyDays = 7;
  let weekdays = [];

  if (recType === 'interval') {
    const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
    if (!freq || freq < 1) { alert('Please enter a valid frequency (minimum 1 day).'); return; }
    frequencyDays = freq;
  } else {
    weekdays = [...document.querySelectorAll('#sheet .weekday-btn.selected')].map(b => parseInt(b.dataset.day));
    if (weekdays.length === 0) { alert('Please select at least one day of the week.'); return; }
  }

  const selectedOwner = document.querySelector('#sheet .owner-option.selected');
  const owner = selectedOwner?.dataset.owner ?? Object.keys(USERS)[0];

  const plant = getPlant(pid);
  if (!plant) return;

  const ownerMember = membersCache.find(m => m.display_name === owner);
  const sortOrder = plant.tasks.length + 1;

  const supabaseRow = {
    plant_id:   pid,
    name,
    icon,
    type,
    recurrence: {
      type:  recType,
      every: frequencyDays,
      unit:  'days',
      days:  weekdays,
    },
    owner_id:   ownerMember?.id ?? null,
    paused:     false,
    note:       '',
    sort_order: sortOrder,
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
    nextDueOverride: null,
    paused: false,
    owner,
    note: '',
    ...(isCustom ? { customName, customIcon } : {}),
  };

  plant.tasks.push(newTask);
  saveData();
  closeSheet();
  navigateTo('plant', pid);
}

// ============================================================
// NAVIGATION
// ============================================================

function navigateTo(view, plantId = null) {
  closeSheet();
  state.view = view;
  state.plantId = plantId;
  if (view === 'home') renderHome();
  else if (view === 'plant') renderPlantDetail(plantId);
}

// ============================================================
// EVENT HANDLING
// ============================================================

function handleEvent(e) {
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

    case 'sign-out':
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

    case 'mark-done':
      markTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'undo-mark-done':
      undoMarkTaskDone(plantId, taskId);
      renderPlantDetail(state.plantId);
      break;

    case 'schedule-mark-done':
      markTaskDone(plantId, taskId);
      renderHome();
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

    case 'delete-task':
      if (confirm('Permanently delete this task? This cannot be undone.')) {
        deleteTask(plantId, taskId);
        closeSheet();
        renderPlantDetail(state.plantId);
      }
      break;

    case 'edit-task':
      renderEditTaskSheet(plantId, taskId);
      break;

    case 'edit-plant':
      renderEditPlantSheet(plantId);
      break;

    case 'add-health-note':
      renderHealthNoteSheet(plantId);
      break;

    case 'edit-health-note':
      renderHealthNoteSheet(plantId, noteId);
      break;

    case 'delete-health-note':
      if (confirm('Delete this health note?')) {
        deleteHealthNote(plantId, noteId);
        renderPlantDetail(state.plantId);
      }
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
      document.querySelectorAll('#sheet .owner-option').forEach(btn => btn.classList.remove('selected'));
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
      const recType = container?.classList.contains('recurrence-weekdays') ? 'weekdays' : 'interval';

      let frequencyDays = getTask(pid, tid)?.frequencyDays ?? 1;
      let weekdays = [];

      if (recType === 'interval') {
        const freq = parseInt(document.getElementById('sheet-frequency')?.value ?? '');
        if (!freq || freq < 1) { alert('Please enter a valid frequency (minimum 1 day).'); return; }
        frequencyDays = freq;
      } else {
        weekdays = [...document.querySelectorAll('#sheet .weekday-btn.selected')].map(b => parseInt(b.dataset.day));
        if (weekdays.length === 0) { alert('Please select at least one day of the week.'); return; }
      }

      const selectedOwner = document.querySelector('#sheet .owner-option.selected');
      const lastDoneVal = document.getElementById('sheet-last-done')?.value;
      const overrideVal = document.getElementById('sheet-next-due-override')?.value;

      updateTask(pid, tid, {
        recurrenceType: recType,
        frequencyDays,
        weekdays,
        note: document.getElementById('sheet-note')?.value ?? '',
        owner: selectedOwner?.dataset.owner ?? 'Matu',
        lastDone: lastDoneVal || null,
        nextDueOverride: overrideVal || null,
      });
      closeSheet();
      renderPlantDetail(pid);
      break;
    }

    case 'sheet-save-health-note': {
      const { plantId: pid, noteId: nid } = state.sheetData;
      const text = document.getElementById('sheet-note-text')?.value?.trim();
      if (!text) { alert('Please enter a note.'); return; }
      const selectedOwner = document.querySelector('#sheet .owner-option.selected');
      if (nid) {
        editHealthNote(pid, nid, text);
      } else {
        addHealthNote(pid, text, selectedOwner?.dataset.owner ?? 'Matu');
      }
      closeSheet();
      renderPlantDetail(pid);
      break;
    }

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

    case 'sheet-save-plant':
      handleSavePlant();
      break;
  }
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('app').addEventListener('click', handleEvent);
  document.getElementById('sheet').addEventListener('click', handleEvent);
  document.getElementById('overlay').addEventListener('click', closeSheet);

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    loadData();
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
