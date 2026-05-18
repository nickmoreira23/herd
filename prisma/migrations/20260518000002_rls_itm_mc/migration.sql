-- Sub-etapa 4, Tarefa G — strict RLS policies on IntegrationTierMapping and
-- member_connections (broader RLS rollout post-ISL canary).
--
-- Same pattern as `isl_tenant_isolation`:
--  - tenant_id (UUID) compared against current_app_tenant_id() cast to UUID.
--  - `current_app_tenant_id()` was updated in rls_fn_nullif to return NULL on
--    empty GUC, so no-context queries hit `tenant_id = NULL` → false → no rows.
--
-- Table names:
--  - IntegrationTierMapping uses the Prisma model name directly (no @@map).
--  - MemberConnection is mapped to physical table `member_connections`.

CREATE POLICY "itm_tenant_isolation" ON "IntegrationTierMapping"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

CREATE POLICY "mc_tenant_isolation" ON "member_connections"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
