-- Sub-etapa 9 — Payment Provider Layer schema.
--
-- 11 tables modeling the canonical billing surface that any payment provider
-- (first consumer: Recharge) maps into. All tables are tenant-scoped (RLS
-- strict policy + `tenant_id NOT NULL` + FK to Organization) and preserve
-- the raw provider payload in `provider_data JSONB` for audit/replay.
--
-- Naming:
--   - DB tables: snake_case_plural (matches the @@map convention of the
--     rest of the post-Camada-1 schema)
--   - Prisma models: PascalCase singular (added in schema.prisma)
--
-- FK shape per table (except payment_providers itself):
--   tenant_id   → Organization(id), ON DELETE CASCADE
--   provider_id → payment_providers(id), ON DELETE RESTRICT
--                 (deleting a configured provider is a deliberate operation,
--                  not a side-effect of org/tenant teardown)
--
-- Uniqueness: every table that mirrors a provider entity carries
-- UNIQUE (provider_id, external_id). charge_line_items doesn't (it's a
-- junction with no provider entity counterpart) and billing_events
-- doesn't (it's an internal audit log, no provider external_id).
--
-- Integration with the Ledger primitives (Account/JournalEntry/JournalLine)
-- is Camada 3 — `JournalEntry.sourceKind='charge'` linkage lands then. This
-- migration only stands up the billing surface; no journal entries written.

-- ─── ChargeStatus enum (canonical, 8 states) ─────────────────────────
CREATE TYPE "ChargeStatus" AS ENUM (
  'QUEUED',
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'SKIPPED',
  'CANCELLED'
);

-- ─── 1. payment_providers (catalog of connected providers per tenant) ─
-- No provider_id FK (this table IS the provider registry). slug uniqueness
-- is per-tenant since each Organization may connect different providers.
CREATE TABLE "payment_providers" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL,
  "slug"          TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "category"      TEXT NOT NULL,
  "provider_data" JSONB NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "payment_providers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_providers_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "payment_providers_tenant_slug_unique" UNIQUE ("tenant_id", "slug")
);
CREATE INDEX "payment_providers_tenant_idx" ON "payment_providers" ("tenant_id");

