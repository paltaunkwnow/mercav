-- AlterTable
ALTER TABLE "POSCashSession" ADD COLUMN     "salesByMethod" JSONB;

-- AlterTable
ALTER TABLE "POSConfig" ADD COLUMN     "businessType" TEXT NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "paymentMethods" TEXT[] DEFAULT ARRAY['CASH', 'CARD', 'TRANSFER', 'QR']::TEXT[],
ADD COLUMN     "pricesIncludeTax" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "taxName" TEXT NOT NULL DEFAULT 'IVA',
ADD COLUMN     "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- Existing shops were set up with the restaurant flow, so they keep it.
UPDATE "POSConfig" SET "businessType" = 'GASTRONOMY';

-- AlterTable
ALTER TABLE "POSProduct" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "taxRate" DECIMAL(65,30),
ADD COLUMN     "trackStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'UNIT',
ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "stock" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "POSSale" ADD COLUMN     "subtotalAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ALTER COLUMN "orderType" SET DEFAULT 'COUNTER';

UPDATE "POSSale" SET "subtotalAmount" = "totalAmount" + "discountAmount";

-- AlterTable
ALTER TABLE "POSSaleItem" ADD COLUMN     "productName" TEXT,
ADD COLUMN     "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'UNIT',
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(65,30);

UPDATE "POSSaleItem" i SET "productName" = p."name" FROM "POSProduct" p WHERE p."id" = i."productId";

-- CreateTable
CREATE TABLE "POSPayment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POSPayment_pkey" PRIMARY KEY ("id")
);

-- Every sale before this migration was paid in cash.
INSERT INTO "POSPayment" ("id", "saleId", "method", "amount", "createdAt")
SELECT gen_random_uuid()::text, s."id", 'CASH', s."totalAmount", s."createdAt" FROM "POSSale" s;

-- CreateIndex
CREATE INDEX "POSPayment_saleId_idx" ON "POSPayment"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "POSProduct_posConfigId_barcode_key" ON "POSProduct"("posConfigId", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "POSProduct_posConfigId_sku_key" ON "POSProduct"("posConfigId", "sku");

-- AddForeignKey
ALTER TABLE "POSPayment" ADD CONSTRAINT "POSPayment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "POSSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
