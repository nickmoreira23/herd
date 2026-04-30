import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Match the project's runtime prisma client setup (src/lib/prisma.ts):
// PrismaPg adapter with DIRECT_URL (or DATABASE_URL fallback).
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set to run ledger integration tests.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

// These tests assume:
// - A test database is reachable via DATABASE_URL.
// - The schema of Etapa 1.2 is applied.
// They DO NOT seed accounts; each test creates its own.

describe("ledger balance constraint", () => {
  let assetAccountBrl: string;
  let liabilityAccountBrl: string;
  let revenueAccountBrl: string;
  let assetAccountUsd: string;

  beforeAll(async () => {
    // Create fresh accounts for the test run, with unique codes to avoid collision.
    const suffix = Date.now().toString(36);
    const a = await prisma.account.create({
      data: {
        code: `test:asset:brl:${suffix}`,
        name: "Test Asset BRL",
        accountType: "ASSET",
        ownerKind: "PLATFORM",
        currency: "BRL",
      },
    });
    const l = await prisma.account.create({
      data: {
        code: `test:liability:brl:${suffix}`,
        name: "Test Liability BRL",
        accountType: "LIABILITY",
        ownerKind: "PLATFORM",
        currency: "BRL",
      },
    });
    const r = await prisma.account.create({
      data: {
        code: `test:revenue:brl:${suffix}`,
        name: "Test Revenue BRL",
        accountType: "REVENUE",
        ownerKind: "PLATFORM",
        currency: "BRL",
      },
    });
    const u = await prisma.account.create({
      data: {
        code: `test:asset:usd:${suffix}`,
        name: "Test Asset USD",
        accountType: "ASSET",
        ownerKind: "PLATFORM",
        currency: "USD",
      },
    });
    assetAccountBrl = a.id;
    liabilityAccountBrl = l.id;
    revenueAccountBrl = r.id;
    assetAccountUsd = u.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("accepts a balanced single-currency entry (1 D, 1 C, equal amounts)", async () => {
    await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          description: "test: balanced single-currency",
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: assetAccountBrl,
          direction: "D",
          amountCents: 10000n,
          currency: "BRL",
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: liabilityAccountBrl,
          direction: "C",
          amountCents: 10000n,
          currency: "BRL",
        },
      });
    });
    expect(true).toBe(true); // commit succeeded
  });

  it("rejects an unbalanced entry (debits != credits)", async () => {
    const sourceId = crypto.randomUUID();
    await expect(
      prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: { sourceKind: "MANUAL_ADJUSTMENT", sourceId, description: "test: unbalanced" },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: assetAccountBrl,
            direction: "D",
            amountCents: 10000n,
            currency: "BRL",
          },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: liabilityAccountBrl,
            direction: "C",
            amountCents: 5000n,
            currency: "BRL",
          },
        });
      })
    ).rejects.toThrow(/unbalanced/i);
  });

  it("rejects an entry with zero lines", async () => {
    const sourceId = crypto.randomUUID();
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.journalEntry.create({
          data: { sourceKind: "MANUAL_ADJUSTMENT", sourceId, description: "test: empty entry" },
        });
        // No lines inserted — should fail at commit.
      })
    ).rejects.toThrow(/no lines/i);
  });

  it("accepts a multi-line balanced entry (2 D, 2 C)", async () => {
    await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: { sourceKind: "TRANSACTION", sourceId: crypto.randomUUID(), description: "test: 2D 2C" },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: assetAccountBrl,
          direction: "D",
          amountCents: 7000n,
          currency: "BRL",
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: assetAccountBrl,
          direction: "D",
          amountCents: 3000n,
          currency: "BRL",
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: liabilityAccountBrl,
          direction: "C",
          amountCents: 6000n,
          currency: "BRL",
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: revenueAccountBrl,
          direction: "C",
          amountCents: 4000n,
          currency: "BRL",
        },
      });
    });
    expect(true).toBe(true);
  });

  it("rejects mixing currencies that don't balance separately", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: { sourceKind: "MANUAL_ADJUSTMENT", sourceId: crypto.randomUUID() },
        });
        // BRL balances...
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: assetAccountBrl,
            direction: "D",
            amountCents: 1000n,
            currency: "BRL",
          },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: liabilityAccountBrl,
            direction: "C",
            amountCents: 1000n,
            currency: "BRL",
          },
        });
        // ...but USD has only one side.
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: assetAccountUsd,
            direction: "D",
            amountCents: 500n,
            currency: "USD",
          },
        });
      })
    ).rejects.toThrow(/unbalanced/i);
  });

  it("rejects a line whose currency does not match its account", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: { sourceKind: "MANUAL_ADJUSTMENT", sourceId: crypto.randomUUID() },
        });
        // assetAccountBrl is BRL but we try to write a USD line into it.
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: assetAccountBrl,
            direction: "D",
            amountCents: 1000n,
            currency: "USD",
          },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: liabilityAccountBrl,
            direction: "C",
            amountCents: 1000n,
            currency: "BRL",
          },
        });
      })
    ).rejects.toThrow(/does not match account currency/i);
  });

  it("rejects a journal_line with non-positive amount", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: { sourceKind: "MANUAL_ADJUSTMENT", sourceId: crypto.randomUUID() },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: assetAccountBrl,
            direction: "D",
            amountCents: 0n,
            currency: "BRL",
          },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: liabilityAccountBrl,
            direction: "C",
            amountCents: 0n,
            currency: "BRL",
          },
        });
      })
    ).rejects.toThrow();
  });

  it("enforces idempotency_key uniqueness", async () => {
    const key = `test-idempotency-${Date.now()}`;
    await prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          idempotencyKey: key,
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: assetAccountBrl,
          direction: "D",
          amountCents: 100n,
          currency: "BRL",
        },
      });
      await tx.journalLine.create({
        data: {
          journalEntryId: entry.id,
          accountId: liabilityAccountBrl,
          direction: "C",
          amountCents: 100n,
          currency: "BRL",
        },
      });
    });

    // Second insert with same idempotency_key must fail at the unique constraint level.
    await expect(
      prisma.$transaction(async (tx) => {
        const entry = await tx.journalEntry.create({
          data: {
            sourceKind: "MANUAL_ADJUSTMENT",
            sourceId: crypto.randomUUID(),
            idempotencyKey: key,
          },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: assetAccountBrl,
            direction: "D",
            amountCents: 100n,
            currency: "BRL",
          },
        });
        await tx.journalLine.create({
          data: {
            journalEntryId: entry.id,
            accountId: liabilityAccountBrl,
            direction: "C",
            amountCents: 100n,
            currency: "BRL",
          },
        });
      })
    ).rejects.toThrow(/unique/i);
  });
});
