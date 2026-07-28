-- #448: Decouple onboarding completion from reminders-card resolution.
-- onboarding_completed_at now fires at the caring coach-mark "Got it" (the real
-- tour-completion point). The reminders-card outcome (enable vs dismiss), which
-- happens later and is optional, is tracked separately here.
-- reminders_card_resolution holds 'enabled' or 'dismissed'.
-- The existing "Members can update their own row" RLS policy (user_id = auth.uid())
-- is a whole-row UPDATE policy, so it already covers these new columns.
ALTER TABLE "public"."household_members"
  ADD COLUMN "reminders_card_resolved_at" timestamp with time zone DEFAULT NULL,
  ADD COLUMN "reminders_card_resolution" text DEFAULT NULL;
