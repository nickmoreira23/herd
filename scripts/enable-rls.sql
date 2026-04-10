-- =============================================================
-- Enable Row-Level Security on all public schema tables
-- =============================================================
-- Supabase exposes a PostgREST API using the `anon` and
-- `authenticated` roles. Without RLS, those roles have full
-- access to every table. Enabling RLS with no policies = deny
-- all for anon/authenticated, while the `postgres` role (used
-- by Prisma) bypasses RLS as the table owner.
--
-- Safe to re-run: ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- is idempotent.
-- =============================================================

-- Products
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;

-- AI Agents
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentTierAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentKnowledgeItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentTool" ENABLE ROW LEVEL SECURITY;

-- Subscription & Pricing
ALTER TABLE "SubscriptionTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriptionRedemptionRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TierPricingSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialSnapshot" ENABLE ROW LEVEL SECURITY;

-- Commission (legacy)
ALTER TABLE "CommissionStructure" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommissionTierRate" ENABLE ROW LEVEL SECURITY;

-- Commission (current)
ALTER TABLE "CommissionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommissionPlanRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OverrideRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerformanceTier" ENABLE ROW LEVEL SECURITY;

-- Partners
ALTER TABLE "PartnerBrand" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerTierAssignment" ENABLE ROW LEVEL SECURITY;

-- D2D
ALTER TABLE "D2DPartner" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrgNode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartnerAgreement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClawbackRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommissionLedgerEntry" ENABLE ROW LEVEL SECURITY;

-- OpEx
ALTER TABLE "OpexCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpexMilestoneLevel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpexItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OpexMilestone" ENABLE ROW LEVEL SECURITY;

-- Perks & Community
ALTER TABLE "Perk" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PerkTierAssignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityBenefit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommunityBenefitTierAssignment" ENABLE ROW LEVEL SECURITY;

-- Admin & Settings (AdminUser removed — users are now in network_profiles)
-- ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Document" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;

-- Integrations
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationTierMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationWebhookEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationSyncLog" ENABLE ROW LEVEL SECURITY;
