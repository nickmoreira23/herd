-- Sub-etapa 26.2 — leitura vertical nas 18 policies tenant-scoped (ADR-001, 3.1).
--
-- Coração do #82. Habilita leitura vertical (pai vê descendentes) preservando
-- isolamento horizontal E mantendo ESCRITA exata (vertical write é 26.3).
--
-- MOLDE (uniforme nas 18 tabelas) — DOIS policies por tabela, DROP+CREATE
-- explícito (nunca ALTER):
--
--   <base>_tenant_isolation   FOR ALL
--       USING      (tenant_id = current_app_tenant_id()::uuid)   -- exato
--       WITH CHECK (tenant_id = current_app_tenant_id()::uuid)   -- exato
--   <base>_vertical_read      FOR SELECT
--       USING (tenant_id = ANY(current_app_tenant_ids()))        -- vertical
--
-- POR QUE DOIS POLICIES (refinamento do molde "single-policy USING vertical"):
--   DELETE consulta apenas USING (não tem WITH CHECK). Se o policy único
--   tivesse USING vertical, um DELETE do pai miraria linhas do filho — isso
--   é ESCRITA vertical (26.3), não 26.2. Além disso, a Extension só seta
--   app.tenant_ids em LEITURAS; num DELETE (write) o array fica unset, então
--   USING vertical (= ANY(NULL)) negaria TODO delete legítimo. Solução: a
--   leitura vertical fica num policy FOR SELECT dedicado (usa tenant_ids); o
--   FOR ALL exato governa INSERT/UPDATE/DELETE (usa tenant_id, sempre setado).
--   SELECT recebe os dois policies permissive em OR → vertical vence (superset).
--
--   Resultado por comando:
--     SELECT → exato OR vertical = vertical            (pai vê descendentes)
--     INSERT → WITH CHECK exato                        (só self)
--     UPDATE → USING exato + WITH CHECK exato          (só self)
--     DELETE → USING exato                             (só self; vertical delete = 26.3)
--
-- current_app_tenant_ids() já existe (migration 20260529020000). Apply
-- cirúrgico via DIRECT_URL (drift DEV; NÃO migrate dev). Verificar policies
-- pós-apply.

-- ════════════════════════════════════════════════════════════════════════
-- CLASSE A (15) — hoje USING-only, sem WITH CHECK. Ganham WITH CHECK exato
-- explícito + vertical_read.
-- ════════════════════════════════════════════════════════════════════════

