'use strict';

// Standalone admin backoffice for Plant Care.
// Reuses the main app's Supabase project (creds from repo-root .env via Vite envDir).

const supabaseClient = window.supabase.createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const app = document.getElementById('app');

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// ---- Auth gate ----

function renderLogin(errorMsg) {
  app.innerHTML = `
    <div class="login-screen">
      <h1>Plant Care — Admin</h1>
      <input id="email" type="email" placeholder="Email" autocomplete="email">
      <input id="password" type="password" placeholder="Password" autocomplete="current-password">
      <button class="btn" id="login-btn">Sign In</button>
      ${errorMsg ? `<p class="error">${esc(errorMsg)}</p>` : ''}
    </div>`;
  const submit = () => handleLogin();
  document.getElementById('login-btn').addEventListener('click', submit);
  app.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  document.getElementById('email').focus();
}

async function handleLogin() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) {
    renderLogin('Enter an email and password.');
    return;
  }
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    renderLogin(error.message);
    return;
  }
  await gate(data.user);
}

// Decide where to go after we have a user: admins reach the dashboard,
// everyone else is denied and signed out immediately.
async function gate(user) {
  if (!user || user.user_metadata?.is_admin !== true) {
    await supabaseClient.auth.signOut();
    renderAccessDenied();
    return;
  }
  await renderDashboard(user);
}

function renderAccessDenied() {
  app.innerHTML = `
    <div class="login-screen">
      <h1>Access denied</h1>
      <p class="error">This account is not an administrator.</p>
      <button class="btn" id="back-btn">Back to sign in</button>
    </div>`;
  document.getElementById('back-btn').addEventListener('click', () => renderLogin());
}

async function signOut() {
  // Reset all open-form UI state before clearing the session so nothing reopens
  // for the next user who signs in on this page (B93).
  ui.hhCreateOpen = false;
  ui.hhEditId = null;
  ui.hhError = '';
  ui.memberEditId = null;
  ui.memberAddFor = null;
  ui.memberError = '';
  await supabaseClient.auth.signOut();
  renderLogin();
}

// ---- Dashboard ----

// Loaded data + transient UI state. Re-derived from the DB on every reload().
let cachedHouseholds = [];
let cachedMembers = [];
const ui = {
  hhCreateOpen: false,   // "New household" form visible
  hhEditId: null,        // household id being renamed inline
  hhError: '',           // households-section error/warning message
  memberEditId: null,    // member id being edited inline
  memberAddFor: null,    // household id whose "Add member" form is open
  memberError: '',       // users-section error message
};

async function renderDashboard(user) {
  app.innerHTML = `
    <div class="topbar">
      <div>
        <h1>Plant Care — Admin</h1>
        <div class="who">${esc(user.email)}</div>
      </div>
      <button class="btn btn-secondary" id="signout-btn">Sign out</button>
    </div>
    <section id="households-section">
      <h2>Households</h2>
      <p class="muted">Loading…</p>
    </section>
    <section id="users-section">
      <h2>Users</h2>
      <p class="muted">Loading…</p>
    </section>`;
  document.getElementById('signout-btn').addEventListener('click', signOut);

  // Delegated handlers — bound once; section innerHTML is swapped on every render.
  for (const s of [document.getElementById('households-section'),
                   document.getElementById('users-section')]) {
    s.addEventListener('click', onAction);
    s.addEventListener('keydown', onKey);
  }
  document.getElementById('users-section').addEventListener('change', onChange);

  await reload();
}

