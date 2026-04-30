import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedPlatformAccounts } from "../seed-platform-accounts";
import { PLATFORM_ACCOUNTS } from "../platform-accounts-spec";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL or DIRECT_URL must be set for integration tests");
}
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("seedPlatformAccounts — integration", () => {
  // The seed targets accounts with codes starting "platform:". To keep this
  // suite hermetic, we don't truncate other tests' accounts — we only check
  // that all 20 platform:* codes are present after seeding, regardless of
  // any test:* accounts left around by other suites.

  beforeAll(async () => {
    // Make sure the platform accounts namespace is in a known state by
    // running the seed first. Subsequent tests verify idempotency.
    await seedPlatformAccounts(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates all 20 platform accounts (10 templates × 2 currencies)", async () => {
    const codes = PLATFORM_ACCOUNTS.map((a) => a.code);
    expect(codes).toHaveLength(20);

    const found = await prisma.account.findMany({
      where: { code: { in: codes } },
      orderBy: { code: "asc" },
    });
    expect(found).toHaveLength(20);
  });

  it("each account has the correct accountType, ownerKind, and currency", async () => {
    for (const spec of PLATFORM_ACCOUNTS) {
      const acc = await prisma.account.findUnique({ where: { code: spec.code } });
      expect(acc).not.toBeNull();
      expect(acc!.accountType).toBe(spec.accountType);
      expect(acc!.ownerKind).toBe(spec.ownerKind);
      // Currency is derived from the code suffix (last segment uppercased).
      const expectedCurrency = spec.code.split(":").pop()!.toUpperCase();
      expect(acc!.currency).toBe(expectedCurrency);
    }
  });

  it("re-running the seed is idempotent (no new accounts created)", async () => {
    const result = await seedPlatformAccounts(prisma);
    expect(result.created).toHaveLength(0);
    // Some may legitimately be 'updated' if the previous run had stale name,
    // but the second run after a clean seed must report all unchanged.
  });

  it("re-running twice in a row yields all-unchanged on the second", async () => {
    await seedPlatformAccounts(prisma);
    const second = await seedPlatformAccounts(prisma);
    expect(second.created).toHaveLength(0);
    expect(second.updated).toHaveLength(0);
    expect(second.unchanged).toHaveLength(PLATFORM_ACCOUNTS.length);
  });

  it("updates a stale name on re-run", async () => {
    const code = "platform:revenue:brl";
    const original = await prisma.account.findUnique({ where: { code } });
    try {
      // Manually corrupt the name.
      await prisma.account.update({
        where: { code },
        data: { name: "Stale name" },
      });

      const result = await seedPlatformAccounts(prisma);
      expect(result.updated).toContain(code);

      const fresh = await prisma.account.findUnique({ where: { code } });
      expect(fresh!.name).not.toBe("Stale name");
      expect(fresh!.name).toContain("Platform revenue");
    } finally {
      // Restore in case the test failed mid-flight; seed will re-correct on
      // next run anyway, but explicit restore keeps DB tidy.
      if (original) {
        await prisma.account.update({
          where: { code },
          data: { name: original.name },
        });
      }
    }
  });

  it("refuses to mutate accountType on an existing code", async () => {
    const code = "platform:cash:brl";
    const original = await prisma.account.findUnique({ where: { code } });
    try {
      // Manually corrupt the type.
      await prisma.account.update({
        where: { code },
        data: { accountType: "EXPENSE" },
      });

      await expect(seedPlatformAccounts(prisma)).rejects.toThrow(
        /accountType differs/i,
      );
    } finally {
      // Restore so subsequent tests aren't affected.
      if (original) {
        await prisma.account.update({
          where: { code },
          data: { accountType: original.accountType },
        });
      }
    }
  });

  it("never touches archivedAt", async () => {
    const code = "platform:opening_equity:brl";
    const original = await prisma.account.findUnique({ where: { code } });
    const archivedAt = new Date("2024-01-01T00:00:00.000Z");
    try {
      await prisma.account.update({
        where: { code },
        data: { archivedAt },
      });

      await seedPlatformAccounts(prisma);

      const fresh = await prisma.account.findUnique({ where: { code } });
      expect(fresh!.archivedAt?.toISOString()).toBe(archivedAt.toISOString());
    } finally {
      // Restore.
      if (original) {
        await prisma.account.update({
          where: { code },
          data: { archivedAt: original.archivedAt },
        });
      }
    }
  });
});

describe("CHECK constraints — integration", () => {
  it("rejects an account with invalid code format (uppercase)", async () => {
    await expect(
      prisma.account.create({
        data: {
          code: "Platform:Revenue:BRL",
          name: "Bad",
          accountType: "REVENUE",
          ownerKind: "PLATFORM",
          currency: "BRL",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects an account with invalid code format (space)", async () => {
    await expect(
      prisma.account.create({
        data: {
          code: "platform foo bar brl",
          name: "Bad",
          accountType: "REVENUE",
          ownerKind: "PLATFORM",
          currency: "BRL",
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects an account with unsupported currency", async () => {
    await expect(
      prisma.account.create({
        data: {
          code: "test:check-currency:eur",
          name: "Bad currency",
          accountType: "ASSET",
          ownerKind: "PLATFORM",
          currency: "EUR",
        },
      }),
    ).rejects.toThrow();
  });
});
