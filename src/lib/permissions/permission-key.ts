/**
 * R&P Fase 7a — the SINGLE source of the allow-set key format (cravada #3).
 *
 * Pure, no server-only imports: both `resolveViewerPermissions` (server) and the
 * client `can()` import this same `buildKey`. NO call-site concatenates a key by
 * hand — `can()` receives fields and calls `buildKey` internally, so the format
 * lives in exactly one place.
 *
 * Format (explicit scopeType discriminator, no ambiguity):
 *   - ORG         → "resource:action:ORG"
 *   - DEPARTMENT  → "resource:action:DEPARTMENT:<scopeId>"
 *
 * DEPARTMENT is supported even though no DEPARTMENT-scoped grant is in use today
 * (the 108 system grants + the OWNER floor are all ORG) — so the util is born
 * complete and 7b/later needs no refactor.
 */
export type KeyScopeType = "ORG" | "DEPARTMENT";

export function buildKey(
  resource: string,
  action: string,
  scopeType: KeyScopeType = "ORG",
  scopeId?: string | null
): string {
  return scopeType === "DEPARTMENT"
    ? `${resource}:${action}:DEPARTMENT:${scopeId ?? ""}`
    : `${resource}:${action}:ORG`;
}