async function reload() {
  const [hh, mem] = await Promise.all([
    supabaseClient.from('households')
      .select('id, name, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabaseClient.from('household_members')
      .select('*')
      .is('deleted_at', null),
  ]);
  ui.hhError = hh.error ? hh.error.message : '';
  ui.memberError = mem.error ? mem.error.message : '';
  cachedHouseholds = hh.data || [];
  cachedMembers = mem.data || [];
  renderHouseholds();
  renderUsers();
}

// ---- Households render ----

function renderHouseholds() {
  const section = document.getElementById('households-section');

  const toolbar = ui.hhCreateOpen
    ? `<div class="inline-form">
         <input id="hh-new-name" type="text" placeholder="Household name">
         <button class="btn btn-sm" data-action="hh-create-submit">Create</button>
         <button class="btn btn-sm btn-secondary" data-action="hh-create-cancel">Cancel</button>
       </div>`
    : `<button class="btn btn-sm" data-action="hh-create-open">New household</button>`;

  const errHtml = ui.hhError ? `<p class="error">${esc(ui.hhError)}</p>` : '';

  let tableHtml;
  if (cachedHouseholds.length === 0) {
    tableHtml = `<p class="empty">No households found.</p>`;
  } else {
    const body = cachedHouseholds.map(h => {
      const editing = ui.hhEditId === h.id;
      const nameCell = editing
        ? `<input id="hh-edit-name" type="text" value="${esc(h.name)}">`
        : esc(h.name);
      const actions = editing
        ? `<button class="btn btn-sm" data-action="hh-edit-confirm" data-id="${esc(h.id)}">Confirm</button>
           <button class="btn btn-sm btn-secondary" data-action="hh-edit-cancel">Cancel</button>`
        : `<button class="btn btn-sm btn-secondary" data-action="hh-edit" data-id="${esc(h.id)}">Edit</button>
           <button class="btn btn-sm btn-danger" data-action="hh-delete" data-id="${esc(h.id)}">Delete</button>`;
      return `<tr>
        <td>${nameCell}</td>
        <td>${esc(formatDate(h.created_at))}</td>
        <td class="actions">${actions}</td>
      </tr>`;
    }).join('');
    tableHtml = `<table>
      <thead><tr><th>Name</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  }

  section.innerHTML = `
    <h2>Households <span class="muted">(${cachedHouseholds.length})</span></h2>
    <div class="section-toolbar">${toolbar}</div>
    ${errHtml}
    ${tableHtml}`;

  if (ui.hhCreateOpen) document.getElementById('hh-new-name')?.focus();
  if (ui.hhEditId) document.getElementById('hh-edit-name')?.focus();
}

// ---- Users render ----

// Distinct users seen across household_members, deduped by user_id.
function knownUsers() {
  const map = new Map();
  for (const m of cachedMembers) {
    if (m.user_id && !map.has(m.user_id)) map.set(m.user_id, m.display_name);
  }
  return [...map.entries()].map(([user_id, display_name]) => ({ user_id, display_name }));
}

function roleSelect(id, current) {
  const val = current === 'admin' ? 'admin' : 'member';
  return `<select id="${id}">
    <option value="member"${val === 'member' ? ' selected' : ''}>member</option>
    <option value="admin"${val === 'admin' ? ' selected' : ''}>admin</option>
  </select>`;
}

function renderMemberRow(m, h) {
  if (ui.memberEditId === m.id) {
    return `<tr>
      <td><input id="mem-edit-name" type="text" value="${esc(m.display_name || '')}"></td>
      <td>
        <span class="color-field">
          <input type="color" id="mem-edit-color" value="${esc(m.color || defaultMemberColor(h.id))}" oninput="document.getElementById('mem-edit-color-hex').textContent = this.value">
          <span id="mem-edit-color-hex" class="color-hex">${esc(m.color || defaultMemberColor(h.id))}</span>
        </span>
      </td>
      <td>${roleSelect('mem-edit-role', m.role)}</td>
      <td class="actions">
        <button class="btn btn-sm" data-action="mem-edit-confirm" data-id="${esc(m.id)}">Confirm</button>
        <button class="btn btn-sm btn-secondary" data-action="mem-edit-cancel">Cancel</button>
      </td>
    </tr>`;
  }
  return `<tr>
    <td>${esc(m.display_name) || '<span class="muted">—</span>'}</td>
    <td class="swatch-cell">
      <span class="swatch" style="background:${esc(m.color || 'transparent')}"></span>
      <span class="mono">${esc(m.color || '—')}</span>
    </td>
    <td>${esc(m.role) || '<span class="muted">—</span>'}</td>
    <td class="actions">
      <button class="btn btn-sm btn-secondary" data-action="mem-edit" data-id="${esc(m.id)}">Edit</button>
      <button class="btn btn-sm btn-danger" data-action="mem-remove" data-id="${esc(m.id)}">Remove</button>
    </td>
  </tr>`;
}

// Fixed palette for new-member color defaults; first unused color in a household wins.
const MEMBER_COLOR_PALETTE = ['#4a7c59', '#283593', '#880e4f', '#e65100', '#4a148c', '#1a237e', '#006064', '#33691e'];

function defaultMemberColor(householdId) {
  const used = new Set(
    cachedMembers
      .filter(m => m.household_id === householdId)
      .map(m => (m.color || '').toLowerCase())
  );
  return MEMBER_COLOR_PALETTE.find(c => !used.has(c.toLowerCase())) || '#4a7c59';
}

function renderAddMemberForm(h) {
  const userOpts = knownUsers().map(u =>
    `<option value="${esc(u.user_id)}">${esc(u.display_name || '(no name)')} — ${esc(u.user_id)}</option>`
  ).join('');
  return `<div class="inline-form">
    <label class="field"><span>User</span>
      <select id="mem-add-user"><option value="">Select user…</option>${userOpts}</select>
    </label>
    <label class="field"><span>Display name</span>
      <input id="mem-add-name" type="text" placeholder="Display name">
    </label>
    <label class="field"><span>Color</span>
      <span class="color-field">
        <input type="color" id="mem-add-color" value="${defaultMemberColor(h.id)}" oninput="document.getElementById('mem-add-color-hex').textContent = this.value">
        <span id="mem-add-color-hex" class="color-hex">${defaultMemberColor(h.id)}</span>
      </span>
    </label>
    <label class="field"><span>Role</span>
      ${roleSelect('mem-add-role', 'member')}
    </label>
    <button class="btn btn-sm" data-action="mem-add-submit" data-hh="${esc(h.id)}">Add</button>
    <button class="btn btn-sm btn-secondary" data-action="mem-add-cancel">Cancel</button>
  </div>`;
}

function renderUsers() {
  const section = document.getElementById('users-section');
  const errHtml = ui.memberError ? `<p class="error">${esc(ui.memberError)}</p>` : '';

  let blocks;
  if (cachedHouseholds.length === 0) {
    blocks = `<p class="empty">No households.</p>`;
  } else {
    blocks = cachedHouseholds.map(h => {
      const mem = cachedMembers.filter(m => m.household_id === h.id);
      const addControl = ui.memberAddFor === h.id
        ? renderAddMemberForm(h)
        : `<button class="btn btn-sm" data-action="mem-add-open" data-hh="${esc(h.id)}">Add member</button>`;
      const rows = mem.length
        ? mem.map(m => renderMemberRow(m, h)).join('')
        : `<tr><td colspan="4" class="empty">No members.</td></tr>`;
      return `<div class="hh-block">
        <div class="hh-block-head">
          <h3>${esc(h.name)} <span class="muted">(${mem.length})</span></h3>
          ${addControl}
        </div>
        <table>
          <thead><tr><th>Display name</th><th>Color</th><th>Role</th><th>Actions</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }).join('');
  }

  section.innerHTML = `
    <h2>Users <span class="muted">(${cachedMembers.length})</span></h2>
    ${errHtml}
    ${blocks}`;

  if (ui.memberAddFor) document.getElementById('mem-add-user')?.focus();
  if (ui.memberEditId) document.getElementById('mem-edit-name')?.focus();
}

