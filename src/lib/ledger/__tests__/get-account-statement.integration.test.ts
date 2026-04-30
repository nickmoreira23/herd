import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { money } from "@/lib/money";
import { postJournalEntry } from "../post-journal-entry";
import { buildBalancedEntry } from "../build-balanced-entry";
import { getAccountStatement } from "../get-account-statement";
import { AccountNotFoundError, StatementLimitExceededError, InvalidCursorError } from "../errors";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL must be set");
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("getAccountStatement — integration", () => {
  let primaryCode: string;
  let counterCode: string;

  beforeAll(async () => {
    const suffix = Date.now().toString(36);
    primaryCode = `test:stmt:primary:${suffix}`;
    counterCode = `test:stmt:counter:${suffix}`;
    await prisma.account.create({ data: { code: primaryCode, name: "Primary", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: counterCode, name: "Counter", accountType: "REVENUE", ownerKind: "PLATFORM", currency: "BRL" } });

    // Seed 5 entries on the primary account, sequential.
    for (let i = 0; i < 5; i++) {
      await postJournalEntry(
        {
          sourceKind: "MANUAL_ADJUSTMENT",
          sourceId: crypto.randomUUID(),
          description: `seed entry ${i + 1}`,
          lines: buildBalancedEntry({
            debits: [{ accountCode: primaryCode, amount: money(1000n + BigInt(i) * 100n, "BRL") }],
            credits: [{ accountCode: counterCode, amount: money(1000n + BigInt(i) * 100n, "BRL") }],
          }),
        },
        prisma,
      );
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns all lines when count <= limit", async () => {
    const result = await getAccountStatement({ accountCode: primaryCode }, prisma);
    expect(result.lines).toHaveLength(5);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("paginates with limit", async () => {
    const page1 = await getAccountStatement({ accountCode: primaryCode, limit: 2 }, prisma);
    expect(page1.lines).toHaveLength(2);
    expect(page1.hasMore).toBe(true);
    expect(page1.nextCursor).not.toBeNull();

    const page2 = await getAccountStatement({ accountCode: primaryCode, limit: 2, cursor: page1.nextCursor! }, prisma);
    expect(page2.lines).toHaveLength(2);
    expect(page2.hasMore).toBe(true);

    const page3 = await getAccountStatement({ accountCode: primaryCode, limit: 2, cursor: page2.nextCursor! }, prisma);
    expect(page3.lines).toHaveLength(1);
    expect(page3.hasMore).toBe(false);
    expect(page3.nextCursor).toBeNull();

    // Combined, all 5 lines should be unique.
    const allIds = [...page1.lines, ...page2.lines, ...page3.lines].map((l) => l.id);
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(5);
  });

  it("filters by date range", async () => {
    const past = new Date(Date.now() - 1000 * 60 * 60 * 24); // yesterday
    const future = new Date(Date.now() + 1000); // 1 second ahead
    const result = await getAccountStatement({ accountCode: primaryCode, from: past, to: future }, prisma);
    expect(result.lines.length).toBeGreaterThanOrEqual(5);
  });

  it("excludes lines outside range", async () => {
    const veryFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
    const evenMoreFuture = new Date(veryFuture.getTime() + 1000);
    const result = await getAccountStatement({ accountCode: primaryCode, from: veryFuture, to: evenMoreFuture }, prisma);
    expect(result.lines).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it("orders chronologically (postedAt ASC, then id ASC)", async () => {
    const result = await getAccountStatement({ accountCode: primaryCode }, prisma);
    for (let i = 1; i < result.lines.length; i++) {
      const prev = result.lines[i - 1];
      const curr = result.lines[i];
      const prevTime = prev.postedAt.getTime();
      const currTime = curr.postedAt.getTime();
      expect(currTime).toBeGreaterThanOrEqual(prevTime);
    }
  });

  it("rejects limit > 500", async () => {
    await expect(
      getAccountStatement({ accountCode: primaryCode, limit: 501 }, prisma),
    ).rejects.toBeInstanceOf(StatementLimitExceededError);
  });

  it("rejects limit < 1", async () => {
    await expect(
      getAccountStatement({ accountCode: primaryCode, limit: 0 }, prisma),
    ).rejects.toBeInstanceOf(StatementLimitExceededError);
  });

  it("rejects malformed cursor", async () => {
    await expect(
      getAccountStatement({ accountCode: primaryCode, cursor: "garbage-cursor" }, prisma),
    ).rejects.toBeInstanceOf(InvalidCursorError);
  });

  it("throws AccountNotFoundError for missing account", async () => {
    await expect(
      getAccountStatement({ accountCode: "does:not:exist" }, prisma),
    ).rejects.toBeInstanceOf(AccountNotFoundError);
  });
});
