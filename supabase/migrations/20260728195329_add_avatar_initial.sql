-- #449: Editable Profile — allow a member to set a custom avatar initial that
-- overrides the letter derived from display_name. NULL means "not customized";
-- every avatar render site falls back to (display_name)[0].toUpperCase() while
-- this is null, so existing rows need no backfill.
-- The existing "Members can update their own row" RLS policy (user_id = auth.uid())
-- is a whole-row UPDATE policy, so it already covers this new column.
ALTER TABLE "public"."household_members"
  ADD COLUMN "avatar_initial" text NULL DEFAULT NULL;
