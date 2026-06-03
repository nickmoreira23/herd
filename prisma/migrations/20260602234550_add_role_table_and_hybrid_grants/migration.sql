-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "role_id" UUID,
ADD COLUMN     "tenant_id" UUID,
ALTER COLUMN "role" DROP NOT NULL;

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roles_tenant_id_idx" ON "roles"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenant_id_key_key" ON "roles"("tenant_id", "key");

-- CreateIndex
CREATE INDEX "role_permissions_tenant_id_idx" ON "role_permissions"("tenant_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hybrid grant invariant (R&P Fase 3): exactly one of (role, role_id) is set.
-- The 97 existing system rows have role NOT NULL + role_id NULL → pass.
-- Prisma does not model CHECK constraints, so this lives in raw SQL (no migrate-dev drift).
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_xor_roleid"
  CHECK (("role" IS NOT NULL) <> ("role_id" IS NOT NULL));

-- RLS on roles (Sub-19 / ADR-002 molde): strict tenant isolation + herd_app full access.
-- roles is tenant-scoped (added to TENANT_SCOPED_MODELS); the Prisma Extension scopes
-- runtime reads. These policies are defense-in-depth (PostgREST anon/authenticated deny).
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_tenant_isolation" ON "roles";
CREATE POLICY "roles_tenant_isolation" ON "roles"
  USING ("tenant_id" = current_app_tenant_id()::uuid);
DROP POLICY IF EXISTS "roles_herd_app_full_access" ON "roles";
CREATE POLICY "roles_herd_app_full_access" ON "roles"
  FOR ALL TO herd_app USING (true) WITH CHECK (true);
