import { describe, it, expect } from "vitest";
import {
  mapBraintreeAmountCents,
  mapBraintreeAmountCentsOptional,
} from "../map-amount-cents";

describe("mapBraintreeAmountCents", () => {
  it("converts decimal string to cents", () => {
    expect(mapBraintreeAmountCents("29.99")).toBe(2999);
    expect(mapBraintreeAmountCents("0.00")).toBe(0);
    expect(mapBraintreeAmountCents("1500.00")).toBe(150000);
  });

  it("handles single-decimal amounts", () => {
    expect(mapBraintreeAmountCents("100.5")).toBe(10050);
  });

  it("rounds floating-point precision correctly", () => {
    expect(mapBraintreeAmountCents("0.1")).toBe(10);
    expect(mapBraintreeAmountCents("0.2")).toBe(20);
    expect(mapBraintreeAmountCents("9.99")).toBe(999);
  });

  it("handles integer-style amounts (sample fixtures)", () => {
    // Sample notifications emit amount as "100" (integer string).
    expect(mapBraintreeAmountCents("100")).toBe(10000);
  });

  it("throws on invalid string", () => {
    expect(() => mapBraintreeAmountCents("invalid")).toThrow(
      /Invalid Braintree amount/,
    );
  });

  it("throws on null/undefined", () => {
    expect(() => mapBraintreeAmountCents(null)).toThrow();
    expect(() => mapBraintreeAmountCents(undefined)).toThrow();
  });
});

describe("mapBraintreeAmountCentsOptional", () => {
  it("returns 0 for null/undefined", () => {
    expect(mapBraintreeAmountCentsOptional(null)).toBe(0);
    expect(mapBraintreeAmountCentsOptional(undefined)).toBe(0);
  });

  it("delegates to required version for actual values", () => {
    expect(mapBraintreeAmountCentsOptional("29.99")).toBe(2999);
    expect(mapBraintreeAmountCentsOptional("0.00")).toBe(0);
  });
});