ALTER TABLE "payment_providers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_providers_tenant_isolation" ON "payment_providers"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 2. billing_customers ────────────────────────────────────────────
CREATE TABLE "billing_customers" (
  "id"                    UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"             UUID NOT NULL,
  "provider_id"           UUID NOT NULL,
  "external_id"           TEXT NOT NULL,
  "email"                 TEXT,
  "name"                  TEXT,
  "member_connection_id"  UUID,
  "provider_data"         JSONB NOT NULL DEFAULT '{}',
  "created_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "billing_customers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_customers_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "billing_customers_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "billing_customers_member_connection_fkey"
    FOREIGN KEY ("member_connection_id") REFERENCES "member_connections"("id") ON DELETE SET NULL,
  CONSTRAINT "billing_customers_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "billing_customers_tenant_idx" ON "billing_customers" ("tenant_id");
CREATE INDEX "billing_customers_member_connection_idx" ON "billing_customers" ("member_connection_id");

ALTER TABLE "billing_customers" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_customers_tenant_isolation" ON "billing_customers"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 3. payment_methods ──────────────────────────────────────────────
CREATE TABLE "payment_methods" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL,
  "provider_id"   UUID NOT NULL,
  "external_id"   TEXT NOT NULL,
  "customer_id"   UUID NOT NULL,
  "type"          TEXT NOT NULL,
  "last4"         TEXT,
  "brand"         TEXT,
  "is_default"    BOOLEAN NOT NULL DEFAULT false,
  "provider_data" JSONB NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_methods_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "payment_methods_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "payment_methods_customer_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE,
  CONSTRAINT "payment_methods_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "payment_methods_tenant_idx" ON "payment_methods" ("tenant_id");
CREATE INDEX "payment_methods_customer_idx" ON "payment_methods" ("customer_id");

ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_methods_tenant_isolation" ON "payment_methods"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 4. subscriptions ────────────────────────────────────────────────
CREATE TABLE "subscriptions" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"         UUID NOT NULL,
  "provider_id"       UUID NOT NULL,
  "external_id"       TEXT NOT NULL,
  "customer_id"       UUID NOT NULL,
  "payment_method_id" UUID,
  "tier_id"           UUID,
  "status"            TEXT NOT NULL,
  "next_charge_at"    TIMESTAMPTZ,
  "cancelled_at"      TIMESTAMPTZ,
  "provider_data"     JSONB NOT NULL DEFAULT '{}',
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "subscriptions_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "subscriptions_customer_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE,
  CONSTRAINT "subscriptions_payment_method_fkey"
    FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL,
  CONSTRAINT "subscriptions_tier_fkey"
    FOREIGN KEY ("tier_id") REFERENCES "SubscriptionTier"("id") ON DELETE SET NULL,
  CONSTRAINT "subscriptions_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "subscriptions_tenant_idx" ON "subscriptions" ("tenant_id");
CREATE INDEX "subscriptions_customer_idx" ON "subscriptions" ("customer_id");
CREATE INDEX "subscriptions_tier_idx" ON "subscriptions" ("tier_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" ("status");

ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_tenant_isolation" ON "subscriptions"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 5. charges ──────────────────────────────────────────────────────
CREATE TABLE "charges" (
  "id"                UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"         UUID NOT NULL,
  "provider_id"       UUID NOT NULL,
  "external_id"       TEXT NOT NULL,
  "customer_id"       UUID NOT NULL,
  "payment_method_id" UUID,
  "status"            "ChargeStatus" NOT NULL,
  "amount_cents"      INTEGER NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'USD',
  "processed_at"      TIMESTAMPTZ,
  "failed_at"         TIMESTAMPTZ,
  "failure_reason"    TEXT,
  "provider_data"     JSONB NOT NULL DEFAULT '{}',
  "created_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "charges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "charges_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "charges_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "charges_customer_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE,
  CONSTRAINT "charges_payment_method_fkey"
    FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE SET NULL,
  CONSTRAINT "charges_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "charges_tenant_idx" ON "charges" ("tenant_id");
CREATE INDEX "charges_customer_idx" ON "charges" ("customer_id");
CREATE INDEX "charges_status_idx" ON "charges" ("status");
CREATE INDEX "charges_processed_at_idx" ON "charges" ("processed_at");

ALTER TABLE "charges" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charges_tenant_isolation" ON "charges"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 6. charge_line_items (junction N:N charge ↔ subscription) ───────
-- No provider_id / external_id — the line item is an internal split of a
-- composite charge into per-subscription portions; the provider doesn't
-- expose it as a standalone entity.
CREATE TABLE "charge_line_items" (
  "id"              UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"       UUID NOT NULL,
  "charge_id"       UUID NOT NULL,
  "subscription_id" UUID NOT NULL,
  "amount_cents"    INTEGER NOT NULL,
  "provider_data"   JSONB NOT NULL DEFAULT '{}',
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "charge_line_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "charge_line_items_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "charge_line_items_charge_fkey"
    FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE,
  CONSTRAINT "charge_line_items_subscription_fkey"
    FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE,
  CONSTRAINT "charge_line_items_charge_subscription_unique" UNIQUE ("charge_id", "subscription_id")
);
CREATE INDEX "charge_line_items_tenant_idx" ON "charge_line_items" ("tenant_id");
CREATE INDEX "charge_line_items_charge_idx" ON "charge_line_items" ("charge_id");
CREATE INDEX "charge_line_items_subscription_idx" ON "charge_line_items" ("subscription_id");

ALTER TABLE "charge_line_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charge_line_items_tenant_isolation" ON "charge_line_items"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 7. invoices ─────────────────────────────────────────────────────
CREATE TABLE "invoices" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"      UUID NOT NULL,
  "provider_id"    UUID NOT NULL,
  "external_id"    TEXT NOT NULL,
  "charge_id"      UUID NOT NULL,
  "invoice_number" TEXT,
  "pdf_url"        TEXT,
  "issued_at"      TIMESTAMPTZ,
  "provider_data"  JSONB NOT NULL DEFAULT '{}',
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invoices_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "invoices_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "invoices_charge_fkey"
    FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE,
  CONSTRAINT "invoices_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "invoices_tenant_idx" ON "invoices" ("tenant_id");
CREATE INDEX "invoices_charge_idx" ON "invoices" ("charge_id");

ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_tenant_isolation" ON "invoices"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 8. refunds ──────────────────────────────────────────────────────
CREATE TABLE "refunds" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL,
  "provider_id"   UUID NOT NULL,
  "external_id"   TEXT NOT NULL,
  "charge_id"     UUID NOT NULL,
  "amount_cents"  INTEGER NOT NULL,
  "reason"        TEXT,
  "refunded_at"   TIMESTAMPTZ,
  "provider_data" JSONB NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "refunds_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "refunds_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "refunds_charge_fkey"
    FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE,
  CONSTRAINT "refunds_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "refunds_tenant_idx" ON "refunds" ("tenant_id");
CREATE INDEX "refunds_charge_idx" ON "refunds" ("charge_id");

ALTER TABLE "refunds" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds_tenant_isolation" ON "refunds"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 9. dunning_attempts ─────────────────────────────────────────────
CREATE TABLE "dunning_attempts" (
  "id"             UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"      UUID NOT NULL,
  "provider_id"    UUID NOT NULL,
  "external_id"    TEXT NOT NULL,
  "charge_id"      UUID NOT NULL,
  "attempt_number" INTEGER NOT NULL,
  "attempted_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "outcome"        TEXT NOT NULL,
  "provider_data"  JSONB NOT NULL DEFAULT '{}',
  "created_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "dunning_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dunning_attempts_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "dunning_attempts_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "dunning_attempts_charge_fkey"
    FOREIGN KEY ("charge_id") REFERENCES "charges"("id") ON DELETE CASCADE,
  CONSTRAINT "dunning_attempts_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "dunning_attempts_tenant_idx" ON "dunning_attempts" ("tenant_id");
CREATE INDEX "dunning_attempts_charge_idx" ON "dunning_attempts" ("charge_id");

ALTER TABLE "dunning_attempts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dunning_attempts_tenant_isolation" ON "dunning_attempts"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 10. portal_sessions ─────────────────────────────────────────────
CREATE TABLE "portal_sessions" (
  "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL,
  "provider_id"   UUID NOT NULL,
  "external_id"   TEXT NOT NULL,
  "customer_id"   UUID NOT NULL,
  "session_url"   TEXT NOT NULL,
  "expires_at"    TIMESTAMPTZ NOT NULL,
  "provider_data" JSONB NOT NULL DEFAULT '{}',
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "portal_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "portal_sessions_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "portal_sessions_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT,
  CONSTRAINT "portal_sessions_customer_fkey"
    FOREIGN KEY ("customer_id") REFERENCES "billing_customers"("id") ON DELETE CASCADE,
  CONSTRAINT "portal_sessions_provider_external_unique" UNIQUE ("provider_id", "external_id")
);
CREATE INDEX "portal_sessions_tenant_idx" ON "portal_sessions" ("tenant_id");
CREATE INDEX "portal_sessions_customer_idx" ON "portal_sessions" ("customer_id");

ALTER TABLE "portal_sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_sessions_tenant_isolation" ON "portal_sessions"
  USING ("tenant_id" = current_app_tenant_id()::uuid);

-- ─── 11. billing_events (internal audit log) ─────────────────────────
-- No external_id (internal-only audit) but we keep provider_id so events
-- can be filtered by source. payload is JSONB for arbitrary domain detail.
CREATE TABLE "billing_events" (
  "id"          UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id"   UUID NOT NULL,
  "provider_id" UUID NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id"   UUID NOT NULL,
  "event_type"  TEXT NOT NULL,
  "payload"     JSONB NOT NULL DEFAULT '{}',
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_events_tenant_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "billing_events_provider_fkey"
    FOREIGN KEY ("provider_id") REFERENCES "payment_providers"("id") ON DELETE RESTRICT
);
CREATE INDEX "billing_events_tenant_idx" ON "billing_events" ("tenant_id");
CREATE INDEX "billing_events_entity_idx" ON "billing_events" ("entity_type", "entity_id");
CREATE INDEX "billing_events_event_type_idx" ON "billing_events" ("event_type");
CREATE INDEX "billing_events_created_at_idx" ON "billing_events" ("created_at");

ALTER TABLE "billing_events" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_events_tenant_isolation" ON "billing_events"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
