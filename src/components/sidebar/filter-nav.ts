import type { MemberRole } from "@prisma/client";
import type { NavGate, NavItem, NavLink, NavGroup, ProfileNav } from "./nav-config";

/**
 * Viewer access context for nav gating (Sub-27c).
 *
 * `orgRole`:
 *   - a MemberRole  → loaded; viewer IS a member of the current org.
 *   - null          → loaded; viewer is NOT a member of the current org.
 *   - undefined     → not loaded yet (e.g. /api/org/current still in flight).
 *
 * `isSuperAdmin` comes from the session/JWT (synchronous), so it is never
 * "loading".
 */
export interface NavViewer {
  orgRole: MemberRole | null | undefined;
  isSuperAdmin: boolean;
}

/**
 * UX-only visibility (NOT security — the server guards #143/#144 still enforce).
 *
 * FAIL-OPEN: a `member`-gated item is hidden ONLY on a DEFINITIVE negative
 * (orgRole loaded === null AND not super_admin). While orgRole is still
 * loading (undefined) we SHOW the item — hiding wrongly is worse UX than
 * showing-and-letting-the-server-bounce, and it avoids a flicker-hide.
 */
export function isNavItemVisible(gate: NavGate | undefined, viewer: NavViewer): boolean {
  if (!gate) return true; // ungated → visible to everyone (current behavior)
  if (viewer.isSuperAdmin) return true; // super_admin bypass (mirrors requireOrgRole/getActor)
  if (gate === "superAdmin") return false; // isSuperAdmin is synchronous; no loading ambiguity
  // gate === "member":
  if (viewer.orgRole === undefined) return true; // loading → fail-open (show)
  return viewer.orgRole !== null; // any role → show; loaded non-member → hide
}

function filterItems(items: NavItem[], viewer: NavViewer): NavItem[] {
  const out: NavItem[] = [];
  for (const item of items) {
    if (!isNavItemVisible(item.gate, viewer)) continue;
    if (item.type === "group") {
      const children = item.children.filter((c: NavLink) => isNavItemVisible(c.gate, viewer));
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
export function filterNavByAccess(nav: ProfileNav, viewer: NavViewer): ProfileNav {
  return {
    top: filterItems(nav.top, viewer),
    middle: nav.middle
      ? { ...nav.middle, items: filterItems(nav.middle.items, viewer) }
      : null,
    bottom: filterItems(nav.bottom, viewer),
  };
}