// ---- Event handling ----

function onAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id, hh } = el.dataset;
  switch (action) {
    case 'hh-create-open':   ui.hhError = ''; ui.hhCreateOpen = true; renderHouseholds(); break;
    case 'hh-create-cancel': ui.hhCreateOpen = false; renderHouseholds(); break;
    case 'hh-create-submit': createHousehold(); break;
    case 'hh-edit':          ui.hhError = ''; ui.hhEditId = id; renderHouseholds(); break;
    case 'hh-edit-cancel':   ui.hhEditId = null; renderHouseholds(); break;
    case 'hh-edit-confirm':  confirmRenameHousehold(id); break;
    case 'hh-delete':        deleteHousehold(id); break;
    case 'mem-edit':         ui.memberError = ''; ui.memberEditId = id; renderUsers(); break;
    case 'mem-edit-cancel':  ui.memberEditId = null; renderUsers(); break;
    case 'mem-edit-confirm': confirmEditMember(id); break;
    case 'mem-remove':       removeMember(id); break;
    case 'mem-add-open':     ui.memberError = ''; ui.memberAddFor = hh; renderUsers(); break;
    case 'mem-add-cancel':   ui.memberAddFor = null; renderUsers(); break;
    case 'mem-add-submit':   addMember(hh); break;
  }
}

