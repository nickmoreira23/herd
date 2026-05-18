import type { IntegrationAdapter } from "../adapter.interface";
import type { PaymentProviderManifest } from "./payment-manifest.schema";

/**
 * Sub-etapa 7 — Payment vertical adapter contract.
 *
 * Narrows `IntegrationAdapter.manifest` to `PaymentProviderManifest` so
 * downstream code can rely on payment-specific fields (`chargeModel`,
 * `supportedCurrencies`, `supportsBillingPortal`) being present without a
 * runtime type guard at every callsite.
 *
 * The interface intentionally adds NO payment-specific methods today.
 * Concrete methods (createCheckoutSession, syncCustomerPortal, etc.)
 * live on the per-adapter implementation and are introduced when a real
 * caller demands them — Sub-etapa 10 for Recharge.
 */
export interface PaymentProviderAdapter extends IntegrationAdapter {
  readonly manifest: PaymentProviderManifest;
}
