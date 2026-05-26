-- Sub-etapa 20: OrganizationMember + MembershipRole + OrganizationInvitation
-- Idempotent: safe to re-run

-- ========================
-- 1. New enums
-- ========================

DO $$ BEGIN
  CREATE TYPE "membership_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'INVITED', 'REMOVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "member_role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER', 'DEPARTMENT_HEAD', 'DEPARTMENT_MANAGER', 'DEPARTMENT_MEMBER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "role_scope_type" AS ENUM ('ORG', 'DEPARTMENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "invitation_status" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ========================
-- 2. NetworkProfile: add isSuperAdmin
-- ========================

ALTER TABLE "network_profiles"
  ADD COLUMN IF NOT EXISTS "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- ========================
-- 3. Organization: make owner_id nullable, drop unique constraint
-- ========================

ALTER TABLE "organizations"
  ALTER COLUMN "owner_id" DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE "organizations" DROP CONSTRAINT "organizations_owner_id_key";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- ========================
-- 4. organization_members table
-- ========================

CREATE TABLE IF NOT EXISTS "organization_members" (
  "id"                  UUID        NOT NULL DEFAULT gen_random_uuid(),
  "organization_id"     UUID        NOT NULL,
  "network_profile_id"  UUID        NOT NULL,
  "status"              "membership_status" NOT NULL DEFAULT 'ACTIVE',
  "joined_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_members_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "organization_members_network_profile_id_fkey"
    FOREIGN KEY ("network_profile_id") REFERENCES "network_profiles"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "organization_members_organization_id_network_profile_id_key"
  ON "organization_members"("organization_id", "network_profile_id");

CREATE INDEX IF NOT EXISTS "organization_members_organization_id_idx"
  ON "organization_members"("organization_id");

CREATE INDEX IF NOT EXISTS "organization_members_network_profile_id_idx"
  ON "organization_members"("network_profile_id");

-- ========================
-- 5. membership_roles table
-- ========================

CREATE TABLE IF NOT EXISTS "membership_roles" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "member_id"   UUID        NOT NULL,
  "role"        "member_role" NOT NULL,
  "scope_type"  "role_scope_type" NOT NULL DEFAULT 'ORG',
  "scope_id"    UUID,
  "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "membership_roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "membership_roles_member_id_fkey"
    FOREIGN KEY ("member_id") REFERENCES "organization_members"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "membership_roles_member_id_idx"
  ON "membership_roles"("member_id");

-- ========================
-- 6. organization_invitations table
-- ========================

CREATE TABLE IF NOT EXISTS "organization_invitations" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "organization_id" UUID        NOT NULL,
  "email"           TEXT        NOT NULL,
  "role"            "member_role" NOT NULL DEFAULT 'MEMBER',
  "status"          "invitation_status" NOT NULL DEFAULT 'PENDING',
  "token"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "created_by_id"   UUID,
  "expires_at"      TIMESTAMP(3),
  "accepted_at"     TIMESTAMP(3),
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "organization_invitations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_invitations_token_key" UNIQUE ("token"),
  CONSTRAINT "organization_invitations_organization_id_fkey"
    FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "organization_invitations_created_by_id_fkey"
    FOREIGN KEY ("created_by_id") REFERENCES "network_profiles"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "organization_invitations_organization_id_idx"
  ON "organization_invitations"("organization_id");

CREATE INDEX IF NOT EXISTS "organization_invitations_email_idx"
  ON "organization_invitations"("email");

CREATE INDEX IF NOT EXISTS "organization_invitations_token_idx"
  ON "organization_invitations"("token");

-- ========================
-- 7. Backfill: create OrganizationMember + OWNER role for existing org owners
-- ========================

INSERT INTO "organization_members" ("organization_id", "network_profile_id", "status", "joined_at")
SELECT o."id", o."owner_id", 'ACTIVE'::"membership_status", o."created_at"
FROM "organizations" o
WHERE o."owner_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organization_members" m
    WHERE m."organization_id" = o."id"
      AND m."network_profile_id" = o."owner_id"
  );

INSERT INTO "membership_roles" ("member_id", "role", "scope_type")
SELECT m."id", 'OWNER'::"member_role", 'ORG'::"role_scope_type"
FROM "organization_members" m
WHERE NOT EXISTS (
  SELECT 1 FROM "membership_roles" r
  WHERE r."member_id" = m."id" AND r."role" = 'OWNER'::"member_role"
);

-- ========================
-- 8. RLS: enable + policies for new tables
-- ========================

ALTER TABLE "organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_invitations" ENABLE ROW LEVEL SECURITY;

-- Tenant isolation for organization_members (org-scoped, not tenant_id-scoped)
DROP POLICY IF EXISTS "herd_app_full_access" ON "organization_members";
CREATE POLICY "herd_app_full_access"
  ON "organization_members"
  FOR ALL
  TO herd_app
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "herd_app_full_access" ON "membership_roles";
CREATE POLICY "herd_app_full_access"
  ON "membership_roles"
  FOR ALL
  TO herd_app
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "herd_app_full_access" ON "organization_invitations";
CREATE POLICY "herd_app_full_access"
  ON "organization_invitations"
  FOR ALL
  TO herd_app
  USING (true)
  WITH CHECK (true);
