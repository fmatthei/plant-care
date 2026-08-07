-- #493: authoritative timestamp for "a real photo was last added to this note",
-- tracked independently of both note-creation time and the photo's current
-- existence. Fixes two defects found in earlier diagnostics:
--
--   (a) created_at does not move when a photo is attached to an existing note
--       via Edit-Note, so a photo added today could misreport as months old.
--   (b) deleting a photo nulls photo_url, erasing all evidence a photo was ever
--       added — which would let a "first photo" nudge re-fire at someone who
--       had already engaged.
--
-- Deliberately NOT cleared when a photo is deleted: this column answers "when
-- did they last actually add one", not "do they have one now". Pair it with
-- photo_url when current existence matters.
--
-- Nullable with no default. NULL means "no real photo has ever been added to
-- this note" and is correct for every existing row:
--   * legacy text-only notes      -> never had a photo
--   * "Use default photo" entries -> deliberately skipped, never set (#492)
--   * existing real-photo notes   -> backfilled below
--
-- Set only where is_default_photo = false AND photo_url IS NOT NULL, so the
-- default-photo path is never stamped.
ALTER TABLE "public"."notes"
  ADD COLUMN "photo_added_at" timestamptz NULL;

-- One-time backfill for photos that predate this column. created_at is the best
-- available approximation and is exact for the common case (photo attached at
-- creation). It under-reports only for a photo added later via Edit-Note, where
-- the true time was not recorded and is unrecoverable — strictly better than
-- leaving these NULL, which would read as "never added a photo".
UPDATE "public"."notes"
   SET "photo_added_at" = "created_at"
 WHERE "photo_url" IS NOT NULL
   AND "is_default_photo" = false
   AND "photo_added_at" IS NULL;
