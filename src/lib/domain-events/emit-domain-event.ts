import type { Prisma, PrismaClient, DomainEvent } from "@prisma/client";
import type { EmitDomainEventInput } from "./types";
import { IdempotencyConflictError } from "./errors";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Emits a new domain event in the outbox. MUST be called within an open
 * transaction — the `client` parameter is required and has no default.
 *
 * The transactional contract: this helper writes the event to the
 * `domain_events` table inside the same transaction that produced the
 * domain change. If the transaction rolls back, the event vanishes with it.
 *
 * Idempotency: if `idempotencyKey` is provided and an event with the same
 * key already exists:
 *  - If aggregateType+aggregateId+eventType+payload are equivalent,
 *    returns the existing event silently (safe replay).
 *  - Otherwise, throws `IdempotencyConflictError`.
 *
 * @throws IdempotencyConflictError, RangeError (invalid input)
 */
export async function emitDomainEvent(
  input: EmitDomainEventInput,
  client: PrismaClient | Prisma.TransactionClient,
): Promise<DomainEvent> {
  if (!UUID_REGEX.test(input.aggregateId)) {
    throw new RangeError(`aggregateId "${input.aggregateId}" is not a valid UUID.`);
  }
  if (!input.eventType || input.eventType.trim().length === 0) {
    throw new RangeError("eventType is required and must be non-empty.");
  }
  if (!input.aggregateType || input.aggregateType.trim().length === 0) {
    throw new RangeError("aggregateType is required and must be non-empty.");
  }

  const occurredAt = input.occurredAt ?? new Date();
  const payload = input.payload ?? {};

  // Idempotency check
  if (input.idempotencyKey) {
    const existing = await client.domainEvent.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      const sameAggregate =
        existing.aggregateType === input.aggregateType &&
        existing.aggregateId === input.aggregateId &&
        existing.eventType === input.eventType;
      const samePayload =
        JSON.stringify(existing.payload) === JSON.stringify(payload);
      if (sameAggregate && samePayload) {
        return existing;
      }
      const reason = !sameAggregate
        ? `aggregate or eventType differ`
        : `payload differs`;
      throw new IdempotencyConflictError(input.idempotencyKey, reason);
    }
  }

  return client.domainEvent.create({
    data: {
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      eventType: input.eventType,
      payload: payload as Prisma.InputJsonValue,
      occurredAt,
      idempotencyKey: input.idempotencyKey,
    },
  });
}
