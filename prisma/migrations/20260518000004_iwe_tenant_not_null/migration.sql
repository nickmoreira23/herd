-- Sub-etapa 6, Tarefa 5 — promote IntegrationWebhookEvent.tenant_id to
-- NOT NULL and replace the permissive RLS policy with a strict one.
--
-- Backfill: not required. `IntegrationWebhookEvent` was empty in DEV at
-- the start of Sub-etapa 6 (confirmed via discovery query). All new rows
-- post Sub-etapa 5 are written through `gorgiasHandler` inside withTenant,
-- so tenant_id is always populated. NOT NULL formalizes the invariant.
--
-- Policy: `iwe_temp_permissive` (Sub-etapa 4) was a placeholder while the
-- column was nullable. Replaced with `iwe_tenant_isolation` matching the
-- same `::uuid` cast + NULLIF-via-helper pattern used by the other strict
-- policies (Sub-etapa 4: rls_isl_canary, rls_itm_mc, rls_fn_nullif).

ALTER TABLE "IntegrationWebhookEvent"
  ALTER COLUMN "tenant_id" SET NOT NULL;

DROP POLICY "iwe_temp_permissive" ON "IntegrationWebhookEvent";

CREATE POLICY "iwe_tenant_isolation" ON "IntegrationWebhookEvent"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
