import type { IntegrationManifest } from "./manifest.schema";

/**
 * Sub-etapa 7 — Horizontal base contract for every integration adapter.
 *
 * An `IntegrationAdapter` carries a typed manifest (validated at registry
 * load) plus optional lifecycle hooks invoked by the platform when a
 * connection is created/destroyed or when an operator/orchestrator wants to
 * probe health. Provider-specific behavior (HTTP client, OAuth flow, sync
 * jobs) lives in `src/lib/services/{provider}.ts` and is called BY the
 * adapter, not absorbed INTO it — keeps the adapter surface narrow and
 * testable without spinning up a real provider client.
 *
 * Verticals (e.g. `PaymentProviderAdapter`) extend this contract with
 * domain-specific manifests and hooks. They do NOT replace it.
 */

export type HealthCheckResult =
  | { ok: true; details?: Record<string, unknown> }
  | { ok: false; reason: string };

/**
 * Config passed to lifecycle hooks. `credentials` and `configJson` arrive
 * as `unknown` because the catalog stores them as encrypted JSON strings;
 * the adapter is responsible for parsing them with its own internal Zod
 * schema before use. Keeping them `unknown` here prevents a typo in one
 * adapter from compiling against a wrong shape from another.
 */
export interface AdapterConfig {
  tenantId: string;
  credentials: unknown;
  configJson: unknown;
}

export interface IntegrationAdapter {
  /** Mirrors `manifest.slug`; promoted to a top-level field for fast map lookup. */
  readonly slug: string;
  readonly manifest: IntegrationManifest;

  /** Called once when a member/admin completes the connection flow. */
  onConnect?(config: AdapterConfig): Promise<void>;
  /** Called when the connection is severed (logout, revoke, deletion). */
  onDisconnect?(config: AdapterConfig): Promise<void>;
  /** Cheap availability probe used by operator tooling and health pages. */
  onHealthCheck?(config: AdapterConfig): Promise<HealthCheckResult>;
}
