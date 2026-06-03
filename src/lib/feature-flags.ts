/**
 * Feature flag registry. Read-only constants for now — a knob to toggle
 * in-progress modules off without touching every consumer. When the system
 * grows past env-var-driven flags, swap the source for a real flag service
 * here without changing call sites.
 */

const TRUTHY = new Set(["1", "true", "yes", "on"]);

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw =
    typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (raw == null || raw === "") return defaultValue;
  return TRUTHY.has(raw.toLowerCase());
}

export const FEATURE_FLAGS = {
  /**
   * Meeting Prep module — pre-meeting prep tool with multi-agent role-play.
   * Default ON in development so the prototype is reachable; gate via
   * MEETING_PREP_ENABLED=0 to hide.
   */
  MEETING_PREP: envFlag("MEETING_PREP_ENABLED", true),
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * `can()`-based enforcement rollout switch (Roles & Permissions V2).
 *
 * Tri-state — `envFlag` above is boolean-only, so this is read here as a small
 * localized union instead of forcing it into the boolean registry:
 *   - `off`     (default) — `enforce()` is a no-op; `can()` never runs. Zero
 *                           behavior change. This is the merged-state default.
 *   - `shadow`  — `enforce()` runs `can()`, logs agreement/divergence vs
 *                 `requireOrgRole`, but NEVER changes the result.
 *   - `enforce` — `can()` denials tighten the gate (403) on top of
 *                 `requireOrgRole` (defense-in-depth).
 *
 * Read at call time (not module load) so per-request / per-test env changes
 * take effect. Set via `CAN_ENFORCEMENT=shadow|enforce`.
 */
export type CanEnforcementMode = "off" | "shadow" | "enforce";

export function getCanEnforcementMode(): CanEnforcementMode {
  const raw = (
    typeof process !== "undefined" ? process.env?.CAN_ENFORCEMENT : undefined
  )
    ?.trim()
    .toLowerCase();
  if (raw === "shadow") return "shadow";
  if (raw === "enforce") return "enforce";
  return "off";
}

/**
 * Proxy auth-gate validation mode (SE-PERM Peça 1).
 *
 * The proxy gate is presence-only today (`isLoggedIn = !!cookie`) — it does not
 * validate the session JWT, so routes without their own `auth()` check trust a
 * cookie that may be forged/expired. This flag rolls out real JWT validation:
 *   - `off`     (default) — presence-only (current behavior). Zero change.
 *   - `shadow`  — validate the JWT; if a cookie is present but invalid, LOG a
 *                 structured "would-block" entry, but DO NOT block (presence wins).
 *   - `enforce` — invalid token treated as not-logged (same destinations the
 *                 presence-gate gives a missing cookie: /login redirect or 401).
 *
 * Read at call time (not module load) so per-request / per-test env changes
 * take effect. Set via `AUTH_GATE_MODE=shadow|enforce`.
 */
export type AuthGateMode = "off" | "shadow" | "enforce";

export function getAuthGateMode(): AuthGateMode {
  const raw = (
    typeof process !== "undefined" ? process.env?.AUTH_GATE_MODE : undefined
  )
    ?.trim()
    .toLowerCase();
  if (raw === "shadow") return "shadow";
  if (raw === "enforce") return "enforce";
  return "off";
}
