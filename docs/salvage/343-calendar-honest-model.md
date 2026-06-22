# Salvage: #343 calendar honest-model UI + copy

**What this is:** the #343 "honest-model" calendar UI and copy — the post-subscribe
done-state ("We've sent it to your Calendar app — tap to confirm…") and the iOS
unsubscribe disclosure ("To remove: Settings → Calendar → Accounts → Delete
Account"). Rendered by the `calDoneState()` closure.

**Where it came from:** `src/app.js`, inside `openRemindersDialog()` (the #340
reminders setup dialog). The dialog is removed in the Piece-1 rebuild (#363), so
this copy is preserved here before deletion.

**Why it's saved:** Pieces 2 & 3 — applying the honest model to the menu Sync to
Calendar sheet (`openCalendarSyncSheet()`) and to the usage-triggered card — will
reuse this exact done-state copy and the unsubscribe-disclosure phrasing. This copy
does **not** exist anywhere else in the codebase (the menu Sync sheet has no
honest-model done-state), so it would be lost when the dialog is deleted.

**Original location (for git-history cross-reference):** `src/app.js:2266–2288`,
inside `openRemindersDialog()`. Surrounding context: the `#343` doc comment at
`:2263–2265` and the `rd-unsub-toggle` handler at `:2376–2379`.

---

Verbatim block, `src/app.js:2266–2288`:

```js
  function calDoneState() {
    const label   = calScope === 'my' ? 'My tasks' : 'All tasks';
    const chevron = unsubOpen ? '&#9652;' : '&#9662;'; // ▴ / ▾
    const instructions = unsubOpen
      ? `<div style="margin-top:10px;background:#f4faf4;border:1px solid #d6e6d6;border-radius:8px;padding:12px;font-size:12px;color:#3a5a3a;line-height:1.5;">
           To remove: go to <strong>Settings &rarr; Calendar &rarr; Accounts</strong>, find the Plant Care feed, and tap <strong>Delete Account</strong>.
         </div>`
      : '';
    return `
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${doneRow('Calendar sync', `${label} · ${to12h(calTime)}`)}
        <div style="background:#e8f3ea;border-radius:10px;padding:12px;font-size:12px;color:#2f5d2f;line-height:1.5;">
          We've sent it to your Calendar app &mdash; tap to confirm the subscription if prompted.
        </div>
        <div>
          <button type="button" id="rd-unsub-toggle" style="display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;background:none;border:none;padding:4px 2px;cursor:pointer;font-family:inherit;">
            <span style="font-size:13px;font-weight:500;color:#3a6b3a;">Remove subscription</span>
            <span style="font-size:11px;color:#3a6b3a;">${chevron}</span>
          </button>
          ${instructions}
        </div>
      </div>`;
  }
```
