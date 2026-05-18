-- Sub-etapa 4, Tarefa 3 — RLS infrastructure setup.
--
-- 1. Helper function that exposes the `app.tenant_id` GUC (set by the Prisma
--    Extension at the start of each tenant-scoped operation transaction).
--    `missing_ok = true` (second arg) returns NULL instead of erroring when
--    the GUC has not been set on the connection — required so non-scoped
--    queries don't crash on a missing setting.
-- 2. Enable Row Level Security on the 4 tenant-scoped tables. No strict
--    policies yet for MC/ITM/ISL (added in rls_isl_canary and rls_itm_mc).
--    A permissive policy is added immediately for IWE because its
--    `tenant_id` column is still nullable (Sub-etapa 6 will tighten to NOT
--    NULL and replace the permissive policy with a strict one).
--
-- Note on table names: Prisma model `MemberConnection` is mapped to the
-- physical table `member_connections` via `@@map`. The other three tables
-- use their Prisma model name as the physical table name (PascalCase).

CREATE OR REPLACE FUNCTION current_app_tenant_id()
RETURNS TEXT AS $$
  SELECT current_setting('app.tenant_id', TRUE);
$$ LANGUAGE sql STABLE;

ALTER TABLE "member_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationTierMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationSyncLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IntegrationWebhookEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iwe_temp_permissive" ON "IntegrationWebhookEvent"
  USING (true);
