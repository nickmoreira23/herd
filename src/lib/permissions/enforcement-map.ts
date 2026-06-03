import type { ActionType, ResourceType } from "@/lib/permissions";
import type { MemberRole } from "@prisma/client";

/**
 * Enforcement contract (Etapa V2.1) — REFERENCE ONLY, NOT CONSUMED AT RUNTIME.
 *
 * Maps every `requireOrgRole(...)` call-site to the `(resource, action)` it
 * represents in the RBAC model, so a future etapa can wire `can(actor, {...})`
 * deterministically instead of guessing. Nothing imports this yet; it exists to
 * be type-checked (the resource/action strings are validated against the real
 * `ResourceType`/`ActionType` unions) and to be adopted by Etapa V2.2+.
 *
 * Human-readable companion: `docs/permissions/enforcement-map.md` (rationale,
 * ghost resources, proxies, and the V2.1 method corrections).
 *
 * Key = `"<METHOD> <path>"` (or `"RSC <path>"` for server-component page guards).
 * `allowedRoles` is the CURRENT coarse gate argument (informational).
 * When `scopeType === "department"`, the scope id is the route's dept param at
 * runtime (see `scopeNote`).
 */
export interface EnforcementMapEntry {
  allowedRoles: readonly MemberRole[];
  resource: ResourceType;
  action: ActionType;
  scopeType: "org" | "department";
  scopeNote?: string;
  note?: string;
}

const O_A_M = ["OWNER", "ADMIN", "MEMBER"] as const;
const O_A = ["OWNER", "ADMIN"] as const;
const O = ["OWNER"] as const;

export const ENFORCEMENT_MAP = {
  // ── Org hierarchy ────────────────────────────────────────────────────
  "GET /api/org/hierarchy": { allowedRoles: O_A_M, resource: "org_hierarchy", action: "read", scopeType: "org" },
  "PATCH /api/org/hierarchy/reparent": { allowedRoles: O_A, resource: "org_hierarchy", action: "update", scopeType: "org" },
  "GET /api/org-chart/internal": { allowedRoles: O_A_M, resource: "org_hierarchy", action: "read", scopeType: "org", note: "org-chart ⇒ hierarchy" },

  // ── Departments ──────────────────────────────────────────────────────
  "POST /api/org/[id]/departments": { allowedRoles: O_A, resource: "departments", action: "create", scopeType: "org", note: "dept on a child org (vertical)" },
  "DELETE /api/org/[id]/departments/[deptId]": { allowedRoles: O_A, resource: "departments", action: "delete", scopeType: "org" },
  "GET /api/departments": { allowedRoles: O_A_M, resource: "departments", action: "read", scopeType: "org" },
  "POST /api/departments": { allowedRoles: O_A, resource: "departments", action: "create", scopeType: "org" },
  "GET /api/departments/tree": { allowedRoles: O_A_M, resource: "departments", action: "read", scopeType: "org" },
  "GET /api/departments/[id]": { allowedRoles: O_A_M, resource: "departments", action: "read", scopeType: "org" },
  "PATCH /api/departments/[id]": { allowedRoles: O_A, resource: "departments", action: "update", scopeType: "org" },
  "DELETE /api/departments/[id]": { allowedRoles: O_A, resource: "departments", action: "delete", scopeType: "org", note: "deletes the dept itself" },
  "POST /api/departments/[id]/members": { allowedRoles: O_A, resource: "departments", action: "update", scopeType: "department", scopeNote: "scopeId = [id] (deptId)", note: "D8 — add member = update the dept roster" },
  "DELETE /api/departments/[id]/members": { allowedRoles: O_A, resource: "departments", action: "update", scopeType: "department", scopeNote: "scopeId = [id] (deptId)", note: "D8 — remove member = update the dept roster (NOT delete the dept)" },

  // ── Locations ────────────────────────────────────────────────────────
  "GET /api/locations": { allowedRoles: O_A_M, resource: "locations", action: "read", scopeType: "org" },
  "POST /api/locations": { allowedRoles: O_A, resource: "locations", action: "create", scopeType: "org" },
  "GET /api/locations/[id]": { allowedRoles: O_A_M, resource: "locations", action: "read", scopeType: "org" },
  "PATCH /api/locations/[id]": { allowedRoles: O_A, resource: "locations", action: "update", scopeType: "org" },
  "DELETE /api/locations/[id]": { allowedRoles: O_A, resource: "locations", action: "delete", scopeType: "org" },

  // ── Members + invitations ────────────────────────────────────────────
  "PATCH /api/org/members/[memberId]/role": { allowedRoles: O_A, resource: "members", action: "update", scopeType: "org", note: "V1 Etapa 2 — set member ORG role" },
  "RSC /admin/organization/members": { allowedRoles: O_A_M, resource: "members", action: "read", scopeType: "org", note: "page guard" },
  "POST /api/org/invitations": { allowedRoles: O_A, resource: "members", action: "invite", scopeType: "org" },
  "GET /api/org/invitations": { allowedRoles: O_A, resource: "invitations", action: "read", scopeType: "org", note: "Fase 4a — own resource: invitations-read is O_A (members-read is O_A_M)" },
  "POST /api/org/invitations/[token]/revoke": { allowedRoles: O_A, resource: "members", action: "invite", scopeType: "org", note: "D7 — revoke = manage-invites capability" },

  // ── Org lifecycle ────────────────────────────────────────────────────
  "DELETE /api/org/[id]": { allowedRoles: O, resource: "org", action: "delete", scopeType: "org", note: "hard-delete (dissolution step 2)" },
  "POST /api/org/[id]/restore": { allowedRoles: O, resource: "org", action: "restore", scopeType: "org", note: "Fase 4a — own action: restore is Owner-only (org.update is also ADMIN)" },
  "POST /api/org/[id]/dissolve": { allowedRoles: O, resource: "org", action: "delete", scopeType: "org", note: "D5 — dissolve = soft-delete (ACTIVE→ARCHIVED)" },

  // ── Proxy (no dedicated resource) ────────────────────────────────────
  "RSC /admin/organization/permissions": { allowedRoles: O_A_M, resource: "members", action: "read", scopeType: "org", note: "D9 PROXY — viewing the role model ≈ reading members governance; no `permissions` resource" },
} as const satisfies Record<string, EnforcementMapEntry>;

/**
 * Ghost resources (D10): declared in ROLE_PERMISSIONS but with ZERO
 * `requireOrgRole` route to attach `can()` to. Model-only until they grow
 * org-scoped routes. `integrations` is `requireSuperAdmin` (platform-level),
 * out of scope of org-scoped `can()`. See enforcement-map.md for triggers.
 */
export const GHOST_RESOURCES: readonly ResourceType[] = [
  "org_billing",
  "org_settings",
  "audit_log",
  "integrations",
  "blocks_schema",
  "blocks_data",
];
