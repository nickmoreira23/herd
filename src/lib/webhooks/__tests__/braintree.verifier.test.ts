import { describe, it, expect } from "vitest";
import braintree from "braintree";

/**
 * Sub-etapa 14 — Braintree signature verification via SDK.
 *
 * Braintree diverges from the other 3 providers: no dedicated
 * `WebhookVerifier` class. The SDK exposes
 * `gateway.webhookNotification.parse(signature, payload)` which performs
 * verify + decode in a single call. This test pins the SDK contract our
 * route handler depends on:
 *
 *  - Sample notifications are generated via
 *    `gateway.webhookTesting.sampleNotification` (instance method, NOT a
 *    static `braintree.Test.WebhookTesting` namespace). Returns
 *    `{bt_signature, bt_payload}` synchronously at runtime.
 *  - `parse()` is async, returns `{kind, timestamp, subject}`.
 *    NOTE: at runtime `timestamp` is an ISO-8601 *string*, not a Date
 *    (despite what some @types/braintree versions suggest). The route
 *    handler defensively coerces via `new Date(...)` to normalize.
 *  - Invalid signatures cause `parse()` to reject.
 *
 * If the SDK ever changes one of these contracts, this test fails loudly
 * and we re-evaluate the route handler.
 *
 * Type-safety note: @types/braintree v3.4 is incomplete relative to the
 * runtime — `WebhookNotification.Kind`, `webhookTesting`, the `subject`
 * field, and the sync return shape of `sampleNotification` are not
 * typed accurately. We narrow through unknown to match runtime.
 */

interface SampleNotificationShape {
  bt_signature: string;
  bt_payload: string;
}

function freshGateway() {
  return new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: "test_merchant",
    publicKey: "test_public",
    privateKey: "test_private",
  });
}

function sampleNotification(
  gw: ReturnType<typeof freshGateway>,
  kind: string,
  id: string,
): SampleNotificationShape {
  // The instance has a `webhookTesting` method bag missing from @types.
  // Runtime returns synchronously despite type signature claiming Promise.
  const wt = (gw as unknown as { webhookTesting: { sampleNotification: (k: string, id: string) => SampleNotificationShape } }).webhookTesting;
  return wt.sampleNotification(kind, id);
}

describe("Braintree SDK webhook verifier (parse() shape)", () => {
  it("parse() roundtrip — sampleNotification + parse returns kind+timestamp+subject", async () => {
    const gw = freshGateway();
    const sample = sampleNotification(gw, "transaction_settled", "test_txn_123");

    expect(typeof sample.bt_signature).toBe("string");
    expect(typeof sample.bt_payload).toBe("string");

    const notification = (await gw.webhookNotification.parse(
      sample.bt_signature,
      sample.bt_payload,
    )) as unknown as {
      kind: string;
      timestamp: string | Date;
      subject: Record<string, unknown>;
    };

    expect(notification.kind).toBe("transaction_settled");
    // Runtime returns ISO string; route handler coerces. Test the contract.
    const ts = notification.timestamp;
    expect(typeof ts === "string" || ts instanceof Date).toBe(true);
    const parsed = ts instanceof Date ? ts : new Date(String(ts));
    expect(Number.isNaN(parsed.getTime())).toBe(false);

    // Subject for transaction_settled has `transaction.id` set deterministically.
    const txn = notification.subject.transaction as { id?: string } | undefined;
    expect(txn?.id).toBe("test_txn_123");
  });

  it("parse() rejects on invalid signature", async () => {
    const gw = freshGateway();
    await expect(
      gw.webhookNotification.parse("invalid_signature", "invalid_payload"),
    ).rejects.toThrow();
  });

  it("parse() rejects when signature was generated with different keys (cross-gateway)", async () => {
    const gwA = freshGateway();
    const gwB = new braintree.BraintreeGateway({
      environment: braintree.Environment.Sandbox,
      merchantId: "different_merchant",
      publicKey: "different_public",
      privateKey: "different_private",
    });

    const sample = sampleNotification(gwA, "subscription_charged_successfully", "sub_xyz");

    await expect(
      gwB.webhookNotification.parse(sample.bt_signature, sample.bt_payload),
    ).rejects.toThrow();
  });
});
