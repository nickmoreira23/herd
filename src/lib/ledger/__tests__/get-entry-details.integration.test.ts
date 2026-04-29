import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { money } from "@/lib/money";
import { postJournalEntry } from "../post-journal-entry";
import { buildBalancedEntry } from "../build-balanced-entry";
import { getEntryDetails } from "../get-entry-details";
import { EntryNotFoundError } from "../errors";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL or DIRECT_URL must be set");
const prisma = new PrismaClient({ adapter: new PrismaPg(connectionString) });

describe("getEntryDetails — integration", () => {
  let assetCode: string;
  let revenueCode: string;
  let createdEntryId: string;

  beforeAll(async () => {
    const suffix = Date.now().toString(36);
    assetCode = `test:detail:asset:${suffix}`;
    revenueCode = `test:detail:rev:${suffix}`;
    await prisma.account.create({ data: { code: assetCode, name: "Detail Asset", accountType: "ASSET", ownerKind: "PLATFORM", currency: "BRL" } });
    await prisma.account.create({ data: { code: revenueCode, name: "Detail Rev", accountType: "REVENUE", ownerKind: "PLATFORM", currency: "BRL" } });

    const entry = await postJournalEntry(
      {
        sourceKind: "MANUAL_ADJUSTMENT",
        sourceId: crypto.randomUUID(),
        description: "detail-test",
        metadata: { tag: "test" },
        lines: buildBalancedEntry({
          debits: [{ accountCode: assetCode, amount: money(15000n, "BRL") }],
          credits: [{ accountCode: revenueCode, amount: money(15000n, "BRL") }],
        }),
      },
      prisma,
    );
    createdEntryId = entry.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns full entry with resolved account info on each line", async () => {
    const result = await getEntryDetails(createdEntryId, prisma);
    expect(result.id).toBe(createdEntryId);
    expect(result.description).toBe("detail-test");
    expect(result.metadata).toEqual({ tag: "test" });
    expect(result.lines).toHaveLength(2);

    const debit = result.lines.find((l) => l.direction === "D");
    const credit = result.lines.find((l) => l.direction === "C");
    expect(debit?.account.code).toBe(assetCode);
    expect(debit?.account.name).toBe("Detail Asset");
    expect(debit?.account.accountType).toBe("ASSET");
    expect(debit?.amount.amountCents).toBe(15000n);
    expect(debit?.amount.currency).toBe("BRL");

    expect(credit?.account.code).toBe(revenueCode);
    expect(credit?.account.accountType).toBe("REVENUE");
  });

  it("throws EntryNotFoundError for missing entry", async () => {
    await expect(
      getEntryDetails("00000000-0000-0000-0000-000000000000", prisma),
    ).rejects.toBeInstanceOf(EntryNotFoundError);
  });

  it("preserves postedAt and createdAt", async () => {
    const result = await getEntryDetails(createdEntryId, prisma);
    expect(result.postedAt).toBeInstanceOf(Date);
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});
