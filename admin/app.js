'use strict';

// Standalone admin backoffice for Plant Care.
// Reuses the main app's Supabase project (creds from repo-root .env via Vite envDir).

const supabaseClient = window.supabase.createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

const app = document.getElementById('app');

// Throwaway household that dev seeds are allowed to target (mirrors
// SEED_ALLOWED_HOUSEHOLDS in the main app). Display-only here.
const SEED_ALLOWED_HOUSEHOLD_ID = 'b3b5aeb6-ddcc-47c2-bb5e-b2e67d59f635';

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
// everyone else is denied and signed out immediately. is_admin is read from
// app_metadata — the single source the main app (src/app.js) and the
// set-admin-status / reset-household Edge Functions all trust.
async function gate(user) {
  if (!user || user.app_metadata?.is_admin !== true) {
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
// { [user_id]: boolean } — is_admin read via the set-admin-status GET endpoint
// (the anon key cannot read auth.users directly). Refreshed in reload().
let adminStatusMap = {};
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
    </section>
    <section id="devinfo-section" style="margin-top:32px;padding:16px;border:1px dashed #c8c8c8;border-radius:8px;background:#f5f5f5;color:#666;">
      <h2 style="color:#666;">Dev Info</h2>
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
  await loadAdminStatus();
  renderHouseholds();
  renderUsers();
  renderDevInfo();
}

// Fetch is_admin for every loaded member via the gated GET endpoint. Best-effort:
// on failure the map is left empty so badges simply don't render (no hard error).
async function loadAdminStatus() {
  const userIds = [...new Set(cachedMembers.map(m => m.user_id).filter(Boolean))];
  if (userIds.length === 0) { adminStatusMap = {}; return; }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token;
    if (!token) { adminStatusMap = {}; return; }
    const url = `${SET_ADMIN_STATUS_URL}?user_ids=${encodeURIComponent(userIds.join(','))}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    adminStatusMap = res.ok ? (await res.json()) : {};
  } catch {
    adminStatusMap = {};
  }
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
      const seedBadge = h.id === SEED_ALLOWED_HOUSEHOLD_ID
        ? ' <span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;background:#e8f5e9;color:#2e7d32;font-size:11px;font-weight:600;white-space:nowrap;">🌱 Seed</span>'
        : '';
      const nameCell = editing
        ? `<input id="hh-edit-name" type="text" value="${esc(h.name)}">`
        : `${esc(h.name)}${seedBadge}`;
      const actions = editing
        ? `<button class="btn btn-sm" data-action="hh-edit-confirm" data-id="${esc(h.id)}">Confirm</button>
           <button class="btn btn-sm btn-secondary" data-action="hh-edit-cancel">Cancel</button>`
        : `<button class="btn btn-sm btn-secondary" data-action="hh-edit" data-id="${esc(h.id)}">Edit</button>
           <button class="btn btn-sm" style="background:#b45309;color:#fff;border-color:#b45309;" data-action="hh-reset" data-id="${esc(h.id)}">Reset</button>
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
          <input type="color" id="mem-edit-color" value="${esc(m.color || defaultMemberColor(h.id))}" oninput="document.getElementById('mem-edit-color-hex').value = this.value">
          <input type="text" id="mem-edit-color-hex" class="color-hex" value="${esc(m.color || defaultMemberColor(h.id))}" oninput="if (/^#[0-9a-fA-F]{6}$/.test(this.value)) document.getElementById('mem-edit-color').value = this.value">
        </span>
      </td>
      <td>${roleSelect('mem-edit-role', m.role)}</td>
      <td class="actions">
        <p id="mem-edit-error-${esc(m.id)}" class="error" style="display:none"></p>
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
    <td>${esc(m.role) || '<span class="muted">—</span>'}${adminStatusMap[m.user_id] === true ? ' <span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;background:#fff3cd;color:#92400e;font-size:11px;font-weight:600;white-space:nowrap;">🔑 App admin</span>' : ''}</td>
    <td class="actions">
      <button class="btn btn-sm btn-secondary" data-action="mem-edit" data-id="${esc(m.id)}">Edit</button>
      <button class="btn btn-sm" style="background:#b45309;color:#fff;border-color:#b45309;" data-action="mem-reset" data-id="${esc(m.id)}">Reset</button>
      <button class="btn btn-sm btn-danger" data-action="mem-remove" data-id="${esc(m.id)}">Remove</button>
      <button class="btn btn-sm" style="background:#2e7d32;color:#fff;border-color:#2e7d32;" data-action="mem-grant-admin" data-id="${esc(m.id)}" data-user="${esc(m.user_id || '')}">Grant admin</button>
      <button class="btn btn-sm btn-danger" data-action="mem-revoke-admin" data-id="${esc(m.id)}" data-user="${esc(m.user_id || '')}">Revoke admin</button>
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
        <input type="color" id="mem-add-color" value="${defaultMemberColor(h.id)}" oninput="document.getElementById('mem-add-color-hex').value = this.value">
        <input type="text" id="mem-add-color-hex" class="color-hex" value="${defaultMemberColor(h.id)}" oninput="if (/^#[0-9a-fA-F]{6}$/.test(this.value)) document.getElementById('mem-add-color').value = this.value">
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
      const resetAllControl = mem.length
        ? `<button class="btn btn-sm" style="background:#b45309;color:#fff;border-color:#b45309;" data-action="mem-reset-all" data-hh="${esc(h.id)}">Reset All Users</button>`
        : '';
      return `<div class="hh-block">
        <div class="hh-block-head">
          <h3>${esc(h.name)} <span class="muted">(${mem.length})</span></h3>
          ${addControl}
          ${resetAllControl}
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

// ---- Dev Info render ----

// Read-only diagnostic panel. Uses only already-loaded data (no new queries).
function renderDevInfo() {
  const section = document.getElementById('devinfo-section');
  if (!section) return;

  const shortId = `${SEED_ALLOWED_HOUSEHOLD_ID.slice(0, 8)}…${SEED_ALLOWED_HOUSEHOLD_ID.slice(-3)}`;
  const seedHh = cachedHouseholds.find(h => h.id === SEED_ALLOWED_HOUSEHOLD_ID);
  const seedLine = seedHh
    ? `Seed household: ${esc(seedHh.name)} (${shortId})`
    : `Seed household: ${esc(SEED_ALLOWED_HOUSEHOLD_ID)} <span style="color:#b71c1c;">⚠️ Not found in loaded households</span>`;

  section.innerHTML = `
    <h2 style="color:#666;">Dev Info</h2>
    <p style="margin:8px 0;">${seedLine}</p>
    <p style="margin:8px 0;">App admin status is not readable via the anon key. Use Grant/Revoke admin buttons above, or check Supabase Auth dashboard.</p>`;
}

// ---- Event handling ----

function onAction(e) {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action, id, hh, user } = el.dataset;
  switch (action) {
    case 'hh-create-open':   ui.hhError = ''; ui.hhCreateOpen = true; renderHouseholds(); break;
    case 'hh-create-cancel': ui.hhCreateOpen = false; renderHouseholds(); break;
    case 'hh-create-submit': createHousehold(); break;
    case 'hh-edit':          ui.hhError = ''; ui.hhEditId = id; renderHouseholds(); break;
    case 'hh-edit-cancel':   ui.hhEditId = null; renderHouseholds(); break;
    case 'hh-edit-confirm':  confirmRenameHousehold(id); break;
    case 'hh-reset':         openResetDialog(id); break;
    case 'hh-delete':        deleteHousehold(id); break;
    case 'mem-edit':         ui.memberError = ''; ui.memberEditId = id; renderUsers(); break;
    case 'mem-edit-cancel':  ui.memberEditId = null; renderUsers(); break;
    case 'mem-edit-confirm': confirmEditMember(id); break;
    case 'mem-reset':        openUserResetDialog({ memberId: id }); break;
    case 'mem-reset-all':    openUserResetDialog({ householdId: hh, all: true }); break;
    case 'mem-remove':       removeMember(id); break;
    case 'mem-grant-admin':  toggleAdminStatus(id, user, true); break;
    case 'mem-revoke-admin': toggleAdminStatus(id, user, false); break;
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
  const errEl = document.getElementById(`mem-edit-error-${id}`);
  if (!color) {
    if (errEl) { errEl.textContent = 'Color is required.'; errEl.style.display = 'block'; }
    return;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    if (errEl) { errEl.textContent = 'Color must be a valid hex value, e.g. #4a7c59.'; errEl.style.display = 'block'; }
    return;
  }
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

// Deployed Edge Function that writes auth.users app_metadata.is_admin.
// The anon key cannot read is_admin back from auth.users, so this control is
// write-only: there is no current-state indicator, only Grant/Revoke actions.
const SET_ADMIN_STATUS_URL = 'https://kmkfywdzoitgdtbttxaa.supabase.co/functions/v1/set-admin-status';

// Service-role reset endpoints (see supabase/functions/reset-household and
// reset-user). Both verify the caller is an admin, then preview (GET) or reset (POST).
const RESET_HOUSEHOLD_URL = 'https://kmkfywdzoitgdtbttxaa.supabase.co/functions/v1/reset-household';
const RESET_USER_URL = 'https://kmkfywdzoitgdtbttxaa.supabase.co/functions/v1/reset-user';

// Minimal transient toast (no styling deps — inline-styled so style.css is untouched).
function showToast(message) {
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:24px', 'transform:translateX(-50%)',
    'max-width:90%', 'background:#1f2937', 'color:#fff', 'padding:12px 16px',
    'border-radius:8px', 'font-size:14px', 'line-height:1.4', 'z-index:9999',
    'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
  ].join(';');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

// Write-only admin toggle: posts to the set-admin-status Edge Function with the
// caller's JWT. The function re-verifies the caller is an admin server-side.
async function toggleAdminStatus(memberId, userId, isAdmin) {
  ui.memberError = '';
  if (!userId) { ui.memberError = 'This member has no linked user account.'; renderUsers(); return; }
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token;
    if (!token) { ui.memberError = 'Session expired — sign in again.'; renderUsers(); return; }
    const res = await fetch(SET_ADMIN_STATUS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId, is_admin: isAdmin }),
    });
    let payload = {};
    try { payload = await res.json(); } catch { /* non-JSON error body */ }
    if (!res.ok || !payload.success) {
      ui.memberError = payload.error || `Request failed (${res.status}).`;
      renderUsers();
      return;
    }
    await loadAdminStatus();
    renderUsers();
    showToast('Admin status updated — user must sign out and back in to the Plant Care app for changes to take effect');
  } catch (e) {
    ui.memberError = e?.message || String(e);
    renderUsers();
  }
}

// ---- Household reset (plant data only; never members/name) ----
//
// A modal appended to document.body (not to a section) so reload()'s innerHTML
// swaps don't wipe it. All work goes through the reset-household Edge Function
// with the admin's bearer token — the anon key + RLS can't read or delete another
// household's plant data. Two depths: shallow (soft-delete plants) / deep (hard
// cascade + storage). A typed household-name confirmation gates the action.

async function resetAuthToken() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session?.access_token || null;
}

function closeResetDialog() {
  document.getElementById('reset-modal-overlay')?.remove();
  document.removeEventListener('keydown', onResetKey);
}

function onResetKey(e) {
  if (e.key === 'Escape') closeResetDialog();
}

async function openResetDialog(householdId) {
  const h = cachedHouseholds.find(x => x.id === householdId);
  if (!h) return;
  closeResetDialog(); // guard against a stray existing modal

  const overlay = document.createElement('div');
  overlay.id = 'reset-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9998;padding:16px;';
  overlay.innerHTML = `
    <div id="reset-modal" style="background:#fff;border-radius:10px;max-width:460px;width:100%;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-size:14px;line-height:1.45;box-sizing:border-box;">
      <h3 style="margin:0 0 12px;">Reset &ldquo;${esc(h.name)}&rdquo;</h3>
      <div id="reset-counts" style="margin-bottom:14px;color:#555;background:#f5f5f5;border-radius:6px;padding:10px 12px;">Loading counts…</div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
        <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
          <input type="radio" name="reset-mode" value="shallow" checked style="margin-top:3px;">
          <span><strong>Shallow</strong> — soft-delete plants only. Tasks, notes, care log and photos stay in the database (hidden). Reversible.</span>
        </label>
        <label style="display:flex;gap:8px;align-items:flex-start;cursor:pointer;">
          <input type="radio" name="reset-mode" value="deep" style="margin-top:3px;">
          <span><strong>Deep</strong> — permanently delete all plants, tasks, notes, care log, photos and their storage files. <strong style="color:#b71c1c;">Irreversible.</strong></span>
        </label>
      </div>
      <label style="display:block;margin-bottom:12px;">
        <span style="display:block;margin-bottom:4px;color:#555;">Type <strong>${esc(h.name)}</strong> to confirm:</span>
        <input id="reset-confirm-name" type="text" autocomplete="off" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #c8c8c8;border-radius:6px;">
      </label>
      <p id="reset-error" class="error" style="display:none;margin:0 0 12px;"></p>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-sm btn-secondary" id="reset-cancel">Cancel</button>
        <button class="btn btn-sm btn-danger" id="reset-submit" disabled>Reset household</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const nameInput = document.getElementById('reset-confirm-name');
  const submitBtn = document.getElementById('reset-submit');
  const errEl = document.getElementById('reset-error');
  const showErr = msg => { errEl.textContent = msg; errEl.style.display = 'block'; };

  overlay.addEventListener('click', e => { if (e.target === overlay) closeResetDialog(); });
  document.getElementById('reset-cancel').addEventListener('click', closeResetDialog);
  document.addEventListener('keydown', onResetKey);

  // Enable the action only once the typed name matches exactly.
  nameInput.addEventListener('input', () => {
    submitBtn.disabled = nameInput.value.trim() !== h.name;
  });
  nameInput.focus();

  // Preview counts.
  try {
    const token = await resetAuthToken();
    if (!token) { document.getElementById('reset-counts').textContent = 'Session expired — sign in again.'; return; }
    const res = await fetch(`${RESET_HOUSEHOLD_URL}?household_id=${encodeURIComponent(householdId)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const payload = await res.json();
    const countsEl = document.getElementById('reset-counts');
    if (!countsEl) return; // dialog closed while loading
    if (!res.ok) { countsEl.textContent = payload.error || `Preview failed (${res.status}).`; return; }
    const c = payload.counts;
    countsEl.innerHTML = `This will affect:<br>
      <strong>${c.plants_active}</strong> active plants (${c.plants} total),
      <strong>${c.tasks}</strong> tasks,
      <strong>${c.care_log}</strong> care-log entries,
      <strong>${c.notes}</strong> notes,
      <strong>${c.plant_photos}</strong> photos,
      <strong>${c.storage_objects}</strong> storage files.`;
  } catch (e) {
    const countsEl = document.getElementById('reset-counts');
    if (countsEl) countsEl.textContent = e?.message || String(e);
  }

  submitBtn.addEventListener('click', async () => {
    errEl.style.display = 'none';
    const mode = overlay.querySelector('input[name="reset-mode"]:checked')?.value;
    const confirm_name = nameInput.value.trim();
    if (confirm_name !== h.name) { showErr('Confirmation name does not match.'); return; }
    submitBtn.disabled = true;
    const origLabel = submitBtn.textContent;
    submitBtn.textContent = 'Resetting…';
    try {
      const token = await resetAuthToken();
      if (!token) { showErr('Session expired — sign in again.'); submitBtn.disabled = false; submitBtn.textContent = origLabel; return; }
      const res = await fetch(RESET_HOUSEHOLD_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ household_id: householdId, mode, confirm_name }),
      });
      const payload = await res.json();
      if (!res.ok) { showErr(payload.error || `Reset failed (${res.status}).`); submitBtn.disabled = false; submitBtn.textContent = origLabel; return; }
      const c = payload.counts;
      let msg;
      if (payload.mode === 'shallow') {
        msg = `Shallow reset: ${c.plants} plant${c.plants === 1 ? '' : 's'} soft-deleted.`;
      } else {
        // storage_objects = objects the Storage API confirmed removed. If the
        // function also reports how many it found (storage_objects_listed) and the
        // two differ, some objects were NOT confirmed gone — surface that instead
        // of implying a clean sweep.
        const listed = c.storage_objects_listed ?? c.storage_objects;
        const storageStr = listed !== c.storage_objects
          ? `${c.storage_objects} of ${listed} storage files (${listed - c.storage_objects} NOT confirmed removed — check function logs)`
          : `${c.storage_objects} storage files`;
        msg = `Deep reset: deleted ${c.plants} plants, ${c.tasks} tasks, ${c.notes} notes, ${c.care_log} care-log, ${c.plant_photos} photos, ${storageStr}.`;
      }
      closeResetDialog();
      showToast(msg);
      await reload();
    } catch (e) {
      showErr(e?.message || String(e));
      submitBtn.disabled = false;
      submitBtn.textContent = origLabel;
    }
  });
}

// ---- User reset (per-member onboarding/notification/calendar state) ----
//
// Single (one member) or bulk (every active member in a household). Never touches
// plant data, the member row itself, role, or auth.users — only clears server-side
// onboarding/notification/calendar fields + push subscriptions, via the reset-user
// Edge Function. Reuses the reset-modal overlay + close/Esc helpers above.

const USER_RESET_FIELDS_HTML = `
  <div style="margin-bottom:12px;color:#555;">This will set, per user:
    <ul style="margin:6px 0 0;padding-left:20px;">
      <li>onboarding &rarr; not completed</li>
      <li>notifications &rarr; off (push subscription deleted)</li>
      <li>calendar time &rarr; 8:00&nbsp;PM default, weekend time &rarr; none</li>
    </ul>
  </div>
  <p style="margin:0 0 14px;padding:8px 10px;background:#fff7ed;border:1px solid #fdba74;border-radius:6px;color:#7c2d12;font-size:13px;">
    This clears server-side state only. The user must also clear their app&rsquo;s local storage
    or reinstall the app on their own device for a fully fresh first-run experience.
  </p>`;

async function openUserResetDialog({ memberId = null, householdId = null, all = false } = {}) {
  const single = !!memberId;
  // Confirmation target name comes from the local cache so the typed field works
  // before the preview request resolves; the preview fills in current values.
  const targetName = single
    ? (cachedMembers.find(m => m.id === memberId)?.display_name ?? '')
    : (cachedHouseholds.find(h => h.id === householdId)?.name ?? '');
  const title = single
    ? `Reset user &ldquo;${esc(targetName)}&rdquo;`
    : `Reset ALL users in &ldquo;${esc(targetName)}&rdquo;`;
  const confirmLabel = single
    ? `Type the display name <strong>${esc(targetName)}</strong> to confirm:`
    : `Type the household name <strong>${esc(targetName)}</strong> to confirm:`;

  closeResetDialog(); // reuse the single reset-modal slot

  const overlay = document.createElement('div');
  overlay.id = 'reset-modal-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:9998;padding:16px;';
  overlay.innerHTML = `
    <div id="reset-modal" style="background:#fff;border-radius:10px;max-width:480px;width:100%;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,0.3);font-size:14px;line-height:1.45;box-sizing:border-box;max-height:90vh;overflow:auto;">
      <h3 style="margin:0 0 12px;">${title}</h3>
      <div id="reset-counts" style="margin-bottom:14px;color:#555;background:#f5f5f5;border-radius:6px;padding:10px 12px;">Loading current state…</div>
      ${USER_RESET_FIELDS_HTML}
      <label style="display:block;margin-bottom:12px;">
        <span style="display:block;margin-bottom:4px;color:#555;">${confirmLabel}</span>
        <input id="reset-confirm-name" type="text" autocomplete="off" style="width:100%;box-sizing:border-box;padding:8px;border:1px solid #c8c8c8;border-radius:6px;">
      </label>
      <p id="reset-error" class="error" style="display:none;margin:0 0 12px;"></p>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button class="btn btn-sm btn-secondary" id="reset-cancel">Cancel</button>
        <button class="btn btn-sm btn-danger" id="reset-submit" disabled>${single ? 'Reset user' : 'Reset all users'}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const nameInput = document.getElementById('reset-confirm-name');
  const submitBtn = document.getElementById('reset-submit');
  const errEl = document.getElementById('reset-error');
  const showErr = msg => { errEl.textContent = msg; errEl.style.display = 'block'; };

  overlay.addEventListener('click', e => { if (e.target === overlay) closeResetDialog(); });
  document.getElementById('reset-cancel').addEventListener('click', closeResetDialog);
  document.addEventListener('keydown', onResetKey);
  nameInput.addEventListener('input', () => { submitBtn.disabled = nameInput.value.trim() !== targetName; });
  nameInput.focus();

  // Preview current values.
  try {
    const token = await resetAuthToken();
    if (!token) { document.getElementById('reset-counts').textContent = 'Session expired — sign in again.'; return; }
    const qs = single
      ? `household_member_id=${encodeURIComponent(memberId)}`
      : `household_id=${encodeURIComponent(householdId)}&all=true`;
    const res = await fetch(`${RESET_USER_URL}?${qs}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const payload = await res.json();
    const countsEl = document.getElementById('reset-counts');
    if (!countsEl) return; // dialog closed while loading
    if (!res.ok) { countsEl.textContent = payload.error || `Preview failed (${res.status}).`; return; }
    const yn = b => b ? 'yes' : 'no';
    if (single) {
      const m = payload.member;
      countsEl.innerHTML = `Current state for <strong>${esc(m.display_name || '—')}</strong>:<br>
        onboarding completed: <strong>${yn(m.onboarding_completed)}</strong>,
        notifications: <strong>${m.notifications_enabled ? 'on' : 'off'}</strong>,
        push subscriptions: <strong>${m.push_subscriptions}</strong>,
        calendar: <strong>${esc(m.calendar_time ?? '—')}</strong>${m.calendar_weekend_time ? ` / weekend ${esc(m.calendar_weekend_time)}` : ''}.`;
    } else {
      const ms = payload.members || [];
      const onboarded = ms.filter(m => m.onboarding_completed).length;
      const notif = ms.filter(m => m.notifications_enabled).length;
      const push = ms.reduce((n, m) => n + (m.push_subscriptions || 0), 0);
      const names = ms.map(m => esc(m.display_name || '—')).join(', ');
      countsEl.innerHTML = `<strong>${payload.count}</strong> member${payload.count === 1 ? '' : 's'}: ${names || '—'}.<br>
        ${onboarded} completed onboarding, ${notif} with notifications on, ${push} push subscription${push === 1 ? '' : 's'} total.`;
    }
  } catch (e) {
    const countsEl = document.getElementById('reset-counts');
    if (countsEl) countsEl.textContent = e?.message || String(e);
  }

  submitBtn.addEventListener('click', async () => {
    errEl.style.display = 'none';
    const confirm_name = nameInput.value.trim();
    if (confirm_name !== targetName) { showErr('Confirmation name does not match.'); return; }
    submitBtn.disabled = true;
    const origLabel = submitBtn.textContent;
    submitBtn.textContent = 'Resetting…';
    try {
      const token = await resetAuthToken();
      if (!token) { showErr('Session expired — sign in again.'); submitBtn.disabled = false; submitBtn.textContent = origLabel; return; }
      const reqBody = single
        ? { household_member_id: memberId, confirm_name }
        : { household_id: householdId, all: true, confirm_name };
      const res = await fetch(RESET_USER_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });
      const payload = await res.json();
      if (!res.ok) { showErr(payload.error || `Reset failed (${res.status}).`); submitBtn.disabled = false; submitBtn.textContent = origLabel; return; }
      const names = (payload.members || []).map(n => n || '—').join(', ');
      const msg = single
        ? `Reset ${names || 'member'} (${payload.push_deleted} push sub${payload.push_deleted === 1 ? '' : 's'} removed).`
        : `Reset ${payload.reset} user${payload.reset === 1 ? '' : 's'}: ${names || '—'} (${payload.push_deleted} push sub${payload.push_deleted === 1 ? '' : 's'} removed).`;
      closeResetDialog();
      showToast(msg);
      await reload();
    } catch (e) {
      showErr(e?.message || String(e));
      submitBtn.disabled = false;
      submitBtn.textContent = origLabel;
    }
  });
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
