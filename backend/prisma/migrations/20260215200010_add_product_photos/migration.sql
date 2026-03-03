-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
