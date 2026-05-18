import { describe, it, expect } from "vitest";
import { IntegrationCategory } from "@prisma/client";
import { IntegrationManifestSchema } from "../manifest.schema";
import { PaymentProviderManifestSchema } from "../payment/payment-manifest.schema";

const baseValid = {
  slug: "test-provider",
  name: "Test Provider",
  category: IntegrationCategory.SUPPORT,
  capabilities: {
    supportsWebhooks: true,
    supportsOAuth: false,
    supportsHmacSignature: true,
  },
  webhookEvents: ["test.created"],
  authType: "token" as const,
  version: "1.0.0",
};

describe("IntegrationManifestSchema", () => {
  it("accepts a minimal well-formed manifest", () => {
    expect(() => IntegrationManifestSchema.parse(baseValid)).not.toThrow();
  });

  it("infers slug, name, category, capabilities, webhookEvents, authType, version", () => {
    const parsed = IntegrationManifestSchema.parse(baseValid);
    expect(parsed.slug).toBe("test-provider");
    expect(parsed.category).toBe(IntegrationCategory.SUPPORT);
    expect(parsed.capabilities.supportsWebhooks).toBe(true);
  });

  it("rejects empty slug", () => {
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, slug: "" }),
    ).toThrow();
  });

  it("rejects non-kebab-case slug", () => {
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, slug: "Test_Provider" }),
    ).toThrow();
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, slug: "TestProvider" }),
    ).toThrow();
  });

  it("rejects unknown authType", () => {
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, authType: "magic-link" }),
    ).toThrow();
  });

  it("rejects non-semver version", () => {
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, version: "1.0" }),
    ).toThrow();
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, version: "v1.0.0" }),
    ).toThrow();
  });

  it("rejects missing required capability flags", () => {
    expect(() =>
      IntegrationManifestSchema.parse({
        ...baseValid,
        capabilities: { supportsWebhooks: true }, // missing supportsOAuth, supportsHmacSignature
      }),
    ).toThrow();
  });

  it("rejects unknown IntegrationCategory value", () => {
    expect(() =>
      IntegrationManifestSchema.parse({
        ...baseValid,
        category: "NOT_A_REAL_CATEGORY",
      }),
    ).toThrow();
  });

  it("accepts empty webhookEvents array (provider with no webhook surface)", () => {
    expect(() =>
      IntegrationManifestSchema.parse({ ...baseValid, webhookEvents: [] }),
    ).not.toThrow();
  });
});

describe("PaymentProviderManifestSchema", () => {
  const paymentValid = {
    ...baseValid,
    slug: "test-payment",
    name: "Test Payment",
    category: IntegrationCategory.BILLING,
    chargeModel: "subscription" as const,
    supportedCurrencies: ["USD"],
    supportsBillingPortal: true,
  };

  it("accepts a well-formed payment manifest with BILLING", () => {
    expect(() =>
      PaymentProviderManifestSchema.parse(paymentValid),
    ).not.toThrow();
  });

  it("accepts PAYMENT as alternative category", () => {
    expect(() =>
      PaymentProviderManifestSchema.parse({
        ...paymentValid,
        category: IntegrationCategory.PAYMENT,
      }),
    ).not.toThrow();
  });

  it("rejects non-BILLING/non-PAYMENT category", () => {
    expect(() =>
      PaymentProviderManifestSchema.parse({
        ...paymentValid,
        category: IntegrationCategory.SUPPORT,
      }),
    ).toThrow();
  });

  it("rejects missing chargeModel", () => {
    const { chargeModel: _chargeModel, ...withoutChargeModel } = paymentValid;
    void _chargeModel;
    expect(() =>
      PaymentProviderManifestSchema.parse(withoutChargeModel),
    ).toThrow();
  });

  it("rejects empty supportedCurrencies", () => {
    expect(() =>
      PaymentProviderManifestSchema.parse({
        ...paymentValid,
        supportedCurrencies: [],
      }),
    ).toThrow();
  });

  it("rejects non-ISO-4217 currency codes", () => {
    expect(() =>
      PaymentProviderManifestSchema.parse({
        ...paymentValid,
        supportedCurrencies: ["dollars"],
      }),
    ).toThrow();
    expect(() =>
      PaymentProviderManifestSchema.parse({
        ...paymentValid,
        supportedCurrencies: ["us"],
      }),
    ).toThrow();
  });
});
