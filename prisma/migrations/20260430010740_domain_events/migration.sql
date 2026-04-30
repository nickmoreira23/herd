-- CreateTable
CREATE TABLE "domain_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "idempotencyKey" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "nextAttemptAt" TIMESTAMP(3),

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_events_idempotencyKey_key" ON "domain_events"("idempotencyKey");

-- CreateIndex
CREATE INDEX "domain_events_processedAt_nextAttemptAt_idx" ON "domain_events"("processedAt", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "domain_events_aggregateType_aggregateId_idx" ON "domain_events"("aggregateType", "aggregateId");

-- CreateIndex
CREATE INDEX "domain_events_eventType_idx" ON "domain_events"("eventType");

-- ============================================================
-- Partial index optimization for the worker query.
-- Index only rows that are pending (processedAt IS NULL); the temporal
-- filter (nextAttemptAt <= NOW()) lives in the worker query itself
-- because Postgres treats NOW() in a partial index WHERE as a constant
-- evaluated at index-creation time, which is not what we want.
-- ============================================================
CREATE INDEX idx_domain_events_pending_due
  ON domain_events ("nextAttemptAt", "occurredAt")
  WHERE "processedAt" IS NULL;
