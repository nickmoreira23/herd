import type { ActionType, ResourceType } from "./types";

/**
 * R&P Fase 6a — the inviolable OWNER floor (anti-self-lockout).
 *
 * These (resource, action) grants on the OWNER role can NEVER be revoked by a
 * per-org deny override: losing them would orphan org administration (an OWNER
 * could lock itself out of role/member management). DECLARED here; it is NOT wired
 * into the loader or the editor yet — Fase 6b enforces it in BOTH places (loader
 * ignores a deny that would breach the floor; editor refuses to write one).
 */
export interface FloorEntry {
  resource: ResourceType;
  action: ActionType;
}

export const OWNER_FLOOR: readonly FloorEntry[] = [
  { resource: "roles", action: "create" },
  { resource: "roles", action: "read" },
  { resource: "roles", action: "update" },
  { resource: "roles", action: "delete" },
  { resource: "members", action: "update" },
] as const;

/** True if (resource, action) is part of the OWNER floor. */
export function isOwnerFloor(resource: ResourceType, action: ActionType): boolean {
  return OWNER_FLOOR.some((f) => f.resource === resource && f.action === action);
}
