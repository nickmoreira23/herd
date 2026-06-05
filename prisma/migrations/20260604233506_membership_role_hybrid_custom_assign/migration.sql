-- AlterTable
ALTER TABLE "membership_roles" ADD COLUMN     "role_id" UUID,
ALTER COLUMN "role" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "membership_roles_role_id_idx" ON "membership_roles"("role_id");

-- AddForeignKey
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hybrid assignment invariant (R&P Fase 5, SOMA): exactly one of (role, role_id) is set.
-- A row is either a system role (role enum) or a custom-role assignment (role_id FK).
-- Existing rows have role NOT NULL + role_id NULL → pass. Prisma does not model CHECK
-- constraints, so this lives in raw SQL (no migrate-dev drift).
ALTER TABLE "membership_roles" ADD CONSTRAINT "membership_roles_role_xor_roleid"
  CHECK (("role" IS NOT NULL) <> ("role_id" IS NOT NULL));
