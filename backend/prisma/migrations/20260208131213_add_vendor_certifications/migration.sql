-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[];
