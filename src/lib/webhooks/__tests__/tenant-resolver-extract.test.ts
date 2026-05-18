import { describe, it, expect } from "vitest";
import { __internal } from "../tenant-resolver";

const { extractExternalId } = __internal;

describe("extractExternalId — per-provider payload shapes", () => {
  describe("gorgias", () => {
    it("reads top-level account_id (string)", () => {
      expect(extractExternalId("gorgias", { account_id: "12345" })).toBe(
        "12345",
      );
    });

    it("reads top-level account_id (number)", () => {
      expect(extractExternalId("gorgias", { account_id: 12345 })).toBe("12345");
    });

    it("reads nested account.id when account_id is absent", () => {
      expect(
        extractExternalId("gorgias", { account: { id: "nested-id" } }),
      ).toBe("nested-id");
    });

    it("returns null when no recognizable field is present", () => {
      expect(extractExternalId("gorgias", { ticket: { id: 99 } })).toBeNull();
    });
  });

  describe("intercom", () => {
    it("reads top-level app_id", () => {
      expect(extractExternalId("intercom", { app_id: "abc" })).toBe("abc");
    });

    it("reads nested app.id_code", () => {
      expect(
        extractExternalId("intercom", { app: { id_code: "workspace-1" } }),
      ).toBe("workspace-1");
    });

    it("falls back to app.id when id_code missing", () => {
      expect(extractExternalId("intercom", { app: { id: "raw-id" } })).toBe(
        "raw-id",
      );
    });

    it("returns null when payload has no app reference", () => {
      expect(extractExternalId("intercom", { topic: "ping" })).toBeNull();
    });
  });

  describe("recharge", () => {
    it("reads customer.id (preferred — per-shop customer key)", () => {
      expect(extractExternalId("recharge", { customer: { id: 7 } })).toBe("7");
    });

    it("falls back to merchant_id when customer.id absent", () => {
      expect(
        extractExternalId("recharge", { merchant_id: "shop-42" }),
      ).toBe("shop-42");
    });

    it("falls back to shop_id when both customer.id and merchant_id absent", () => {
      expect(extractExternalId("recharge", { shop_id: "store-1" })).toBe(
        "store-1",
      );
    });

    it("returns null when no recognizable field is present", () => {
      expect(extractExternalId("recharge", { topic: "ping" })).toBeNull();
    });
  });

  it("returns null for non-object payloads", () => {
    expect(extractExternalId("gorgias", null)).toBeNull();
    expect(extractExternalId("intercom", "string")).toBeNull();
    expect(extractExternalId("recharge", 42)).toBeNull();
  });
});
