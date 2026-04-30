import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { emitDomainEvent } from "../emit-domain-event";
import { processPendingEvents } from "../process-pending-events";
import { HANDLER_REGISTRY } from "../handler-registry";
import type { DomainEventHandler } from "../types";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL required");
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("processPendingEvents — integration", () => {
  const testIds: string[] = [];

  afterAll(async () => {
    if (testIds.length > 0) {
      await prisma.domainEvent.deleteMany({ where: { id: { in: testIds } } });
    }
    await prisma.$disconnect();
  });

  it("marks events with no handler as no-handler and processed", async () => {
    const e = await prisma.$transaction(async (tx) =>
      emitDomainEvent(
        {
          aggregateType: "test_proc",
          aggregateId: crypto.randomUUID(),
          eventType: "test.no-handler-registered",
        },
        tx,
      ),
    );
    testIds.push(e.id);

    const result = await processPendingEvents({ limit: 10 }, prisma);
    const fresh = await prisma.domainEvent.findUnique({ where: { id: e.id } });
    expect(fresh!.processedAt).not.toBeNull();
    expect(fresh!.attempts).toBe(1);
    expect(fresh!.lastError).toContain("No handler");
    expect(result.noHandler).toBeGreaterThanOrEqual(1);
  });

  it("runs a registered handler and marks event as succeeded", async () => {
    let invoked = false;
    const eventType = `test.success-${Date.now()}`;
    const handler: DomainEventHandler = async () => {
      invoked = true;
    };
    HANDLER_REGISTRY[eventType] = handler;

    try {
      const e = await prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test_proc",
            aggregateId: crypto.randomUUID(),
            eventType,
          },
          tx,
        ),
      );
      testIds.push(e.id);

      await processPendingEvents({ limit: 10 }, prisma);
      const fresh = await prisma.domainEvent.findUnique({ where: { id: e.id } });
      expect(invoked).toBe(true);
      expect(fresh!.processedAt).not.toBeNull();
      expect(fresh!.attempts).toBe(1);
      expect(fresh!.lastError).toBeNull();
    } finally {
      delete HANDLER_REGISTRY[eventType];
    }
  });

  it("retries failed handler with backoff", async () => {
    const eventType = `test.failing-${Date.now()}`;
    HANDLER_REGISTRY[eventType] = async () => {
      throw new Error("intentional failure");
    };

    try {
      const e = await prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test_proc",
            aggregateId: crypto.randomUUID(),
            eventType,
          },
          tx,
        ),
      );
      testIds.push(e.id);

      await processPendingEvents({ limit: 10 }, prisma);
      const fresh = await prisma.domainEvent.findUnique({ where: { id: e.id } });
      expect(fresh!.attempts).toBe(1);
      expect(fresh!.processedAt).toBeNull();
      expect(fresh!.lastError).toContain("intentional failure");
      expect(fresh!.nextAttemptAt).not.toBeNull();
    } finally {
      delete HANDLER_REGISTRY[eventType];
    }
  });

  it("exhausts after MAX_ATTEMPTS failures", async () => {
    const eventType = `test.exhausting-${Date.now()}`;
    HANDLER_REGISTRY[eventType] = async () => {
      throw new Error("perpetual failure");
    };

    try {
      const e = await prisma.$transaction(async (tx) =>
        emitDomainEvent(
          {
            aggregateType: "test_proc",
            aggregateId: crypto.randomUUID(),
            eventType,
          },
          tx,
        ),
      );
      testIds.push(e.id);

      // Manually fast-forward attempts to simulate prior failed runs.
      // Update the row to attempts=4 with nextAttemptAt in the past, so the
      // next run will take it to attempts=5 and exhaust.
      await prisma.domainEvent.update({
        where: { id: e.id },
        data: { attempts: 4, nextAttemptAt: new Date(Date.now() - 1000) },
      });

      await processPendingEvents({ limit: 10 }, prisma);
      const fresh = await prisma.domainEvent.findUnique({ where: { id: e.id } });
      expect(fresh!.attempts).toBe(5);
      expect(fresh!.nextAttemptAt).toBeNull();
      expect(fresh!.processedAt).toBeNull(); // never succeeded
      expect(fresh!.lastError).toContain("perpetual failure");
    } finally {
      delete HANDLER_REGISTRY[eventType];
    }
  });
});
