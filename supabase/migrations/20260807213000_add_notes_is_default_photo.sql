-- #492: explicit marker for a Photos & Notes entry where the user deliberately
-- skipped taking a photo ("Use default photo", #491). Such an entry writes no
-- photo_url and renders client-side as the plant's icon — which until now made
-- it indistinguishable from a legacy text-only note.
--
-- Additive on purpose: it does NOT replace the `photo_url IS NOT NULL` check.
-- Future engagement-nudge counting filters on `is_default_photo = false` so the
-- intent is recorded explicitly, rather than inferred from a null whose meaning
-- would shift if a real placeholder asset URL is ever introduced for the
-- default state.
--
-- No backfill. false is correct for every existing row:
--   * existing photo notes  -> real user-taken photos, false + photo_url set
--   * legacy text-only notes -> false + photo_url null, so the compound filter
--     (is_default_photo = false AND photo_url IS NOT NULL) already excludes
--     them. Those 1-2 rows are being resolved manually, out of scope here.
ALTER TABLE "public"."notes"
  ADD COLUMN "is_default_photo" boolean NOT NULL DEFAULT false;
