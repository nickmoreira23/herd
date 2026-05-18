/**
 * Public surface of the `integrations` module (Sub-etapa 7).
 *
 * Consumers import only from here. The static registry is initialized as a
 * side-effect of importing `./registry` (which imports each adapter file
 * and validates manifests at load); there is no separate `register*` call
 * needed at the application bootstrap. This mirrors the convention used by
 * `src/lib/blocks/registry.ts` and `src/lib/tools/registry.ts`.
 */

// Base contracts
export type {
  IntegrationAdapter,
  AdapterConfig,
  HealthCheckResult,
} from "./adapter.interface";
export type {
  IntegrationManifest,
  AuthType,
} from "./manifest.schema";
export { IntegrationManifestSchema } from "./manifest.schema";
export type { CapabilityFlags } from "./capabilities";
export { CapabilityFlagsSchema } from "./capabilities";

// Payment vertical
export type { PaymentProviderAdapter } from "./payment/payment-adapter.interface";
export type {
  PaymentProviderManifest,
  ChargeModel,
} from "./payment/payment-manifest.schema";
export { PaymentProviderManifestSchema } from "./payment/payment-manifest.schema";

// Registry (side-effect: validates and registers the 4 adapters at load)
export {
  integrationAdapterRegistry,
  getAdapter,
  getAllAdapters,
  getAllManifests,
} from "./registry";
