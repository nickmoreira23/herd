import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { emitDomainEvent } from "../emit-domain-event";
import { IdempotencyConflictError } from "../errors";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("emitDomainEvent — integration", () => {
  afterAll(async () => prisma.$disconnect());

  it("creates an event with default occurredAt and empty payload", async () => {
    const event = await prisma.$transaction(async (tx) =>
      emitDomainEvent(
        {
          aggregateType: "test_aggregate",
          aggregateId: crypto.randomUUID(),
          eventType: "test.created",
        },
        tx,
      ),
    );
    expect(event.id).toBeDefined();
    expect(event.eventType).toBe("test.created");
    expect(event.processedAt).toBeNull();
    expect(event.attempts).toBe(0);
  });

  it("respects provided occurredAt and payload", async () => {
    const occurredAt = new Date("2024-01-01T10:00:00.000Z");
    const payload = { foo: "bar", n: 42 };
    const event = await prisma.$transaction(async (tx) =>
      emitDomainEvent(
        {
          aggregateType: "test_aggregate",
          aggregateId: crypto.randomUUID(),
          eventType: "test.created",
          occurredAt,
          payload,
        },
        tx,
      ),
    );
    expect(event.occurredAt.toISOString()).toBe(occurredAt.toISOString());
    expect(event.payload).toEqual(payload);
  });

  it("idempotency: same key + same payload returns existing event", async () => {
    const key = `test-emit-idempotency-${Date.now()}`;
    const aggregateId = crypto.randomUUID();
    const first = await prisma.$transaction(async (tx) =>
      emitDomainEvent(
        {
          aggregateType: "test",
          aggregateId,
          eventType: "test.idempotent",
          payload: { x: 1 },
          idempotencyKey: key,
        },
        tx,
      ),
    );
    const second = await prisma.$transaction(async (tx) =>
      emitDomainEvent(
        {
          aggregateType: "test",
          aggregateId,
          eventType: "test.idempotent",
          payload: { x: 1 },
          idempotencyKey: key,
        },
        tx,
      ),
    );
    expect(second.id).toBe(first.id);
  });

  it("idempotency: same key + different payload throws", async () => {
    const key = `test-emit-conflict-${Date.now()}`;
    const aggregateId = crypto.randomUUID();
    await prisma.$transaction(async (tx) =>
      emitDomainEvent(
        {
          aggregateType: "test",
          aggregateId,
          eventType: "test.conflict",
          payload: { x: 1 },
          idempotencyKey: key,
        },
        tx,
      ),
    );
    await expect(
      prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test",
            aggregateId,
            eventType: "test.conflict",
            payload: { x: 2 }, // different
            idempotencyKey: key,
          },
          tx,
        ),
      ),
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
  });

  it("rejects invalid aggregateId", async () => {
    await expect(
      prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test",
            aggregateId: "not-a-uuid",
            eventType: "test.invalid",
          },
          tx,
        ),
      ),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it("rejects empty eventType", async () => {
    await expect(
      prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test",
            aggregateId: crypto.randomUUID(),
            eventType: "",
          },
          tx,
        ),
      ),
    ).rejects.toBeInstanceOf(RangeError);
  });
});
