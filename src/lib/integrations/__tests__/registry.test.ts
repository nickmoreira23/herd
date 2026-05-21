import { describe, it, expect } from "vitest";
import { IntegrationCategory } from "@prisma/client";
import {
  getAdapter,
  getAllAdapters,
  getAllManifests,
  integrationAdapterRegistry,
  __buildRegistryForTests,
} from "../registry";
import type { IntegrationAdapter } from "../adapter.interface";

describe("integration adapter registry — production state", () => {
  it("registers the production adapters", () => {
    // Sub-etapa 13 (Camada 2): braintree added as the 5th adapter, alongside
    // the 4 Sub-etapa 7 guinea-pigs (gorgias / intercom / recall-ai / recharge).
    const slugs = getAllAdapters()
      .map((a) => a.slug)
      .sort();
    expect(slugs).toEqual([
      "braintree",
      "gorgias",
      "intercom",
      "recall-ai",
      "recharge",
    ]);
  });

  it("lookup by slug returns the correct adapter", () => {
    const gorgias = getAdapter("gorgias");
    expect(gorgias?.manifest.name).toBe("Gorgias");
    expect(gorgias?.manifest.category).toBe(IntegrationCategory.SUPPORT);
  });

  it("lookup of unknown slug returns undefined", () => {
    expect(getAdapter("does-not-exist")).toBeUndefined();
  });

  it("getAllManifests returns the same count as getAllAdapters", () => {
    expect(getAllManifests().length).toBe(getAllAdapters().length);
  });

  it("registry size equals registered adapter count (no silent drops)", () => {
    // Sub-etapa 13: 4 → 5 with braintree.
    expect(integrationAdapterRegistry.size).toBe(5);
  });

  it("recharge resolves with PaymentProviderManifest shape (BILLING/PAYMENT + payment fields)", () => {
    const recharge = getAdapter("recharge");
    expect(recharge).toBeDefined();
    // Narrow via category — the test mirrors how runtime code distinguishes
    // payment providers from base adapters (instanceof is not available on
    // interfaces; category is the signal).
    const cat = recharge!.manifest.category;
    expect([
      IntegrationCategory.BILLING,
      IntegrationCategory.PAYMENT,
    ]).toContain(cat);

    // Payment-specific fields present on the manifest.
    const m = recharge!.manifest as unknown as Record<string, unknown>;
    expect(m.chargeModel).toBeDefined();
    expect(Array.isArray(m.supportedCurrencies)).toBe(true);
    expect(typeof m.supportsBillingPortal).toBe("boolean");
  });
});

describe("integration adapter registry — builder behavior", () => {
  const okAdapter = (slug: string): IntegrationAdapter => ({
    slug,
    manifest: {
      slug,
      name: `Adapter ${slug}`,
      category: IntegrationCategory.OTHER,
      capabilities: {
        supportsWebhooks: false,
        supportsOAuth: false,
        supportsHmacSignature: false,
      },
      webhookEvents: [],
      authType: "token",
      version: "1.0.0",
    },
  });

  it("validates each manifest at registry build time", () => {
    const malformed: IntegrationAdapter = {
      slug: "malformed",
      manifest: {
        slug: "malformed",
        name: "Malformed",
        // category missing → Zod throws
        capabilities: {
          supportsWebhooks: false,
          supportsOAuth: false,
          supportsHmacSignature: false,
        },
        webhookEvents: [],
        authType: "token",
        version: "1.0.0",
      } as unknown as IntegrationAdapter["manifest"],
    };
    expect(() => __buildRegistryForTests([malformed])).toThrow();
  });

  it("rejects duplicate slugs", () => {
    expect(() =>
      __buildRegistryForTests([okAdapter("dup"), okAdapter("dup")]),
    ).toThrow(/duplicate adapter slug/i);
  });

  it("rejects mismatched top-level slug vs manifest.slug", () => {
    const mismatched: IntegrationAdapter = {
      slug: "outer",
      manifest: { ...okAdapter("inner").manifest },
    };
    expect(() => __buildRegistryForTests([mismatched])).toThrow(
      /does not match manifest\.slug/i,
    );
  });

  it("payment-category adapters get PaymentProviderManifest validation too", () => {
    // BILLING category without payment-specific fields → must fail the
    // payment vertical validation, not just the base.
    const halfBaked: IntegrationAdapter = {
      slug: "half-baked-payment",
      manifest: {
        slug: "half-baked-payment",
        name: "Half-Baked",
        category: IntegrationCategory.BILLING,
        capabilities: {
          supportsWebhooks: false,
          supportsOAuth: false,
          supportsHmacSignature: false,
        },
        webhookEvents: [],
        authType: "token",
        version: "1.0.0",
        // missing chargeModel, supportedCurrencies, supportsBillingPortal
      },
    };
    expect(() => __buildRegistryForTests([halfBaked])).toThrow();
  });
});

describe("integration adapter registry — per-adapter manifests", () => {
  it("gorgias manifest passes validation (SUPPORT, HMAC, token auth)", () => {
    const a = getAdapter("gorgias");
    expect(a?.manifest.category).toBe(IntegrationCategory.SUPPORT);
    expect(a?.manifest.capabilities.supportsHmacSignature).toBe(true);
    expect(a?.manifest.authType).toBe("token");
  });

  it("intercom manifest passes validation (COMMUNICATION, OAuth, HMAC)", () => {
    const a = getAdapter("intercom");
    expect(a?.manifest.category).toBe(IntegrationCategory.COMMUNICATION);
    expect(a?.manifest.capabilities.supportsOAuth).toBe(true);
    expect(a?.manifest.authType).toBe("oauth2");
  });

  it("recall manifest passes validation (MEETINGS, HMAC via Svix)", () => {
    const a = getAdapter("recall-ai");
    expect(a?.manifest.category).toBe(IntegrationCategory.MEETINGS);
    expect(a?.manifest.webhookEvents).toContain("bot.status_change");
  });

  it("recharge manifest passes validation (BILLING, payment vertical)", () => {
    const a = getAdapter("recharge");
    expect(a?.manifest.category).toBe(IntegrationCategory.BILLING);
    expect(a?.manifest.capabilities.supportsBillingPortal).toBe(true);
  });
});
