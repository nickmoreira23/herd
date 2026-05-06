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
