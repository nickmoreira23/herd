-- Rename quarterly* columns to biannual* across SubscriptionTier and
-- TierPricingSnapshot. The legacy "quarterly" name was misleading: the
-- product never offered a 3-month billing cadence — these columns have
-- always stored the per-month rate the customer pays when committing to
-- 6 months (biannual) or 12 months (annual) of prepayment. Naming the
-- column "quarterly" while semantically meaning "biannual" was the root
-- cause of repeated revenue-projection bugs (e.g. dividing the value by
-- 6 to "get" a per-month equivalent that was already per-month).
--
-- These RENAME COLUMN statements preserve all data — Postgres updates
-- only the catalog metadata, no row rewrite.

ALTER TABLE "SubscriptionTier" RENAME COLUMN "quarterlyPrice" TO "biannualPrice";
ALTER TABLE "SubscriptionTier" RENAME COLUMN "quarterlyDisplay" TO "biannualDisplay";

ALTER TABLE "TierPricingSnapshot" RENAME COLUMN "quarterlyPrice" TO "biannualPrice";
