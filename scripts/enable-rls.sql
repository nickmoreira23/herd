-- =============================================================
-- Enable Row-Level Security on all public schema tables
-- =============================================================
-- Runtime model (corrigido na Sub-etapa 17.0.11.1):
-- - Migrations + seeds: postgres role (bypasses RLS as table owner)
-- - App runtime queries: herd_app role (NOBYPASSRLS) — singleton via
--   RUNTIME_DATABASE_URL
-- - PostgREST exposed APIs: anon/authenticated (deny-all unless
--   explicit policy)
--
-- Defense-in-depth: ENABLE ROW LEVEL SECURITY blocks
-- anon/authenticated by default on platform-wide tables.
-- herd_app gets explicit `FOR ALL` policies appended at the end
-- of this file (herd_app_full_access). Tenant-scoped tables use
-- tenant_isolation policies via migrations.
--
-- The previous docblock claimed "postgres bypasses RLS" was
-- sufficient — true for migrations, false for runtime (herd_app).
-- Without the herd_app policies the app would dey-all on every
-- platform-wide table. enable-rls.sql was therefore never applied
-- to PROD as-was; Sub-etapa 17.0.11.1 fixes the file and applies
-- it to the new DEV project.
--
-- Safe to re-run: ALTER TABLE ... ENABLE ROW LEVEL SECURITY is
-- idempotent. Policy creation is wrapped in DROP IF EXISTS +
-- CREATE for re-runnability.
-- =============================================================

-- Products — L1a.4 moved Product to migration-managed STRICT policies
-- (tenant_isolation + vertical_read, no permissive). Do NOT re-add it here:
-- the permissive herd_app_full_access would OR with the strict policies and
-- silently disable tenant isolation on any environment this file runs on.

-- AI Agents
ALTER TABLE "Agent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentTierAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentKnowledgeItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentSkill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AgentTool" ENABLE ROW LEVEL SECURITY;

-- Subscription & Pricing
-- SubscriptionTier RLS lifecycle owned by migrations (L1b.3); do not re-add.
-- A permissive herd_app_full_access here would OR with the strict
-- tenant_isolation/vertical_read policies and silently disable isolation on any
-- environment this file runs on (the bug the CI-1 job caught for Product).
ALTER TABLE "SubscriptionRedemptionRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TierPricingSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FinancialSnapshot" ENABLE ROW LEVEL SECURITY;

-- Commission / Partners / D2D / OrgNode — DROPPED in Fase 3 (2026-05-20).
-- Tables no longer exist; lines removed in Sub-etapa 17.0.11 cleanup.
-- See AGENTS.md "Fase 3 close-out — Network MLM removal".

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

-- ============================================================================
-- herd_app permissive policies for platform-wide tables
-- ============================================================================
-- Cravado na Sub-etapa 17.0.11.1.
--
-- Histórico do gap:
-- enable-rls.sql original cravou ENABLE ROW LEVEL SECURITY nas 21 tabelas
-- platform-wide assumindo "postgres role bypassa RLS, all good". Erro:
-- runtime singleton é herd_app (NOBYPASSRLS), não postgres. Resultado:
-- deny-all para herd_app em 21 tabelas. Por isso enable-rls.sql nunca
-- foi aplicada em PROD (teria quebrado o app).
--
-- Fix (cravado aqui): adicionar policy permissive `FOR ALL TO herd_app
-- USING (true)` em cada uma. Mantém defense-in-depth contra anon/
-- authenticated (Supabase PostgREST exposed), mas permite herd_app
-- operar livremente.
--
-- Idempotent via DROP POLICY IF EXISTS + CREATE POLICY.

-- AI Agents (5)
DROP POLICY IF EXISTS herd_app_full_access ON public."Agent";
CREATE POLICY herd_app_full_access ON public."Agent"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."AgentTierAccess";
CREATE POLICY herd_app_full_access ON public."AgentTierAccess"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."AgentKnowledgeItem";
CREATE POLICY herd_app_full_access ON public."AgentKnowledgeItem"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."AgentSkill";
CREATE POLICY herd_app_full_access ON public."AgentSkill"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."AgentTool";
CREATE POLICY herd_app_full_access ON public."AgentTool"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

-- Subscription & Pricing (3 — SubscriptionTier RLS owned by migrations, L1b.3)
-- SubscriptionTier herd_app_full_access intentionally NOT re-created here
-- (strict policies live in the L1b.3 migration; see note above).
DROP POLICY IF EXISTS herd_app_full_access ON public."SubscriptionRedemptionRule";
CREATE POLICY herd_app_full_access ON public."SubscriptionRedemptionRule"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."TierPricingSnapshot";
CREATE POLICY herd_app_full_access ON public."TierPricingSnapshot"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."FinancialSnapshot";
CREATE POLICY herd_app_full_access ON public."FinancialSnapshot"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

-- OpEx (4)
DROP POLICY IF EXISTS herd_app_full_access ON public."OpexCategory";
CREATE POLICY herd_app_full_access ON public."OpexCategory"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."OpexMilestoneLevel";
CREATE POLICY herd_app_full_access ON public."OpexMilestoneLevel"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."OpexItem";
CREATE POLICY herd_app_full_access ON public."OpexItem"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."OpexMilestone";
CREATE POLICY herd_app_full_access ON public."OpexMilestone"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

-- Perks & Community (4)
DROP POLICY IF EXISTS herd_app_full_access ON public."Perk";
CREATE POLICY herd_app_full_access ON public."Perk"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."PerkTierAssignment";
CREATE POLICY herd_app_full_access ON public."PerkTierAssignment"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."CommunityBenefit";
CREATE POLICY herd_app_full_access ON public."CommunityBenefit"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."CommunityBenefitTierAssignment";
CREATE POLICY herd_app_full_access ON public."CommunityBenefitTierAssignment"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

-- Admin & Settings (2)
DROP POLICY IF EXISTS herd_app_full_access ON public."Document";
CREATE POLICY herd_app_full_access ON public."Document"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS herd_app_full_access ON public."Setting";
CREATE POLICY herd_app_full_access ON public."Setting"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);

-- Integration catalog (1 — platform-wide).
-- This is the table that blocked Camada 1 smoke (Integration lookup via slug).
DROP POLICY IF EXISTS herd_app_full_access ON public."Integration";
CREATE POLICY herd_app_full_access ON public."Integration"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);
