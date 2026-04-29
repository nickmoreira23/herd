import { describe, it, expect } from "vitest";
import { naturalSign, signedBalanceCents } from "../account-polarity";

describe("naturalSign", () => {
  it("returns 1n for ASSET", () => expect(naturalSign("ASSET")).toBe(1n));
  it("returns 1n for EXPENSE", () => expect(naturalSign("EXPENSE")).toBe(1n));
  it("returns -1n for LIABILITY", () => expect(naturalSign("LIABILITY")).toBe(-1n));
  it("returns -1n for REVENUE", () => expect(naturalSign("REVENUE")).toBe(-1n));
  it("returns -1n for EQUITY", () => expect(naturalSign("EQUITY")).toBe(-1n));
});

describe("signedBalanceCents", () => {
  it("ASSET: D=10000, C=4000 → 6000 (D-C)", () => {
    expect(signedBalanceCents("ASSET", 10000n, 4000n)).toBe(6000n);
  });
  it("EXPENSE: D=10000, C=0 → 10000 (D-C)", () => {
    expect(signedBalanceCents("EXPENSE", 10000n, 0n)).toBe(10000n);
  });
  it("LIABILITY: D=4000, C=10000 → 6000 (C-D)", () => {
    expect(signedBalanceCents("LIABILITY", 4000n, 10000n)).toBe(6000n);
  });
  it("REVENUE: D=0, C=10000 → 10000 (C-D)", () => {
    expect(signedBalanceCents("REVENUE", 0n, 10000n)).toBe(10000n);
  });
  it("EQUITY: D=2000, C=8000 → 6000 (C-D)", () => {
    expect(signedBalanceCents("EQUITY", 2000n, 8000n)).toBe(6000n);
  });
  it("returns negative when account is in unusual posture (e.g. ASSET with C > D)", () => {
    expect(signedBalanceCents("ASSET", 1000n, 5000n)).toBe(-4000n);
  });
});
