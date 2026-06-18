-- CreateTable
CREATE TABLE "ProjectionShareLink" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "snapshotId" UUID NOT NULL,
    "perspective" TEXT NOT NULL DEFAULT 'general',
    "token" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProjectionShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectionShareLink_token_key" ON "ProjectionShareLink"("token");

-- CreateIndex
CREATE INDEX "ProjectionShareLink_snapshotId_idx" ON "ProjectionShareLink"("snapshotId");

-- CreateIndex
CREATE INDEX "ProjectionShareLink_token_idx" ON "ProjectionShareLink"("token");

-- AddForeignKey
ALTER TABLE "ProjectionShareLink" ADD CONSTRAINT "ProjectionShareLink_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "FinancialSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
