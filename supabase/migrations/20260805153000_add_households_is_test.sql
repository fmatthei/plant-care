-- #477: household-level test flag, so PostHog can filter out dev/QA households.
-- Mirrors the person-level is_test property (derived client-side from the
-- @plantcare.test email domain), but for households, which have no such
-- naming convention to key off.

ALTER TABLE "public"."households"
  ADD COLUMN "is_test" boolean NOT NULL DEFAULT false;

-- One-time backfill: the only two non-real households.
--   b3b5aeb6-… TEST Household  (Matu + Vale dev household)
--   7021d148-… QA Bot          (seeded QA automation household)
UPDATE "public"."households"
   SET "is_test" = true
 WHERE "id" IN (
   'b3b5aeb6-ddcc-47c2-bb5e-b2e67d59f635',
   '7021d148-a8f5-41ce-99ca-5cbad30785b8'
 );
