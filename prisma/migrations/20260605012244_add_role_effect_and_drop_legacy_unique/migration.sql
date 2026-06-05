-- CreateEnum
CREATE TYPE "role_effect" AS ENUM ('grant', 'deny');

-- DropIndex
DROP INDEX "role_permissions_role_resource_action_scope_type_key";

-- AlterTable
ALTER TABLE "role_permissions" ADD COLUMN     "effect" "role_effect" NOT NULL DEFAULT 'grant';
