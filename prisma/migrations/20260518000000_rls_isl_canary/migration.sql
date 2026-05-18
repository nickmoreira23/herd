-- Sub-etapa 4, Tarefa E.2 — RLS strict policy on IntegrationSyncLog (canary).
--
-- Replaces deny-all (RLS ON + no policy) with tenant-scoped access:
-- a row is visible to a session only if `app.tenant_id` GUC matches the row's
-- tenant_id. The GUC is set by `src/lib/tenancy/prisma-extension.ts` inside
-- an implicit `$transaction` opened for each tenant-scoped operation.
--
-- ISL is the canary because:
--  - tenant_id is NOT NULL since Migration 003
--  - it has the highest write volume of the 4 tenant-scoped tables
--  - issues here surface in the integration sync log directly
--
-- After 24h soak with no anomalies, the same pattern is applied to
-- IntegrationTierMapping and member_connections (rls_itm_mc).

-- Cast on the RHS: `current_app_tenant_id()` returns TEXT (via Postgres
-- `current_setting(...)` which is text-typed). `tenant_id` is UUID. Cast to
-- uuid keeps the index on tenant_id usable. NULL coercion: a NULL GUC stays
-- NULL after cast, and `tenant_id = NULL` is always false → no rows visible
-- without a tenant context. That's the desired deny-by-default behavior.
CREATE POLICY "isl_tenant_isolation" ON "IntegrationSyncLog"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
