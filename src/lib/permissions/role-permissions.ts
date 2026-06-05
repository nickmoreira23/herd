import type { MemberRole } from "@prisma/client";
import type { Permission } from "./types";

/**
 * V1 cravado: hardcoded role → permissions mapping.
 * Futuro: substituir por DB-driven RolePermission table (tech debt pós-Fase 4).
 *
 * Each role has an array of granted permissions.
 * scopeType optional — when absent, role grants at the role's own scope.
 */
export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  OWNER: [
    // Org-level full control
    { resource: "org", action: "read" },
    { resource: "org", action: "update" },
    { resource: "org", action: "delete" },
    { resource: "org", action: "restore" },
    { resource: "org_settings", action: "read" },
    { resource: "org_settings", action: "update" },
    { resource: "org_billing", action: "read" },
    { resource: "org_billing", action: "update" },
    { resource: "org_hierarchy", action: "read" },
    { resource: "org_hierarchy", action: "create" },
    { resource: "org_hierarchy", action: "update" },
    { resource: "org_hierarchy", action: "delete" },
    { resource: "members", action: "read" },
    { resource: "members", action: "create" },
    { resource: "members", action: "update" },
    { resource: "members", action: "delete" },
    { resource: "members", action: "invite" },
    { resource: "invitations", action: "read" },
    { resource: "roles", action: "read" },
    { resource: "roles", action: "create" },
    { resource: "roles", action: "update" },
    { resource: "roles", action: "delete" },
    { resource: "departments", action: "read" },
    { resource: "departments", action: "create" },
    { resource: "departments", action: "update" },
    { resource: "departments", action: "delete" },
    { resource: "locations", action: "read" },
    { resource: "locations", action: "create" },
    { resource: "locations", action: "update" },
    { resource: "locations", action: "delete" },
    { resource: "audit_log", action: "read" },
    { resource: "integrations", action: "read" },
    { resource: "integrations", action: "create" },
    { resource: "integrations", action: "update" },
    { resource: "integrations", action: "delete" },
    { resource: "blocks_schema", action: "read" },
    { resource: "blocks_schema", action: "create" },
    { resource: "blocks_schema", action: "update" },
    { resource: "blocks_schema", action: "delete" },
    { resource: "blocks_data", action: "read" },
    { resource: "blocks_data", action: "create" },
    { resource: "blocks_data", action: "update" },
    { resource: "blocks_data", action: "delete" },
  ],

  ADMIN: [
    // Same as OWNER except: cannot delete org, update billing
    { resource: "org", action: "read" },
    { resource: "org", action: "update" },
    // NO org.delete — OWNER only
    { resource: "org_settings", action: "read" },
    { resource: "org_settings", action: "update" },
    { resource: "org_billing", action: "read" },
    // NO org_billing.update — OWNER only
    { resource: "org_hierarchy", action: "read" },
    { resource: "org_hierarchy", action: "create" },
    { resource: "org_hierarchy", action: "update" },
    { resource: "members", action: "read" },
    { resource: "members", action: "create" },
    { resource: "members", action: "update" },
    { resource: "members", action: "delete" },
    { resource: "members", action: "invite" },
    { resource: "invitations", action: "read" },
    { resource: "roles", action: "read" },
    { resource: "roles", action: "create" },
    { resource: "roles", action: "update" },
    { resource: "roles", action: "delete" },
    { resource: "departments", action: "read" },
    { resource: "departments", action: "create" },
    { resource: "departments", action: "update" },
    { resource: "departments", action: "delete" },
    { resource: "locations", action: "read" },
    { resource: "locations", action: "create" },
    { resource: "locations", action: "update" },
    { resource: "locations", action: "delete" },
    { resource: "audit_log", action: "read" },
    { resource: "integrations", action: "read" },
    { resource: "integrations", action: "create" },
    { resource: "integrations", action: "update" },
    { resource: "integrations", action: "delete" },
    { resource: "blocks_schema", action: "read" },
    { resource: "blocks_schema", action: "create" },
    { resource: "blocks_schema", action: "update" },
    { resource: "blocks_schema", action: "delete" },
    { resource: "blocks_data", action: "read" },
    { resource: "blocks_data", action: "create" },
    { resource: "blocks_data", action: "update" },
    { resource: "blocks_data", action: "delete" },
  ],

  MEMBER: [
    // Read most things + write blocks_data
    { resource: "org", action: "read" },
    { resource: "org_settings", action: "read" },
    { resource: "org_hierarchy", action: "read" },
    { resource: "members", action: "read" },
    { resource: "departments", action: "read" },
    { resource: "locations", action: "read" },
    { resource: "blocks_schema", action: "read" },
    { resource: "blocks_data", action: "read" },
    { resource: "blocks_data", action: "create" },
    { resource: "blocks_data", action: "update" },
    // No blocks_data.delete — avoid accidents
  ],

  DEPARTMENT_HEAD: [
    // Full control within own department
    { resource: "members", action: "read" },
    { resource: "members", action: "invite", scopeType: "department" },
    { resource: "departments", action: "update", scopeType: "department" },
    { resource: "blocks_data", action: "read" },
    { resource: "blocks_data", action: "create" },
    { resource: "blocks_data", action: "update" },
    { resource: "blocks_data", action: "delete" },
  ],

  DEPARTMENT_MANAGER: [
    // Manage existing members + blocks_data, no invite outside
    { resource: "members", action: "read" },
    { resource: "members", action: "update", scopeType: "department" },
    { resource: "blocks_data", action: "read" },
    { resource: "blocks_data", action: "create" },
    { resource: "blocks_data", action: "update" },
  ],

  DEPARTMENT_MEMBER: [
    // Read shared, write own dept
    { resource: "members", action: "read" },
    { resource: "blocks_data", action: "read" },
    { resource: "blocks_data", action: "create" },
    { resource: "blocks_data", action: "update" },
  ],
};
