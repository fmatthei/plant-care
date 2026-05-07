# plant-care

Mobile-first PWA for shared household plant care. Single-page vanilla-JS app
backed by Supabase (Postgres + Storage + Auth + Edge Functions).

## Stack & commands

- Build: `vite` (`npm run dev` → http://localhost:5173, `npm run build`)
- Frontend: vanilla JS, single module `src/app.js` (~6,200 lines), `src/style.css`
- Backend: Supabase. Edge Functions written in TypeScript on Deno.
- Always run `npm run build` after non-trivial JS edits — fastest parse check.

## File layout — what's live, what's dead

```
src/app.js          # ACTIVE app — loaded by index.html. Edit this.
src/style.css       # ACTIVE styles
supabase/functions/<name>/index.ts   # Edge Functions (no _shared/)
.env                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

/app.js             # LEGACY (~2,200 lines) — NOT loaded. Do not edit.
/config.js          # LEGACY — NOT imported anywhere. Do not edit.
```

`index.html` loads `/src/app.js` only. The root-level `app.js` and `config.js`
are pre-Vite remnants. If a brief says "edit `app.js`", confirm it means
`src/app.js`.

## Module-level state (in src/app.js, ~line 105–115)

- `currentUserId` — `auth.users.id`
- `currentMemberId` — `household_members.id` (NOT the auth user id; this is the
  member record that owns tasks/notes/care_log entries)
- `householdId` — current household
- `membersCache` — list of `{id, display_name, color}` for the household
- `plants`, `notes`, `activityFeed` — denormalized in-memory copies

All set by `loadFromSupabase()` (`:293`). Edge Functions and external clients
should query Supabase directly, not assume any of this state.

## Date & recurrence invariants — DO NOT BREAK

- Storage / computation locale: **`en-CA`** (produces `YYYY-MM-DD`). See
  `todayStr()` at `:496`.
- Display locale: `en-US` for human-readable dates only.
- All date math anchors strings at noon: `new Date(dateStr + 'T12:00:00')`.
  This is DST/UTC-safe — do not rewrite it to use `Date.UTC()` or naked
  `new Date(dateStr)` (which parses as UTC midnight and shifts the day west of
  the prime meridian).
- Single source of truth for next-due: `computeNextDue(task)` at `:539`.
  Branches on `recurrenceType`: `'interval'` | `'weekdays'` | `'one-off'`.
  `task.next_due_override` always wins.
- A TypeScript port of this function lives in
  `supabase/functions/get-calendar-feed/index.ts` and must stay in sync.

## Supabase

- Client init: `src/app.js:54` reads `import.meta.env.VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`. Use the same env vars when constructing Edge
  Function URLs from the frontend.
- Schema (relevant subset):
  - `households(id, name)`
  - `household_members(id, household_id, user_id, display_name, color, deleted_at)`
  - `plants(id, household_id, name, emoji, date_acquired, deleted_at)`
  - `tasks(id, plant_id, name, type, recurrence jsonb, last_done, next_due_override, paused, owner_id, deleted_at, ...)` — `recurrence` JSONB is `{type, every, unit, days}`
  - `care_log(id, plant_id, task_id, household_member_id, date, created_at, ...)`
  - `notes(id, plant_id, household_member_id, note, photo_url, deleted_at, created_at)`
  - `plant_photos(id, plant_id, note_id, storage_url, created_at)` — joins to `notes` via `note_id`
- Soft deletes everywhere: queries always `.is('deleted_at', null)`.
- Tasks inherit household scoping via `plant_id` (no direct `household_id`
  column on tasks).

## Edge Functions

- Path: `supabase/functions/<name>/index.ts`. No `_shared/` folder; each function is self-contained with `npm:` specifiers.
- Pattern (mirror `notify-care-log/index.ts`):
  - `import { createClient } from 'npm:@supabase/supabase-js@2'`
  - Module-level `CORS_HEADERS` const
  - `Deno.serve` handler with `OPTIONS` short-circuit
  - Service-role client: `Deno.env.get('SUPABASE_URL')!`, `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!`

## UI patterns

- **Event delegation:** every interactive element carries `data-action="..."`
  (and `data-plant`, `data-task`, etc.). Dispatch happens in `handleEvent()`
  at `:4208` via `e.target.closest('[data-action]')`. A child with its own
  `data-action` "shadows" any clickable parent — useful for thumbnails inside
  clickable rows.
- **Sheets:** `openSheet(html)` / `closeSheet()` at `:3238`. Esc auto-dismisses
  via global handler. Outside-click closes via `#overlay`. Cancel button uses
  `data-action="sheet-cancel"` (Esc prefers it over plain close).
- **Hamburger menu** is separate from sheets: `#menu-panel` + `#menu-overlay`,
  rendered by `renderMenuPanel()` at `:3268`. Opened by `openMenu()`.
- Inline styles for one-off layouts are idiomatic here. Don't add a new CSS
  class for a single-surface tweak.

## Photo system

- Storage bucket: `plant-photos` (constant `PLANT_PHOTOS_BUCKET` at `:961`).
- Cap: `PHOTO_CAP_PER_PLANT = 5`.
- Canonical delete: `deletePlantPhoto({id, storage_url, note_id})` — handles
  storage removal + `plant_photos` row delete + `notes.photo_url` null + in-memory
  `note.photoUrl` mutation.
- Upload: `uploadPlantPhoto(blob, plantId)` returns `{publicUrl, path}`.
- Compression: `compressImage(file, 1200, 0.8)` before upload.

## Unified thumbnail style

All photo thumbnails use one of two sizes, both with `1.5px solid #c8c8c8`:

- **Inline** (36 × 36, r7): My Plants Recent Activity, Summary Recent Activity,
  Notes tab, Care Log
- **Featured** (56 × 56, r8): Edit Note photo row, Manage Photos rows, Add Note
  + Edit Note coach tips

Style is applied via inline `style="..."` on each `<img>`, overriding the
underlying CSS classes (`notes-tab-thumb`, `carelog-note-thumb`,
`manage-photos-thumb`, `add-note-coach-last-thumb`). The class borders in
`style.css` are now dead on these surfaces — left in place, not relied on.

## Conventions

- Briefs that say "do not touch X" mean it. Keep diffs minimal and ask if a
  change to a "do not touch" surface seems unavoidable.
- For UI changes, run `npm run dev` and exercise the flow before reporting
  done — type-check / build is necessary but not sufficient.
- Don't create planning or summary `.md` files unless asked. Conversation
  context + commit messages are the persistence layer.

## PostHog analytics

- Project token: `phc_krWWP8MENsyRqoG8QNe6xorFJRfwUiqG2GCsWgJNRVDH`
- API host: `https://us.i.posthog.com`
- Snippet is in `index.html` `<head>`.
- `posthog.identify()` is called at the end of `loadFromSupabase()` and inside
  the empty-household early-return branch. Uses `currentUserId` as distinct ID.
  Properties: `display_name`, `household_id`, `household_name`.
- To fire a custom event anywhere in `src/app.js`:
  `posthog.capture('event_name', { property: value })`
- Do not call `posthog.identify()` anywhere else.
