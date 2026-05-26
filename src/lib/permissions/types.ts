import type { MemberRole, MembershipStatus, RoleScopeType } from "@prisma/client";

export type ResourceType =
  | "org"
  | "org_settings"
  | "org_billing"
  | "org_hierarchy"
  | "members"
  | "departments"
  | "locations"
  | "audit_log"
  | "integrations"
  | "blocks_schema"
  | "blocks_data";

export type ActionType = "read" | "create" | "update" | "delete" | "invite";

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
