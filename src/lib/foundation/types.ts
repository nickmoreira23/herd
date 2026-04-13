// ─── Foundation Service Layer ─────────────────────────────────────
// Shared types for all foundation services (voice, payments, notifications, etc.)
// Each foundation service implements these base interfaces.

/**
 * Base interface for all foundation service providers.
 * Every provider (Deepgram, ElevenLabs, Stripe, etc.) implements this.
 */
export interface FoundationProvider {
  /** Human-readable name (e.g., "Deepgram") */
  name: string;
  /** Machine identifier (e.g., "deepgram") */
  slug: string;
  /** Check if this provider is configured and reachable */
  isAvailable(): Promise<boolean>;
  /** Optional usage/quota information */
  getUsage?(): Promise<ProviderUsage>;
}

/**
 * Per-capability provider selection with ordered fallbacks.
 * Stored in FoundationServiceConfig.configJson.
 */
export interface ProviderSelection {
  /** Primary provider slug */
  primary: string;
  /** Ordered fallback provider slugs */
  fallbacks?: string[];
  /** Provider-specific config overrides */
  config?: Record<string, unknown>;
}

/**
 * Usage/quota information for a provider.
 */
export interface ProviderUsage {
  provider: string;
  periodStart: Date;
  periodEnd: Date;
  requestCount: number;
  costCents: number;
  quotaUsed?: number;
  quotaLimit?: number;
}

/**
 * Metadata for a registered foundation service.
 * Used by the admin Foundations hub and registry.
 */
export interface FoundationServiceMeta {
  /** Machine name (e.g., "voice", "payments") */
  name: string;
  /** Display name (e.g., "Voice", "Payments") */
  displayName: string;
  /** Short description */
  description: string;
  /** Current status */
  status: "active" | "coming-soon";
  /** Admin page path */
  adminPath: string;
  /** Capabilities this service provides */
  capabilities: string[];
}
