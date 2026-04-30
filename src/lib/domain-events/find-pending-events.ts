import type { Prisma, PrismaClient, DomainEvent } from "@prisma/client";

/**
 * Returns the next batch of events ready to be processed, locked for the
 * caller via SELECT FOR UPDATE SKIP LOCKED.
 *
 * Criteria for "pending and due":
 *  - processedAt IS NULL (not yet succeeded)
 *  - AND (attempts = 0 OR nextAttemptAt <= NOW())
 *  - AND NOT (attempts >= MAX_ATTEMPTS) — exhausted events are skipped
 *
 * Locked rows remain locked until the caller's transaction commits or rolls
 * back. This means the caller MUST process events within a transaction
 * boundary or the locks will be released without progress being recorded.
 *
 * Ordered by occurredAt ASC (oldest events processed first).
 *
 * MUST be called inside a transaction. The `client` parameter is required.
 */
export async function findPendingEvents(
  limit: number,
  client: PrismaClient | Prisma.TransactionClient,
): Promise<DomainEvent[]> {
  // Prisma does not natively expose SELECT FOR UPDATE SKIP LOCKED, so we use
  // raw SQL. Result rows are typed manually below.
  const rows = await client.$queryRaw<DomainEvent[]>`
    SELECT *
    FROM domain_events
    WHERE "processedAt" IS NULL
      AND ("nextAttemptAt" IS NULL OR "nextAttemptAt" <= NOW())
      AND ("nextAttemptAt" IS NOT NULL OR "attempts" = 0)
      AND "attempts" < 5
    ORDER BY "occurredAt" ASC
    LIMIT ${limit}
    FOR UPDATE SKIP LOCKED
  `;
  return rows;
}
