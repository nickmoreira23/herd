/*
  Warnings:

  - Made the column `tenant_id` on table `member_connections` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "member_connections" ALTER COLUMN "tenant_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "IntegrationSyncLog_tenant_id_idx" ON "IntegrationSyncLog"("tenant_id");

-- CreateIndex
CREATE INDEX "IntegrationTierMapping_tenant_id_idx" ON "IntegrationTierMapping"("tenant_id");

-- CreateIndex
CREATE INDEX "IntegrationWebhookEvent_tenant_id_idx" ON "IntegrationWebhookEvent"("tenant_id");

-- CreateIndex
CREATE INDEX "member_connections_tenant_id_idx" ON "member_connections"("tenant_id");

-- AddForeignKey
ALTER TABLE "member_connections" ADD CONSTRAINT "member_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationTierMapping" ADD CONSTRAINT "IntegrationTierMapping_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookEvent" ADD CONSTRAINT "IntegrationWebhookEvent_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationSyncLog" ADD CONSTRAINT "IntegrationSyncLog_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
