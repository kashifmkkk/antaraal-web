-- AlterTable
ALTER TABLE "Product"
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "warrantyStatus" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "referenceCode" TEXT,
ALTER COLUMN "availability" SET DEFAULT 'On Request';

-- AlterTable
ALTER TABLE "Vendor"
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "verificationStatus" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "RFQ"
ADD COLUMN     "assignedVendor" TEXT,
ADD COLUMN     "internalNotes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'New';

UPDATE "RFQ" SET "status" = 'New' WHERE "status" = 'open';

-- AlterTable
ALTER TABLE "Quote"
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Draft',
ADD COLUMN     "validUntil" TIMESTAMP(3);

UPDATE "Product" SET "referenceCode" = 'PRD-' || "id" WHERE "referenceCode" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_referenceCode_key" ON "Product"("referenceCode");

-- CreateTable
CREATE TABLE "Complaint" (
    "id" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "productId" INTEGER NOT NULL,
    "vendorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyRecord" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "vendorId" INTEGER,
    "tailNumber" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MroOrder" (
    "id" SERIAL NOT NULL,
    "tailNumber" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "estimatedTatDays" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MroOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "notificationEmail" TEXT NOT NULL DEFAULT 'ops@skyway.aero',
    "rfqAutoAssign" BOOLEAN NOT NULL DEFAULT false,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "complianceNotes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AdminSetting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRecord" ADD CONSTRAINT "WarrantyRecord_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyRecord" ADD CONSTRAINT "WarrantyRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "AdminSetting" ("id") VALUES (1)
ON CONFLICT ("id") DO NOTHING;

-- Deduplicate vendors prior to enforcing unique names
WITH duplicates AS (
    SELECT "id", ROW_NUMBER() OVER (PARTITION BY "name" ORDER BY "id") AS rn
    FROM "Vendor"
    WHERE "name" IS NOT NULL
)
DELETE FROM "Vendor"
WHERE "id" IN (SELECT "id" FROM duplicates WHERE rn > 1);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_name_key" ON "Vendor"("name");