function onKey(e) {
  if (e.key !== 'Enter' && e.key !== 'Escape') return;
  const scope = e.target.closest('tr, .inline-form');
  if (!scope) return;
  const selector = e.key === 'Enter'
    ? '[data-action$="-confirm"], [data-action$="-submit"]'
    : '[data-action$="-cancel"]';
  const btn = scope.querySelector(selector);
  if (btn) { e.preventDefault(); btn.click(); }
}

// Prefill the display-name field when a known user is picked in the add form.
function onChange(e) {
  if (e.target.id !== 'mem-add-user') return;
  const u = knownUsers().find(x => x.user_id === e.target.value);
  const nameInput = document.getElementById('mem-add-name');
  if (u && nameInput && !nameInput.value.trim()) nameInput.value = u.display_name || '';
}

// ---- Household mutations ----

// supabase-js returns { data, error } for query failures, but transport-level
// failures reject the promise. These mutation handlers are invoked fire-and-forget
// from onAction(), so an unguarded rejection becomes an uncaught promise error and
// renders nothing. Each handler wraps its body in try/catch so a throw surfaces as
// a visible red message just like a returned error (B91).
//
// On success each handler updates the in-memory cache directly and re-renders
// BEFORE calling reload() (B92). reload() re-queries under the admin's JWT, which
// is subject to RLS: a freshly-created household has no membership row, so the
// re-query may not return it and a blind reload() would render a table that omits
// the row the insert just created. The optimistic local update guarantees the UI
// reflects the change immediately; reload() then reconciles with the server.

const byCreated = (a, b) => (a.created_at || '').localeCompare(b.created_at || '');

async function createHousehold() {
  ui.hhError = '';
  const name = document.getElementById('hh-new-name')?.value.trim();
  if (!name) { ui.hhError = 'Enter a household name.'; renderHouseholds(); return; }
  const id = crypto.randomUUID();
  const created_at = new Date().toISOString();
  try {
    const { error } = await supabaseClient.from('households').insert({ id, name, created_at });
    if (error) { ui.hhError = error.message; renderHouseholds(); return; }
    ui.hhCreateOpen = false;
    const newRow = { id, name, created_at };
    cachedHouseholds = [...cachedHouseholds, newRow].sort(byCreated);
    renderHouseholds();
    await reload();
    // If RLS hid the new (membership-less) row from the re-query, keep it visible.
    if (!cachedHouseholds.some(h => h.id === id)) {
      cachedHouseholds = [...cachedHouseholds, newRow].sort(byCreated);
      renderHouseholds();
    }
  } catch (e) {
    ui.hhError = e?.message || String(e);
    renderHouseholds();
  }
}

