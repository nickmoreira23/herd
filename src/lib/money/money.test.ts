import { describe, it, expect } from "vitest";
import {
  money,
  zero,
  add,
  subtract,
  negate,
  isZero,
  isPositive,
  isNegative,
  equals,
  compare,
  sum,
  multiplyByInteger,
  applyBasisPoints,
} from "./arithmetic";
import { CurrencyMismatchError, InvalidMoneyError } from "./types";
import { formatMoney, formatAmount } from "./format";
import { parseMoneyInput, moneyFromDecimal, moneyToDecimalString } from "./parse";

describe("money — construction", () => {
  it("creates Money from bigint", () => {
    const m = money(10000n, "BRL");
    expect(m.amountCents).toBe(10000n);
    expect(m.currency).toBe("BRL");
  });

  it("creates Money from integer number", () => {
    const m = money(10000, "USD");
    expect(m.amountCents).toBe(10000n);
  });

  it("zero returns 0 in given currency", () => {
    expect(zero("BRL")).toEqual({ amountCents: 0n, currency: "BRL" });
  });
});

describe("money — arithmetic", () => {
  it("adds same currency", () => {
    const result = add(money(10000n, "BRL"), money(5000n, "BRL"));
    expect(result.amountCents).toBe(15000n);
  });

  it("throws on adding different currencies", () => {
    expect(() => add(money(100n, "BRL"), money(100n, "USD"))).toThrow(CurrencyMismatchError);
  });

  it("subtracts same currency", () => {
    expect(subtract(money(10000n, "BRL"), money(3000n, "BRL")).amountCents).toBe(7000n);
  });

  it("negates", () => {
    expect(negate(money(10000n, "BRL")).amountCents).toBe(-10000n);
    expect(negate(money(-10000n, "BRL")).amountCents).toBe(10000n);
  });

  it("predicates", () => {
    expect(isZero(zero("BRL"))).toBe(true);
    expect(isPositive(money(100n, "BRL"))).toBe(true);
    expect(isNegative(money(-100n, "BRL"))).toBe(true);
  });

  it("equals", () => {
    expect(equals(money(100n, "BRL"), money(100n, "BRL"))).toBe(true);
    expect(equals(money(100n, "BRL"), money(100n, "USD"))).toBe(false);
  });

  it("compare", () => {
    expect(compare(money(100n, "BRL"), money(200n, "BRL"))).toBe(-1);
    expect(compare(money(200n, "BRL"), money(100n, "BRL"))).toBe(1);
    expect(compare(money(100n, "BRL"), money(100n, "BRL"))).toBe(0);
  });

  it("sum", () => {
    const result = sum([money(100n, "BRL"), money(200n, "BRL"), money(300n, "BRL")]);
    expect(result.amountCents).toBe(600n);
  });

  it("sum throws on empty array", () => {
    expect(() => sum([])).toThrow(InvalidMoneyError);
  });

  it("sum throws on mixed currencies", () => {
    expect(() => sum([money(100n, "BRL"), money(100n, "USD")])).toThrow(CurrencyMismatchError);
  });

  it("multiplyByInteger", () => {
    expect(multiplyByInteger(money(100n, "BRL"), 3n).amountCents).toBe(300n);
    expect(multiplyByInteger(money(100n, "BRL"), 3).amountCents).toBe(300n);
  });

  it("multiplyByInteger throws on non-integer number", () => {
    expect(() => multiplyByInteger(money(100n, "BRL"), 1.5)).toThrow(InvalidMoneyError);
  });
});

describe("money — basis points", () => {
  it("applies 10% (1000 bp) to R$ 100", () => {
    expect(applyBasisPoints(money(10000n, "BRL"), 1000n).amountCents).toBe(1000n);
  });

  it("applies 0.5% (50 bp) to R$ 100", () => {
    expect(applyBasisPoints(money(10000n, "BRL"), 50n).amountCents).toBe(50n);
  });

  it("rounds half-away-from-zero on positive", () => {
    expect(applyBasisPoints(money(100n, "BRL"), 33n).amountCents).toBe(0n);
    expect(applyBasisPoints(money(100n, "BRL"), 50n).amountCents).toBe(1n);
  });

  it("rounds half-away-from-zero on negative", () => {
    expect(applyBasisPoints(money(-100n, "BRL"), 50n).amountCents).toBe(-1n);
  });
});

describe("money — formatting", () => {
  it("formats BRL with symbol in pt-BR", () => {
    expect(formatMoney(money(10000n, "BRL"), "pt-BR")).toMatch(/R\$\s*100,00/);
  });

  it("formats USD with symbol in en-US", () => {
    expect(formatMoney(money(10000n, "USD"), "en-US")).toMatch(/\$100\.00/);
  });

  it("formatAmount strips symbol (pt-BR)", () => {
    expect(formatAmount(money(10000n, "BRL"), "pt-BR")).toBe("100,00");
  });

  it("formatAmount strips symbol (en-US)", () => {
    expect(formatAmount(money(10000n, "USD"), "en-US")).toBe("100.00");
  });

  it("formats negative in pt-BR", () => {
    expect(formatMoney(money(-10000n, "BRL"), "pt-BR")).toMatch(/-R\$\s*100,00/);
  });

  it("locale parameter controls separators independently from currency", () => {
    // BRL rendered with en-US locale uses dot as decimal separator.
    expect(formatMoney(money(10000n, "BRL"), "en-US")).toMatch(/100\.00/);
    // USD rendered with pt-BR locale uses comma as decimal separator.
    expect(formatMoney(money(10000n, "USD"), "pt-BR")).toMatch(/100,00/);
  });
});

describe("money — parsing", () => {
  it("parses BRL with symbol and thousand separator", () => {
    expect(parseMoneyInput("R$ 1.234,56", "BRL").amountCents).toBe(123456n);
  });

  it("parses BRL plain", () => {
    expect(parseMoneyInput("100,00", "BRL").amountCents).toBe(10000n);
    expect(parseMoneyInput("100", "BRL").amountCents).toBe(10000n);
  });

  it("parses USD", () => {
    expect(parseMoneyInput("$1,234.56", "USD").amountCents).toBe(123456n);
    expect(parseMoneyInput("1234.56", "USD").amountCents).toBe(123456n);
  });

  it("throws on empty", () => {
    expect(() => parseMoneyInput("", "BRL")).toThrow(InvalidMoneyError);
    expect(() => parseMoneyInput("   ", "BRL")).toThrow(InvalidMoneyError);
  });
});

describe("money — Decimal bridge", () => {
  it("converts from Decimal-like object", () => {
    const dec = { toString: () => "100.50" };
    expect(moneyFromDecimal(dec, "BRL").amountCents).toBe(10050n);
  });

  it("converts back to decimal string", () => {
    expect(moneyToDecimalString(money(10050n, "BRL"))).toBe("100.50");
    expect(moneyToDecimalString(money(0n, "BRL"))).toBe("0.00");
    expect(moneyToDecimalString(money(-10050n, "BRL"))).toBe("-100.50");
    expect(moneyToDecimalString(money(-50n, "BRL"))).toBe("-0.50");
  });

  it("round-trips through Decimal", () => {
    const original = money(123456n, "BRL");
    const asString = moneyToDecimalString(original);
    const back = moneyFromDecimal({ toString: () => asString }, "BRL");
    expect(back.amountCents).toBe(original.amountCents);
  });
});
