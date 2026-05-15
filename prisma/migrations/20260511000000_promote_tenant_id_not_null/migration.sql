-- Migration 003: Promote tenant_id to NOT NULL on IntegrationTierMapping and IntegrationSyncLog

-- Backfill ITM (safety net — should be 0 rows in DEV with withTenant already applied)
UPDATE "IntegrationTierMapping" itm
SET tenant_id = (
  SELECT o.id FROM "organizations" o ORDER BY o.created_at ASC LIMIT 1
)
WHERE itm.tenant_id IS NULL;

-- Assert ITM
DO $$
DECLARE null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "IntegrationTierMapping" WHERE tenant_id IS NULL;
  IF null_count > 0 THEN RAISE EXCEPTION 'ITM backfill incomplete: % rows still NULL', null_count; END IF;
END $$;

-- Promote ITM
ALTER TABLE "IntegrationTierMapping" ALTER COLUMN "tenant_id" SET NOT NULL;

-- Backfill ISL (all ISL writers are now wrapped in withTenant for admin routes;
-- oauth/callback is deferred but has no prod data yet)
UPDATE "IntegrationSyncLog" isl
SET tenant_id = (
  SELECT o.id FROM "organizations" o ORDER BY o.created_at ASC LIMIT 1
)
WHERE isl.tenant_id IS NULL;

-- Assert ISL
DO $$
DECLARE null_count INT;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "IntegrationSyncLog" WHERE tenant_id IS NULL;
  IF null_count > 0 THEN RAISE EXCEPTION 'ISL backfill incomplete: % rows still NULL', null_count; END IF;
END $$;

-- Promote ISL
ALTER TABLE "IntegrationSyncLog" ALTER COLUMN "tenant_id" SET NOT NULL;
