/**
 * Provider catalog for apps block — localizable metadata.
 *
 * Template D: each provider exposes its label/description/instructions as
 * MessageKeys, which the dictionary owns. Technical OAuth config lives in
 * `app-config.ts` (untouched, reserved for future OAuth activation).
 *
 * Slug → key path mapping uses underscore (`apple_health`) instead of dash
 * because dots/dashes in MessageKey strings are awkward for the dotted naming
 * convention. Use `providerSlugToKeyPath()` to convert.
 */

import type { MessageKey } from "@/lib/i18n/t";

export const APP_PROVIDERS = ["oura", "whoop", "apple-health"] as const;
export type AppProviderSlug = (typeof APP_PROVIDERS)[number];

/**
 * Map an `AppProviderSlug` to the segment used inside MessageKeys.
 * `apple-health` → `apple_health` (dashes are not allowed inside dotted key paths).
 */
function providerKeySegment(slug: AppProviderSlug): "oura" | "whoop" | "apple_health" {
  return slug === "apple-health" ? "apple_health" : slug;
}

export interface AppProviderMeta {
  slug: AppProviderSlug;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  logoUrl: string;
  authType: "OAuth2" | "PAT" | "Bridge";
  /** Data category enum codes (e.g. SLEEP, ACTIVITY); UI translates via apps.data_categories.*. */
  categoryCodes: readonly string[];
}

export const APP_PROVIDER_OPTIONS: readonly AppProviderMeta[] = [
  {
    slug: "oura",
    labelKey: "apps.providers.oura.label",
    descriptionKey: "apps.providers.oura.description",
    logoUrl: "/images/apps/oura.svg",
    authType: "OAuth2",
    categoryCodes: ["SLEEP", "ACTIVITY", "READINESS", "HEART_RATE"],
  },
  {
    slug: "whoop",
    labelKey: "apps.providers.whoop.label",
    descriptionKey: "apps.providers.whoop.description",
    logoUrl: "/images/apps/whoop.svg",
    authType: "OAuth2",
    categoryCodes: ["SLEEP", "RECOVERY", "WORKOUT", "BODY", "HEART_RATE"],
  },
  {
    slug: "apple-health",
    labelKey: "apps.providers.apple_health.label",
    descriptionKey: "apps.providers.apple_health.description",
    logoUrl: "/images/apps/apple-health.svg",
    authType: "OAuth2",
    categoryCodes: [
      "SLEEP",
      "ACTIVITY",
      "HEART_RATE",
      "WORKOUT",
      "BODY",
      "APP_NUTRITION",
    ],
  },
] as const;

export interface AppProviderTokenAuthMeta {
  portalUrlKey: MessageKey;
  portalLabelKey: MessageKey;
  tokenLabelKey: MessageKey;
  tokenPlaceholderKey: MessageKey;
  stepKeys: readonly MessageKey[];
  /** Data category enum codes shown in the auth modal scopes section. */
  scopeCodes: readonly string[];
}

export const APP_PROVIDER_TOKEN_AUTH: Record<AppProviderSlug, AppProviderTokenAuthMeta> = {
  oura: {
    portalUrlKey: "apps.providers.oura.token_auth.portal.url",
    portalLabelKey: "apps.providers.oura.token_auth.portal.label",
    tokenLabelKey: "apps.providers.oura.token_auth.token.label",
    tokenPlaceholderKey: "apps.providers.oura.token_auth.token.placeholder",
    stepKeys: [
      "apps.providers.oura.token_auth.steps.0",
      "apps.providers.oura.token_auth.steps.1",
      "apps.providers.oura.token_auth.steps.2",
      "apps.providers.oura.token_auth.steps.3",
    ],
    scopeCodes: ["SLEEP", "ACTIVITY", "READINESS", "HEART_RATE"],
  },
  whoop: {
    portalUrlKey: "apps.providers.whoop.token_auth.portal.url",
    portalLabelKey: "apps.providers.whoop.token_auth.portal.label",
    tokenLabelKey: "apps.providers.whoop.token_auth.token.label",
    tokenPlaceholderKey: "apps.providers.whoop.token_auth.token.placeholder",
    stepKeys: [
      "apps.providers.whoop.token_auth.steps.0",
      "apps.providers.whoop.token_auth.steps.1",
      "apps.providers.whoop.token_auth.steps.2",
      "apps.providers.whoop.token_auth.steps.3",
    ],
    scopeCodes: ["SLEEP", "RECOVERY", "WORKOUT", "BODY", "HEART_RATE"],
  },
  "apple-health": {
    portalUrlKey: "apps.providers.apple_health.token_auth.portal.url",
    portalLabelKey: "apps.providers.apple_health.token_auth.portal.label",
    tokenLabelKey: "apps.providers.apple_health.token_auth.token.label",
    tokenPlaceholderKey: "apps.providers.apple_health.token_auth.token.placeholder",
    stepKeys: [
      "apps.providers.apple_health.token_auth.steps.0",
      "apps.providers.apple_health.token_auth.steps.1",
      "apps.providers.apple_health.token_auth.steps.2",
      "apps.providers.apple_health.token_auth.steps.3",
    ],
    scopeCodes: ["SLEEP", "ACTIVITY", "HEART_RATE", "WORKOUT", "BODY", "APP_NUTRITION"],
  },
};

/**
 * Lookup a provider by slug. Returns null when the slug is unknown.
 */
export function getProviderMeta(slug: string): AppProviderMeta | null {
  return APP_PROVIDER_OPTIONS.find((p) => p.slug === slug) ?? null;
}

/**
 * Lookup token-auth metadata by slug. Returns null when the slug is unknown.
 */
export function getProviderTokenAuth(slug: string): AppProviderTokenAuthMeta | null {
  return slug in APP_PROVIDER_TOKEN_AUTH
    ? APP_PROVIDER_TOKEN_AUTH[slug as AppProviderSlug]
    : null;
}

/**
 * Returns the data-category description MessageKey for a given category code.
 * Throws via the dictionary fallback when the code is unknown.
 */
export function dataCategoryLabelKey(code: string): MessageKey {
  return `apps.data_categories.${code}.label` as MessageKey;
}

export function dataCategoryDescriptionKey(code: string): MessageKey {
  return `apps.data_categories.${code}.description` as MessageKey;
}

/**
 * Status label key for the app status enum (PENDING/PROCESSING/READY/ERROR).
 */
export function appStatusLabelKey(status: string): MessageKey {
  return `apps.statuses.${status}.label` as MessageKey;
}

export function appDataPointStatusLabelKey(status: string): MessageKey {
  return `apps.data_point_statuses.${status}.label` as MessageKey;
}

export function appCategoryLabelKey(category: string): MessageKey {
  return `apps.categories.${category}.label` as MessageKey;
}

export function syncFrequencyLabelKey(value: number | string): MessageKey {
  return `apps.sync_frequency.${value}.label` as MessageKey;
}

export const SYNC_FREQUENCY_VALUES = [
  15,
  30,
  60,
  360,
  720,
  1440,
  10080,
] as const;

export type SyncFrequencyValue = (typeof SYNC_FREQUENCY_VALUES)[number];

export const ALL_DATA_CATEGORY_CODES = [
  "SLEEP",
  "ACTIVITY",
  "RECOVERY",
  "HEART_RATE",
  "WORKOUT",
  "READINESS",
  "BODY",
  "APP_NUTRITION",
  "APP_OTHER",
] as const;

// Re-export as a typed marker so callers can reference the slug→key seg fn.
export { providerKeySegment };
