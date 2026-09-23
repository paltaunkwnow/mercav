-- AlterTable
ALTER TABLE "PwnMonitoringTarget" ADD COLUMN "targetLookup" TEXT;

-- CreateTable
CREATE TABLE "PwnRateBucket" (
    "key" TEXT NOT NULL,
    "tokens" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnRateBucket_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "PwnBreach_name_sourceId_key" ON "PwnBreach"("name", "sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "PwnExposure_subjectHash_breachId_sourceId_key" ON "PwnExposure"("subjectHash", "breachId", "sourceId");
