-- #456-1: Revive the dead `tasks.note` column as a per-task free-text
-- instructions field ("how to perform this task").
--
-- `note` is a legacy column from the pre-Vite app's "Note / Reminder" textarea.
-- #456-diag confirmed it dead: 71 rows across all households, every value the
-- empty string — no user-supplied content has ever been written. The rename is
-- therefore lossless.
--
-- RENAME rather than ADD: `notes.task_id` already FKs to `tasks(id)`, so "the
-- note on this task" has a live and different meaning in this codebase. A second
-- `tasks.note` would be a naming trap.
--
-- Attribution columns record who last touched the instructions and when. Both
-- are nullable — existing rows carry no authorship and need no backfill.
-- `instructions_updated_by` mirrors `tasks.owner_id`, which references
-- household_members(id) (NOT auth.users).
--
-- The existing "Members can manage tasks in their households" RLS policy is a
-- whole-row policy, so it already covers the renamed and new columns.

ALTER TABLE "public"."tasks" RENAME COLUMN "note" TO "instructions";

ALTER TABLE "public"."tasks"
  ADD COLUMN "instructions_updated_by" "uuid" NULL DEFAULT NULL,
  ADD COLUMN "instructions_updated_at" timestamp with time zone NULL DEFAULT NULL;

ALTER TABLE ONLY "public"."tasks"
  ADD CONSTRAINT "tasks_instructions_updated_by_fkey"
  FOREIGN KEY ("instructions_updated_by")
  REFERENCES "public"."household_members"("id");
