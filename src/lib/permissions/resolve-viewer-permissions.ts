import { cache } from "react";
import type { MemberRole } from "@prisma/client";
import { loadRoleMatrix } from "./role-matrix-loader";
import { buildKey, type KeyScopeType } from "./permission-key";
import type { Actor } from "./types";

/**
 * Request-scoped memo (cravada #7). React `cache()` dedups within a single RSC
 * render — so if multiple components resolve the viewer's permissions in one
 * render tree, only ONE `loadRoleMatrix` query runs. NOT cross-request (stale
 * invalidation under enforce is security-relevant; cross-request cache is the
 * deferred tech-debt #1). The RAW `loadRoleMatrix` stays uncached for can()/tests.
 */
const loadRoleMatrixMemo = cache(loadRoleMatrix);

export interface ViewerPermissions {
  /** Canonical allow-set keys (buildKey). Empty for super_admin (client bypasses). */
  allowSet: string[];
  /** The viewer's system ORG role (enum) or null — for governance gating (D13). */
  orgRole: MemberRole | null;
  isSuperAdmin: boolean;
}

/**
 * Resolves the viewer's EFFECTIVE allow-set for `orgId` — the single source the
 * client provider is seeded from (Fase 7a). Derives entirely from the loader,
 * which already collapsed precedence (D11) + deny (D9) + the OWNER floor (D12):
 * we only UNION the surviving grants across the viewer's roles (system enum +
 * custom roleIds — SOMA, D4) and serialize via `buildKey`. No precedence/deny/
 * floor logic is re-implemented here.
 *
 * super_admin short-circuits: the client `can()` bypasses for them, so we skip the
 * matrix query and just report `orgRole` (from the already-loaded membership).
 */
export async function resolveViewerPermissions(
  orgId: string,
  actor: Actor
): Promise<ViewerPermissions> {
  const membership = actor.memberships.find((m) => m.organizationId === orgId);
  const orgRole = membership?.roles.find((r) => r.scopeType === "ORG" && r.role)?.role ?? null;

  if (actor.isSuperAdmin) {
    return { allowSet: [], orgRole, isSuperAdmin: true };
  }

  const matrix = await loadRoleMatrixMemo(orgId);
  const keys = new Set<string>();
  for (const r of membership?.roles ?? []) {
    const matrixKey = r.roleId ?? r.role;
    if (!matrixKey) continue;
    for (const p of matrix[matrixKey] ?? []) {
      const scopeType: KeyScopeType = p.scopeType === "department" ? "DEPARTMENT" : "ORG";
      keys.add(buildKey(p.resource, p.action, scopeType, r.scopeId));
    }
  }
  return { allowSet: [...keys], orgRole, isSuperAdmin: false };
}
