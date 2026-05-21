import { describe, it, expect } from "vitest";
import {
  mapAmountCents,
  mapAmountCentsOptional,
} from "../map-amount-cents";

describe("mapAmountCents", () => {
  it("converts whole-dollar string to cents", () => {
    expect(mapAmountCents("100.00")).toBe(10000);
    expect(mapAmountCents("0.00")).toBe(0);
    expect(mapAmountCents("1500.00")).toBe(150000);
  });

  it("converts fractional-dollar string to cents (round)", () => {
    expect(mapAmountCents("29.99")).toBe(2999);
    expect(mapAmountCents("0.01")).toBe(1);
    expect(mapAmountCents("0.50")).toBe(50);
  });

  it("handles 3+ decimal places via Math.round", () => {
    // 29.995 → 2999.5 → Math.round → 3000 (banker's rounding doesn't apply
    // to Math.round; .5 rounds up in JS).
    expect(mapAmountCents("29.995")).toBe(3000);
    expect(mapAmountCents("29.994")).toBe(2999);
  });

  it("throws on null/undefined", () => {
    expect(() => mapAmountCents(null)).toThrow(/null\/undefined/);
    expect(() => mapAmountCents(undefined)).toThrow(/null\/undefined/);
  });

  it("throws on non-numeric string", () => {
    expect(() => mapAmountCents("abc")).toThrow(/Invalid Recharge amount/);
    expect(() => mapAmountCents("")).toThrow(/Invalid Recharge amount/);
  });
});

describe("mapAmountCentsOptional", () => {
  it("returns 0 for null/undefined", () => {
    expect(mapAmountCentsOptional(null)).toBe(0);
    expect(mapAmountCentsOptional(undefined)).toBe(0);
  });

  it("delegates to mapAmountCents for non-nullish input", () => {
    expect(mapAmountCentsOptional("29.99")).toBe(2999);
    expect(mapAmountCentsOptional("0.00")).toBe(0);
  });

  it("still throws on invalid non-nullish input", () => {
    expect(() => mapAmountCentsOptional("abc")).toThrow(/Invalid/);
  });
});
