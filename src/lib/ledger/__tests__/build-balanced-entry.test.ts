import { describe, it, expect } from "vitest";
import { money } from "@/lib/money";
import { buildBalancedEntry } from "../build-balanced-entry";
import { UnbalancedEntryError, InsufficientLinesError } from "../errors";

describe("buildBalancedEntry", () => {
  it("returns flat lines from balanced single-currency input", () => {
    const result = buildBalancedEntry({
      debits: [{ accountCode: "asset:cash", amount: money(10000n, "BRL") }],
      credits: [{ accountCode: "revenue:sales", amount: money(10000n, "BRL") }],
    });
    expect(result).toHaveLength(2);
    expect(result[0].direction).toBe("D");
    expect(result[1].direction).toBe("C");
  });

  it("throws InsufficientLinesError on < 2 lines", () => {
    expect(() =>
      buildBalancedEntry({
        debits: [{ accountCode: "asset:cash", amount: money(100n, "BRL") }],
        credits: [],
      }),
    ).toThrow(InsufficientLinesError);
  });

  it("throws UnbalancedEntryError on mismatched sums", () => {
    expect(() =>
      buildBalancedEntry({
        debits: [{ accountCode: "asset:cash", amount: money(10000n, "BRL") }],
        credits: [{ accountCode: "revenue:sales", amount: money(8000n, "BRL") }],
      }),
    ).toThrow(UnbalancedEntryError);
  });

  it("validates per-currency separately — BRL balanced, USD not", () => {
    let err: UnbalancedEntryError | null = null;
    try {
      buildBalancedEntry({
        debits: [
          { accountCode: "asset:brl", amount: money(100n, "BRL") },
          { accountCode: "asset:usd", amount: money(50n, "USD") },
        ],
        credits: [
          { accountCode: "liab:brl", amount: money(100n, "BRL") },
          // USD missing
        ],
      });
    } catch (e) {
      err = e as UnbalancedEntryError;
    }
    expect(err).toBeInstanceOf(UnbalancedEntryError);
    expect(err!.imbalanceByCurrency.USD).toBeDefined();
    expect(err!.imbalanceByCurrency.BRL).toBeUndefined();
  });

  it("accepts multi-line balanced entry", () => {
    const result = buildBalancedEntry({
      debits: [
        { accountCode: "asset:cash", amount: money(7000n, "BRL") },
        { accountCode: "asset:bank", amount: money(3000n, "BRL") },
      ],
      credits: [
        { accountCode: "revenue:sales", amount: money(6000n, "BRL") },
        { accountCode: "revenue:other", amount: money(4000n, "BRL") },
      ],
    });
    expect(result).toHaveLength(4);
  });
});
