import type { Session } from "next-auth";
import { apiError } from "@/lib/api-utils";
import { getCanEnforcementMode } from "@/lib/feature-flags";
import { can } from "./can";
import { getActor } from "./get-actor";
import type { Actor, Permission } from "./types";

/**
 * Defense-in-depth `can()` wrapper, gated by the tri-state `CAN_ENFORCEMENT`
 * flag. ADDITIVE to `requireOrgRole` — never replaces it. Adoption by real
 * routes is Etapa V2.3; this etapa only builds + unit-tests the wrapper.
 *
 * Modes (see `getCanEnforcementMode`):
 *   - off     → returns `current` unchanged; `can()` never runs (zero cost).
 *   - shadow  → runs `can()`, logs agreement/divergence vs `requireOrgRole`,
 *               returns `current` unchanged. NEVER blocks.
 *   - enforce → if `requireOrgRole` already passed but `can()` denies, blocks
 *               with 403; otherwise returns `current`. Only tightens.
 *
 * `current` is the result of the route's existing `requireOrgRole(...)` call
 * (a `Session` on allow, or a `Response` on deny). `enforce()` is called only
 * after `requireOrgRole`, so it composes rather than re-authorizes.
 */
export interface EnforceContext<T> {
  /** Result of the route's existing requireOrgRole(...) call. */
  current: T;
  /** Org the action runs under (passed to can()). */
  organizationId: string;
  /** Stable id matching the ENFORCEMENT_MAP key, e.g. "POST /api/departments". */
  routeId: string;
}

interface ShadowLogEntry {
  routeId: string;
  resource: string;
  action: string;
  scopeType?: string;
  actorProfileId: string;
  actorKind: "super_admin" | "member";
  requireOrgRoleResult: "allow" | "deny";
  canResult: boolean;
  agree: boolean;
}

function logShadow(entry: ShadowLogEntry): void {
  // Structured single-line log, mirroring the writeAuditLog console pattern.
  // `agree: false` rows are the bugs to fix before flipping to `enforce`.
  console.warn("[can-shadow]", entry);
}

export function enforce<T>(
  actor: Actor,
  permission: Permission,
  ctx: EnforceContext<T>
): T | Response {
  const mode = getCanEnforcementMode();

  // off — total no-op: can() never runs.
  if (mode === "off") return ctx.current;

  const requireOrgRoleAllowed = !(ctx.current instanceof Response);

  if (mode === "shadow") {
    const canResult = can(actor, permission, ctx.organizationId);
    logShadow({
      routeId: ctx.routeId,
      resource: permission.resource,
      action: permission.action,
      scopeType: permission.scopeType,
      actorProfileId: actor.profileId,
      actorKind: actor.isSuperAdmin ? "super_admin" : "member",
      requireOrgRoleResult: requireOrgRoleAllowed ? "allow" : "deny",
      canResult,
      agree: requireOrgRoleAllowed === canResult,
    });
    return ctx.current; // shadow never changes the result
  }

  // enforce — only tightens on top of an already-passing requireOrgRole.
  if (!requireOrgRoleAllowed) return ctx.current; // already denied upstream
  if (!can(actor, permission, ctx.organizationId)) {
    return apiError("Forbidden: insufficient permission", 403);
  }
  return ctx.current;
}

/**
 * Route-facing adapter. Resolves the `Actor` LAZILY so the `off` default stays
 * a true no-op: in `off` it returns `current` without ever calling `getActor`
 * (no DB hit, no `can()`). Only in `shadow`/`enforce` does it resolve the actor
 * and delegate to the sync `enforce()` core (which carries the mode logic +
 * tests). This is the call routes adopt — `enforce()` itself stays pure/sync.
 *
 * `session` is the route's existing `requireOrgRole(...)` result (already known
 * to be a Session — routes return early on its Response). `current` is passed
 * through so `enforce` mode can short-circuit consistently.
 */
export async function enforceRoute<T>(
  session: Session,
  permission: Permission,
  ctx: { current: T; organizationId: string; routeId: string }
): Promise<T | Response> {
  if (getCanEnforcementMode() === "off") return ctx.current; // zero cost
  const actor = await getActor(session);
  if (!actor) return ctx.current; // cannot evaluate — never block on missing actor
  return enforce(actor, permission, ctx);
}
