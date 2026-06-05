import type { MemberRole } from "@prisma/client";
import type { ActionType, ResourceType } from "@/lib/permissions/types";
import type { NavItem, NavLink, NavGroup, ProfileNav } from "./nav-config";

/**
 * Viewer access context for nav gating.
 *
 * `orgRole`:
 *   - a MemberRole  → loaded; viewer IS a member of the current org.
 *   - null          → loaded; viewer is NOT a member of the current org.
 *   - undefined     → not loaded yet (legacy fetch path; with the Fase 7b provider
 *     it is synchronous, so this is effectively unused now).
 *
 * `isSuperAdmin` comes from the provider/session (synchronous).
 */
export interface NavViewer {
  orgRole: MemberRole | null | undefined;
  isSuperAdmin: boolean;
}

/** Domain permission predicate (Fase 7b) — the client `useCan`. */
export type CanFn = (resource: ResourceType, action: ActionType) => boolean;

/**
 * UX-only visibility (NOT security — the server guards #143/#144 still enforce).
 *
 * Two gating categories (Fase 7b):
 *   - `perm` (DOMAIN): derived from the resolved matrix via `can()` — the single
 *     source. FAIL-CLOSED (no grant → hidden). `can` already bypasses super_admin.
 *   - `gate` (COARSE / GOVERNANCE): `member` (any org role), `superAdmin`, or
 *     `ownerOnly` (the override editor, D13 — enum OWNER, outside can()).
 */
export function isNavItemVisible(
  item: { gate?: string; perm?: { resource: ResourceType; action: ActionType } },
  viewer: NavViewer,
  can: CanFn
): boolean {
  if (item.perm) return can(item.perm.resource, item.perm.action); // domain, fail-closed
  const gate = item.gate;
  if (!gate) return true; // ungated → visible to everyone
  if (viewer.isSuperAdmin) return true; // super_admin bypass (mirrors the server)
  if (gate === "superAdmin") return false;
  if (gate === "ownerOnly") return viewer.orgRole === "OWNER"; // governance (enum)
  // gate === "member":
  if (viewer.orgRole === undefined) return true; // loading (legacy) → fail-open
  return viewer.orgRole !== null; // any role → show; loaded non-member → hide
}

function filterItems(items: NavItem[], viewer: NavViewer, can: CanFn): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    if (!isNavItemVisible(item, viewer, can)) continue;
    if (item.type === "group") {
      const children = item.children.filter((c: NavLink) => isNavItemVisible(c, viewer, can));
      if (children.length === 0) continue; // drop empty group (no orphan header)
      const group: NavGroup = { ...item, children };
      out.push(group);
    } else {
      out.push(item);
    }
  }
  return out;
}

/**
 * Pure filter — returns a new ProfileNav with items the viewer cannot see
 * removed (top / middle.items / bottom). Does not mutate the input.
 */
export function filterNavByAccess(nav: ProfileNav, viewer: NavViewer, can: CanFn): ProfileNav {
  return {
    top: filterItems(nav.top, viewer, can),
    middle: nav.middle
      ? { ...nav.middle, items: filterItems(nav.middle.items, viewer, can) }
      : null,
    bottom: filterItems(nav.bottom, viewer, can),
  };
}
