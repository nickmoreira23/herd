import { describe, it, expect } from "vitest";
import { ChargeStatus } from "@prisma/client";
import { mapChargeStatus } from "../map-charge-status";

describe("mapChargeStatus", () => {
  it("maps 'success' and 'paid' to SUCCESS", () => {
    expect(mapChargeStatus("success")).toBe(ChargeStatus.SUCCESS);
    expect(mapChargeStatus("paid")).toBe(ChargeStatus.SUCCESS);
  });

  it("maps 'queued' to QUEUED", () => {
    expect(mapChargeStatus("queued")).toBe(ChargeStatus.QUEUED);
  });

  it("maps 'pending' to PENDING", () => {
    expect(mapChargeStatus("pending")).toBe(ChargeStatus.PENDING);
  });

  it("maps error variants to FAILED", () => {
    expect(mapChargeStatus("error")).toBe(ChargeStatus.FAILED);
    expect(mapChargeStatus("declined")).toBe(ChargeStatus.FAILED);
    expect(mapChargeStatus("failed")).toBe(ChargeStatus.FAILED);
  });

  it("maps 'refunded' to REFUNDED", () => {
    expect(mapChargeStatus("refunded")).toBe(ChargeStatus.REFUNDED);
  });

  it("maps 'partially_refunded' to PARTIALLY_REFUNDED", () => {
    expect(mapChargeStatus("partially_refunded")).toBe(
      ChargeStatus.PARTIALLY_REFUNDED,
    );
  });

  it("maps 'skipped' to SKIPPED", () => {
    expect(mapChargeStatus("skipped")).toBe(ChargeStatus.SKIPPED);
  });

  it("maps 'cancelled' to CANCELLED", () => {
    expect(mapChargeStatus("cancelled")).toBe(ChargeStatus.CANCELLED);
  });

  it("is case-insensitive", () => {
    expect(mapChargeStatus("SUCCESS")).toBe(ChargeStatus.SUCCESS);
    expect(mapChargeStatus("Paid")).toBe(ChargeStatus.SUCCESS);
  });

  it("throws on unknown status (loud-fail per spec)", () => {
    expect(() => mapChargeStatus("foobar")).toThrow(
      'Unknown Recharge charge status: "foobar"',
    );
  });
});
