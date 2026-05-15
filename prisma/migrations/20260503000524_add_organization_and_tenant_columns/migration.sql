-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "tenant_id" UUID;

-- AlterTable
ALTER TABLE "IntegrationSyncLog" ADD COLUMN     "tenant_id" UUID;

-- AlterTable
ALTER TABLE "IntegrationTierMapping" ADD COLUMN     "tenant_id" UUID;

-- AlterTable
ALTER TABLE "IntegrationWebhookEvent" ADD COLUMN     "tenant_id" UUID;

-- AlterTable
ALTER TABLE "member_connections" ADD COLUMN     "tenant_id" UUID;

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_owner_id_key" ON "organizations"("owner_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "network_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
