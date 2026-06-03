import type { MemberRole, MembershipStatus, RoleScopeType } from "@prisma/client";

export type ResourceType =
  | "org"
  | "org_settings"
  | "org_billing"
  | "org_hierarchy"
  | "members"
  // R&P Fase 4a — split from `members`: reading the pending-invitations list is
  // O_A (not O_A_M like the members directory). Keeps can() exact vs requireOrgRole.
  | "invitations"
  | "departments"
  | "locations"
  | "audit_log"
  | "integrations"
  | "blocks_schema"
  | "blocks_data";

// R&P Fase 4a — `restore` separates the Owner-only org lifecycle restore from the
// broader `org.update` (which ADMIN also holds), so can() denies ADMIN on restore.
export type ActionType = "read" | "create" | "update" | "delete" | "invite" | "restore";

export type Permission = {
  resource: ResourceType;
  action: ActionType;
  scopeType?: "org" | "department";
  scopeId?: string;
};

export type ActorRole = {
  role: MemberRole;
  scopeType: RoleScopeType;
  scopeId: string | null;
  // Custom-role assignment (R&P Fase 4a). When set, can() keys the matrix by this
  // roleId instead of the system `role` enum. MembershipRole carries no roleId yet
  // (Fase 5/6 assigns custom roles), so getActor() never populates it today.
  roleId?: string | null;
};

export type ActorMembership = {
  organizationId: string;
  status: MembershipStatus;
  roles: ActorRole[];
};

export type Actor = {
  profileId: string;
  isSuperAdmin: boolean;
  memberships: ActorMembership[];
};
