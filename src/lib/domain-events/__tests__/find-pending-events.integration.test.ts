import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { emitDomainEvent } from "../emit-domain-event";
import { findPendingEvents } from "../find-pending-events";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("findPendingEvents — integration", () => {
  const createdIds: string[] = [];

  beforeAll(async () => {
    // Seed 3 fresh events for testing.
    for (let i = 0; i < 3; i++) {
      const e = await prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test_find_pending",
            aggregateId: crypto.randomUUID(),
            eventType: "test.find-pending",
            payload: { i },
          },
          tx,
        ),
      );
      createdIds.push(e.id);
    }
  });

  afterAll(async () => {
    // Clean up our test events.
    await prisma.domainEvent.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.$disconnect();
  });

  it("returns pending events in order of occurredAt", async () => {
    const found = await prisma.$transaction(async (tx) => findPendingEvents(100, tx));
    const ours = found.filter((e) => createdIds.includes(e.id));
    expect(ours.length).toBe(3);
    // Should be ordered by occurredAt ASC.
    for (let i = 1; i < ours.length; i++) {
      expect(ours[i].occurredAt.getTime()).toBeGreaterThanOrEqual(
        ours[i - 1].occurredAt.getTime(),
      );
    }
  });

  it("respects limit", async () => {
    const found = await prisma.$transaction(async (tx) => findPendingEvents(2, tx));
    expect(found.length).toBeLessThanOrEqual(2);
  });

  it("does not return processed events", async () => {
    const targetId = createdIds[0];
    await prisma.domainEvent.update({
      where: { id: targetId },
      data: { processedAt: new Date(), attempts: 1 },
    });
    const found = await prisma.$transaction(async (tx) => findPendingEvents(100, tx));
    expect(found.find((e) => e.id === targetId)).toBeUndefined();
  });

  it("does not return exhausted events (attempts >= 5)", async () => {
    const targetId = createdIds[1];
    await prisma.domainEvent.update({
      where: { id: targetId },
      data: { attempts: 5, nextAttemptAt: null },
    });
    const found = await prisma.$transaction(async (tx) => findPendingEvents(100, tx));
    expect(found.find((e) => e.id === targetId)).toBeUndefined();
  });

  it("does not return events scheduled in the future", async () => {
    const targetId = createdIds[2];
    const future = new Date(Date.now() + 1000 * 60 * 60); // +1h
    await prisma.domainEvent.update({
      where: { id: targetId },
      data: { attempts: 1, nextAttemptAt: future },
    });
    const found = await prisma.$transaction(async (tx) => findPendingEvents(100, tx));
    expect(found.find((e) => e.id === targetId)).toBeUndefined();
  });
});