-- IntegrationSyncLog
DROP POLICY IF EXISTS "isl_tenant_isolation" ON "IntegrationSyncLog";
CREATE POLICY "isl_tenant_isolation" ON "IntegrationSyncLog"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "isl_vertical_read" ON "IntegrationSyncLog";
CREATE POLICY "isl_vertical_read" ON "IntegrationSyncLog" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- IntegrationTierMapping
DROP POLICY IF EXISTS "itm_tenant_isolation" ON "IntegrationTierMapping";
CREATE POLICY "itm_tenant_isolation" ON "IntegrationTierMapping"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "itm_vertical_read" ON "IntegrationTierMapping";
CREATE POLICY "itm_vertical_read" ON "IntegrationTierMapping" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- IntegrationWebhookEvent
DROP POLICY IF EXISTS "iwe_tenant_isolation" ON "IntegrationWebhookEvent";
CREATE POLICY "iwe_tenant_isolation" ON "IntegrationWebhookEvent"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "iwe_vertical_read" ON "IntegrationWebhookEvent";
CREATE POLICY "iwe_vertical_read" ON "IntegrationWebhookEvent" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- member_connections
DROP POLICY IF EXISTS "mc_tenant_isolation" ON "member_connections";
CREATE POLICY "mc_tenant_isolation" ON "member_connections"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "mc_vertical_read" ON "member_connections";
CREATE POLICY "mc_vertical_read" ON "member_connections" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- payment_providers
DROP POLICY IF EXISTS "payment_providers_tenant_isolation" ON "payment_providers";
CREATE POLICY "payment_providers_tenant_isolation" ON "payment_providers"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "payment_providers_vertical_read" ON "payment_providers";
CREATE POLICY "payment_providers_vertical_read" ON "payment_providers" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- billing_customers
DROP POLICY IF EXISTS "billing_customers_tenant_isolation" ON "billing_customers";
CREATE POLICY "billing_customers_tenant_isolation" ON "billing_customers"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "billing_customers_vertical_read" ON "billing_customers";
CREATE POLICY "billing_customers_vertical_read" ON "billing_customers" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- payment_methods
DROP POLICY IF EXISTS "payment_methods_tenant_isolation" ON "payment_methods";
CREATE POLICY "payment_methods_tenant_isolation" ON "payment_methods"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "payment_methods_vertical_read" ON "payment_methods";
CREATE POLICY "payment_methods_vertical_read" ON "payment_methods" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- subscriptions
DROP POLICY IF EXISTS "subscriptions_tenant_isolation" ON "subscriptions";
CREATE POLICY "subscriptions_tenant_isolation" ON "subscriptions"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "subscriptions_vertical_read" ON "subscriptions";
CREATE POLICY "subscriptions_vertical_read" ON "subscriptions" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- charges
DROP POLICY IF EXISTS "charges_tenant_isolation" ON "charges";
CREATE POLICY "charges_tenant_isolation" ON "charges"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "charges_vertical_read" ON "charges";
CREATE POLICY "charges_vertical_read" ON "charges" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- charge_line_items
DROP POLICY IF EXISTS "charge_line_items_tenant_isolation" ON "charge_line_items";
CREATE POLICY "charge_line_items_tenant_isolation" ON "charge_line_items"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "charge_line_items_vertical_read" ON "charge_line_items";
CREATE POLICY "charge_line_items_vertical_read" ON "charge_line_items" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- invoices
DROP POLICY IF EXISTS "invoices_tenant_isolation" ON "invoices";
CREATE POLICY "invoices_tenant_isolation" ON "invoices"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "invoices_vertical_read" ON "invoices";
CREATE POLICY "invoices_vertical_read" ON "invoices" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- refunds
DROP POLICY IF EXISTS "refunds_tenant_isolation" ON "refunds";
CREATE POLICY "refunds_tenant_isolation" ON "refunds"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "refunds_vertical_read" ON "refunds";
CREATE POLICY "refunds_vertical_read" ON "refunds" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- dunning_attempts
DROP POLICY IF EXISTS "dunning_attempts_tenant_isolation" ON "dunning_attempts";
CREATE POLICY "dunning_attempts_tenant_isolation" ON "dunning_attempts"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "dunning_attempts_vertical_read" ON "dunning_attempts";
CREATE POLICY "dunning_attempts_vertical_read" ON "dunning_attempts" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- portal_sessions
DROP POLICY IF EXISTS "portal_sessions_tenant_isolation" ON "portal_sessions";
CREATE POLICY "portal_sessions_tenant_isolation" ON "portal_sessions"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "portal_sessions_vertical_read" ON "portal_sessions";
CREATE POLICY "portal_sessions_vertical_read" ON "portal_sessions" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- billing_events
DROP POLICY IF EXISTS "billing_events_tenant_isolation" ON "billing_events";
CREATE POLICY "billing_events_tenant_isolation" ON "billing_events"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "billing_events_vertical_read" ON "billing_events";
CREATE POLICY "billing_events_vertical_read" ON "billing_events" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- ════════════════════════════════════════════════════════════════════════
-- CLASSE B (1) — audit_logs já tem USING+WITH CHECK exato (FOR ALL). Recriado
-- idêntico (idempotência) + ganha vertical_read. SEM duplicar WITH CHECK.
-- ════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "audit_logs_tenant_isolation" ON "audit_logs";
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "audit_logs_vertical_read" ON "audit_logs";
CREATE POLICY "audit_logs_vertical_read" ON "audit_logs" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- ════════════════════════════════════════════════════════════════════════
-- CLASSE C (2) — dept/loc: REMOVER herd_app_full_access (anulava a RLS) +
-- aplicar o molde estrito (igual Classe A). Habilitado pelo #95 (telas/chat
-- agora sob withTenant).
-- ════════════════════════════════════════════════════════════════════════

-- departments
DROP POLICY IF EXISTS "departments_herd_app_full_access" ON "departments";
DROP POLICY IF EXISTS "departments_tenant_isolation" ON "departments";
CREATE POLICY "departments_tenant_isolation" ON "departments"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "departments_vertical_read" ON "departments";
CREATE POLICY "departments_vertical_read" ON "departments" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));

-- Location
DROP POLICY IF EXISTS "Location_herd_app_full_access" ON "Location";
DROP POLICY IF EXISTS "Location_tenant_isolation" ON "Location";
CREATE POLICY "Location_tenant_isolation" ON "Location"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "Location_vertical_read" ON "Location";
CREATE POLICY "Location_vertical_read" ON "Location" FOR SELECT
  USING ("tenant_id" = ANY(current_app_tenant_ids()));
