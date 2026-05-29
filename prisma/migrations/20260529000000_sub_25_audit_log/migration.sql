-- Sub-etapa 25: Audit Log
-- Strict tenant-scoped append-only audit trail of sensitive actions.
-- Mirrors the BillingEvent molde: tenant_id NOT NULL + RLS tenant_isolation
-- ONLY (no herd_app_full_access permissive policy).
-- actor_profile_id is nullable + ON DELETE SET NULL so the audit row survives
-- profile deletion. resource_id is TEXT (generic) — covers invite tokens,
-- department/location UUIDs, etc.

CREATE TABLE "audit_logs" (
  "id"               UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"        UUID NOT NULL,
  "actor_profile_id" UUID,
  "action"           TEXT NOT NULL,
  "resource_type"    TEXT NOT NULL,
  "resource_id"      TEXT NOT NULL,
  "metadata"         JSONB NOT NULL DEFAULT '{}',
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "audit_logs_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "audit_logs_actor_fkey"
    FOREIGN KEY ("actor_profile_id") REFERENCES "network_profiles"("id") ON DELETE SET NULL
);

CREATE INDEX "audit_logs_tenant_idx"     ON "audit_logs" ("tenant_id");
CREATE INDEX "audit_logs_resource_idx"   ON "audit_logs" ("resource_type", "resource_id");
CREATE INDEX "audit_logs_action_idx"     ON "audit_logs" ("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at");
CREATE INDEX "audit_logs_actor_idx"      ON "audit_logs" ("actor_profile_id");

-- RLS: strict tenant isolation (BillingEvent molde — single policy, no
-- herd_app_full_access). WITH CHECK is made explicit here (even though
-- Postgres would derive it from USING when omitted) because audit_logs is a
-- write-heavy table and INSERT/UPDATE tenant enforcement must be unambiguous.
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_tenant_isolation" ON "audit_logs"
  USING ("tenant_id" = current_app_tenant_id()::uuid)
  WITH CHECK ("tenant_id" = current_app_tenant_id()::uuid);
