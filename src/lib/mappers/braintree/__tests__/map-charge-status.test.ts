import { describe, it, expect } from "vitest";
import { ChargeStatus } from "@prisma/client";
import { mapBraintreeChargeStatus } from "../map-charge-status";

describe("mapBraintreeChargeStatus", () => {
  const successCases = ["settled", "settlement_confirmed"];
  const failedCases = [
    "settlement_declined",
    "processor_declined",
    "gateway_rejected",
    "failed",
  ];
  const cancelledCases = ["voided", "authorization_expired"];
  const pendingCases = [
    "submitted_for_settlement",
    "settling",
    "settlement_pending",
    "authorizing",
    "authorized",
  ];

  successCases.forEach((status) => {
    it(`maps "${status}" to SUCCESS`, () => {
      expect(mapBraintreeChargeStatus(status)).toBe(ChargeStatus.SUCCESS);
    });
  });

  failedCases.forEach((status) => {
    it(`maps "${status}" to FAILED`, () => {
      expect(mapBraintreeChargeStatus(status)).toBe(ChargeStatus.FAILED);
    });
  });

  cancelledCases.forEach((status) => {
    it(`maps "${status}" to CANCELLED`, () => {
      expect(mapBraintreeChargeStatus(status)).toBe(ChargeStatus.CANCELLED);
    });
  });

  pendingCases.forEach((status) => {
    it(`maps "${status}" to PENDING`, () => {
      expect(mapBraintreeChargeStatus(status)).toBe(ChargeStatus.PENDING);
    });
  });

  it("is case-insensitive (loud-fail guard for SDK casing drift)", () => {
    expect(mapBraintreeChargeStatus("SETTLED")).toBe(ChargeStatus.SUCCESS);
    expect(mapBraintreeChargeStatus("Voided")).toBe(ChargeStatus.CANCELLED);
  });

  it("throws on unknown status", () => {
    expect(() => mapBraintreeChargeStatus("invalid_status")).toThrow(
      /Unknown Braintree transaction status/,
    );
    expect(() => mapBraintreeChargeStatus("")).toThrow();
  });
});