async function confirmRenameHousehold(id) {
  ui.hhError = '';
  const name = document.getElementById('hh-edit-name')?.value.trim();
  if (!name) { ui.hhError = 'Name cannot be empty.'; renderHouseholds(); return; }
  try {
    const { error } = await supabaseClient.from('households').update({ name }).eq('id', id);
    if (error) { ui.hhError = error.message; renderHouseholds(); return; }
    ui.hhEditId = null;
    const target = cachedHouseholds.find(x => x.id === id);
    if (target) target.name = name;
    renderHouseholds();
    await reload();
  } catch (e) {
    ui.hhError = e?.message || String(e);
    renderHouseholds();
  }
}

async function deleteHousehold(id) {
  ui.hhError = '';
  const h = cachedHouseholds.find(x => x.id === id);
  const count = cachedMembers.filter(m => m.household_id === id).length;
  if (count > 0) {
    ui.hhError = `This household has ${count} member${count === 1 ? '' : 's'}. Remove them first.`;
    renderHouseholds();
    return;
  }
  if (!window.confirm(`Delete ${h?.name ?? 'this household'}? This cannot be undone.`)) return;
  try {
    const { error } = await supabaseClient.from('households')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { ui.hhError = error.message; renderHouseholds(); return; }
    cachedHouseholds = cachedHouseholds.filter(x => x.id !== id);
    renderHouseholds();
    await reload();
  } catch (e) {
    ui.hhError = e?.message || String(e);
    renderHouseholds();
  }
}

// ---- Member mutations ----

async function addMember(hhId) {
  ui.memberError = '';
  const userId = document.getElementById('mem-add-user')?.value;
  const name = document.getElementById('mem-add-name')?.value.trim();
  const color = document.getElementById('mem-add-color')?.value.trim();
  const role = document.getElementById('mem-add-role')?.value;
  if (!userId) { ui.memberError = 'Select a user.'; renderUsers(); return; }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    ui.memberError = 'Color must be a valid hex value, e.g. #4a7c59.';
    renderUsers();
    return;
  }
  try {
    const { error } = await supabaseClient.from('household_members').insert({
      household_id: hhId,
      user_id: userId,
      display_name: name || null,
      color,
      role,
    });
    if (error) { ui.memberError = error.message; renderUsers(); return; }
    ui.memberAddFor = null;
    // Temporary id for immediate display; reload() replaces it with the real row.
    cachedMembers = [...cachedMembers, {
      id: crypto.randomUUID(),
      household_id: hhId,
      user_id: userId,
      display_name: name || null,
      color: color || null,
      role,
    }];
    renderUsers();
    await reload();
  } catch (e) {
    ui.memberError = e?.message || String(e);
    renderUsers();
  }
}

async function confirmEditMember(id) {
  ui.memberError = '';
  const name = document.getElementById('mem-edit-name')?.value.trim();
  const color = document.getElementById('mem-edit-color')?.value.trim();
  const role = document.getElementById('mem-edit-role')?.value;
  try {
    const { error } = await supabaseClient.from('household_members').update({
      display_name: name || null,
      color: color || null,
      role,
    }).eq('id', id);
    if (error) { ui.memberError = error.message; renderUsers(); return; }
    ui.memberEditId = null;
    const target = cachedMembers.find(x => x.id === id);
    if (target) { target.display_name = name || null; target.color = color || null; target.role = role; }
    renderUsers();
    await reload();
  } catch (e) {
    ui.memberError = e?.message || String(e);
    renderUsers();
  }
}

async function removeMember(id) {
  ui.memberError = '';
  const m = cachedMembers.find(x => x.id === id);
  const h = cachedHouseholds.find(x => x.id === m?.household_id);
  if (!window.confirm(`Remove ${m?.display_name || 'this member'} from ${h?.name || 'this household'}?`)) return;
  try {
    const { error } = await supabaseClient.from('household_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { ui.memberError = error.message; renderUsers(); return; }
    ui.memberEditId = null;
    cachedMembers = cachedMembers.filter(x => x.id !== id);
    renderUsers();
    await reload();
  } catch (e) {
    ui.memberError = e?.message || String(e);
    renderUsers();
  }
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ---- Boot: honor existing session ----

(async function init() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session?.user) {
    await gate(session.user);
  } else {
    renderLogin();
  }
})();
