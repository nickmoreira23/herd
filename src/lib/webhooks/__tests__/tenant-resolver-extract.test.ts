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

  describe("braintree", () => {
    it("subscription kind reads subject.subscription.customerId", () => {
      expect(
        extractExternalId("braintree", {
          kind: "subscription_charged_successfully",
          subject: { subscription: { id: "sub_1", customerId: "cust_abc" } },
        }),
      ).toBe("cust_abc");
    });

    it("transaction kind reads subject.transaction.customer.id (preferred)", () => {
      expect(
        extractExternalId("braintree", {
          kind: "transaction_settled",
          subject: {
            transaction: { id: "txn_1", customer: { id: "cust_xyz" } },
          },
        }),
      ).toBe("cust_xyz");
    });

    it("transaction kind falls back to subject.transaction.customerId", () => {
      expect(
        extractExternalId("braintree", {
          kind: "transaction_disbursed",
          subject: { transaction: { id: "txn_2", customerId: "cust_fallback" } },
        }),
      ).toBe("cust_fallback");
    });

    it("dispute kind reads subject.dispute.transaction.customerId", () => {
      expect(
        extractExternalId("braintree", {
          kind: "dispute_opened",
          subject: {
            dispute: {
              id: "disp_1",
              transaction: { id: "txn_disp", customerId: "cust_disp" },
            },
          },
        }),
      ).toBe("cust_disp");
    });

    it("returns null for SDK sample notifications (no customerId — fallback path)", () => {
      // Mirrors the shape returned by gw.webhookTesting.sampleNotification —
      // customerId is intentionally omitted.
      expect(
        extractExternalId("braintree", {
          kind: "subscription_charged_successfully",
          subject: { subscription: { id: "sub_test" } },
        }),
      ).toBeNull();
    });

    it("returns null for unknown kinds outside subscription/transaction/dispute", () => {
      expect(
        extractExternalId("braintree", {
          kind: "partner_merchant_connected",
          subject: { partnerMerchant: { id: "pm_1" } },
        }),
      ).toBeNull();
    });
  });

  it("returns null for non-object payloads", () => {
    expect(extractExternalId("gorgias", null)).toBeNull();
    expect(extractExternalId("intercom", "string")).toBeNull();
    expect(extractExternalId("recharge", 42)).toBeNull();
    expect(extractExternalId("braintree", undefined)).toBeNull();
  });
});
