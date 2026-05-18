-- Sub-etapa 6, Tarefa 1 — webhook deduplication ledger.
--
-- One row per (provider, event_id) we've acknowledged. The unique constraint
-- is the load-bearing primitive: a duplicate insert raises a unique-violation
-- which the application catches to short-circuit reprocessing.
--
-- `received_at` records when the ack arrived (used by the eventual TTL cleanup
-- job). `expires_at` is a DB-side computed default = received_at + 30 days,
-- materialized at insert so a single index on `expires_at` answers "what's
-- safe to delete?" without recomputing per row.
--
-- No `tenant_id` and no RLS: dedup keys are provider-scoped (Recharge events,
-- Gorgias events) and tenants don't share namespaces with the provider. The
-- same `event_id` cannot legitimately appear under two tenants from the same
-- provider; if it ever does, the second arrival is a genuine duplicate to
-- swallow regardless of which tenant it would have routed to.
--
-- Migration runs as postgres (DIRECT_URL = owner role), so CREATE TABLE
-- succeeds. ALTER DEFAULT PRIVILEGES FOR ROLE postgres (Sub-etapa 4) grants
-- ALL on the new table to herd_app automatically — no manual GRANT.

CREATE TABLE "webhook_dedup" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "provider"    TEXT        NOT NULL,
  "event_id"    TEXT        NOT NULL,
  "received_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expires_at"  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 days'),

  CONSTRAINT "webhook_dedup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "webhook_dedup_provider_event_id_key"
  ON "webhook_dedup" ("provider", "event_id");

CREATE INDEX "webhook_dedup_expires_at_idx"
  ON "webhook_dedup" ("expires_at");
