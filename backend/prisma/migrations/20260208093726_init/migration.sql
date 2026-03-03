-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "price" TEXT,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "status" TEXT DEFAULT 'available',
ADD COLUMN     "vendor" TEXT,
ADD COLUMN     "warranty" TEXT,
ADD COLUMN     "warrantyExpiry" TIMESTAMP(3);
