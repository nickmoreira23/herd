import type { IntegrationAdapter } from "./adapter.interface";
import {
  IntegrationManifestSchema,
  type IntegrationManifest,
} from "./manifest.schema";
import { PaymentProviderManifestSchema } from "./payment/payment-manifest.schema";

/**
 * Sub-etapa 7 — Static integration adapter registry.
 *
 * Mirrors the convention used by `src/lib/blocks/registry.ts` and
 * `src/lib/tools/registry.ts`: an explicit array of adapters, imported
 * directly, used to construct a lookup `Map`. NOT auto-registered via
 * side-effect — bundler tree-shaking can drop unreferenced modules in
 * Next.js builds, and an explicit array makes "what's registered?" a
 * single-file lookup.
 *
 * Validation runs at module load (Decision #4 of the spec). A malformed
 * manifest throws during the import chain, before any request hits a
 * route — fail fast, not on first user.
 */

import { braintreeAdapter } from "./integrations/braintree.integration";
import { gorgiasAdapter } from "./integrations/gorgias.integration";
import { intercomAdapter } from "./integrations/intercom.integration";
import { rechargeAdapter } from "./integrations/recharge.integration";
import { recallAdapter } from "./integrations/recall.integration";

const adapters: IntegrationAdapter[] = [
  braintreeAdapter,
  gorgiasAdapter,
  intercomAdapter,
  rechargeAdapter,
  recallAdapter,
];

function validateManifest(adapter: IntegrationAdapter): void {
  // Base validation runs for every adapter. Vertical schemas (payment) layer
  // on top — they accept a superset of the base, so the base call is always
  // safe to run first.
  IntegrationManifestSchema.parse(adapter.manifest);

  // Payment vertical: detected by category being BILLING or PAYMENT.
  // We don't use `instanceof` (interfaces have no runtime trace) — the
  // manifest category drives the extra validation step.
  const cat = adapter.manifest.category;
  if (cat === "BILLING" || cat === "PAYMENT") {
    PaymentProviderManifestSchema.parse(adapter.manifest);
  }

  // Defense-in-depth: top-level slug must equal manifest slug. Cheap check,
  // catches a copy-paste bug where the adapter literal disagrees with itself.
  if (adapter.slug !== adapter.manifest.slug) {
    throw new Error(
      `adapter slug "${adapter.slug}" does not match manifest.slug "${adapter.manifest.slug}"`,
    );
  }
}

function buildRegistry(
  list: IntegrationAdapter[],
): Map<string, IntegrationAdapter> {
  const map = new Map<string, IntegrationAdapter>();
  for (const adapter of list) {
    validateManifest(adapter);
    if (map.has(adapter.slug)) {
      throw new Error(`duplicate adapter slug: ${adapter.slug}`);
    }
    map.set(adapter.slug, adapter);
  }
  return map;
}

/** Slug → adapter. Built at module load, immutable thereafter. */
export const integrationAdapterRegistry = buildRegistry(adapters);

export function getAdapter(slug: string): IntegrationAdapter | undefined {
  return integrationAdapterRegistry.get(slug);
}

export function getAllAdapters(): IntegrationAdapter[] {
  return Array.from(integrationAdapterRegistry.values());
}

export function getAllManifests(): IntegrationManifest[] {
  return getAllAdapters().map((a) => a.manifest);
}

/**
 * Test-only escape hatch. Builds a fresh registry from a custom list
 * — used by `registry.test.ts` to exercise duplicate-slug detection
 * and validation failures without polluting the global singleton.
 *
 * NOT exported from the barrel; tests reach in via direct path.
 */
export function __buildRegistryForTests(
  list: IntegrationAdapter[],
): Map<string, IntegrationAdapter> {
  return buildRegistry(list);
}
