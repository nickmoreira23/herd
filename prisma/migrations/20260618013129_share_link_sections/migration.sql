-- AlterTable
ALTER TABLE "ProjectionShareLink" ADD COLUMN     "sections" TEXT[] DEFAULT ARRAY[]::TEXT[];
