-- Rename quarterly columns to biannual in SubscriptionTier
ALTER TABLE "subscription_tiers" RENAME COLUMN "quarterly_price" TO "biannual_price";
ALTER TABLE "subscription_tiers" RENAME COLUMN "quarterly_display" TO "biannual_display";

-- Rename quarterly column to biannual in TierPricingSnapshot
ALTER TABLE "tier_pricing_snapshots" RENAME COLUMN "quarterly_price" TO "biannual_price";
