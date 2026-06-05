-- SE5a — reconnect internal Marketplace visibility to the live RBAC.
-- The two orphan uuid[] arrays pointed to NetworkProfileRole/NetworkProfileType
-- (removed in Fase 3) and never carried meaningful data. Drop both and add a
-- single MemberRole[] column (decisão #23: drop+recreate, not ALTER TYPE —
-- uuid[] → member_role[] has no implicit cast). Empty array = unrestricted
-- (any logged member of the org sees the scope). DROP COLUMN discards any
-- legacy values (orphan UUIDs) — see the PROD pre-check gate in the SE5a spec.
ALTER TABLE "marketplace_section_scopes"
  DROP COLUMN "allowedProfileTypeIds",
  DROP COLUMN "allowedRoleIds",
  ADD COLUMN  "allowedRoles" "member_role"[];
