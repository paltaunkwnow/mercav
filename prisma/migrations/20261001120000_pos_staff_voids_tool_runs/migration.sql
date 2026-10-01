-- AlterTable
ALTER TABLE "POSConfig" ADD COLUMN     "kosherPlaceId" TEXT;

-- AlterTable
ALTER TABLE "POSProduct" ADD COLUMN     "kosherCategory" "KosherStockCategory",
ADD COLUMN     "minStock" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "POSSale" ADD COLUMN     "clientRef" TEXT,
ADD COLUMN     "staffId" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedById" TEXT;

-- AlterTable
ALTER TABLE "POSCashSession" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "POSStaff" (
    "id" TEXT NOT NULL,
    "posConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CASHIER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "POSStaff_posConfigId_idx" ON "POSStaff"("posConfigId");

-- CreateIndex
CREATE INDEX "ToolRun_userId_tool_createdAt_idx" ON "ToolRun"("userId", "tool", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "POSSale_clientRef_key" ON "POSSale"("clientRef");

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "POSStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSCashSession" ADD CONSTRAINT "POSCashSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "POSStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSStaff" ADD CONSTRAINT "POSStaff_posConfigId_fkey" FOREIGN KEY ("posConfigId") REFERENCES "POSConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolRun" ADD CONSTRAINT "ToolRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

