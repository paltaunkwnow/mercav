-- CreateEnum
CREATE TYPE "PwnTargetVerificationStatus" AS ENUM ('PENDING', 'VERIFIED');

-- AlterTable
ALTER TABLE "PwnMonitoringTarget" ADD COLUMN     "verificationStatus" "PwnTargetVerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "verificationTokenHash" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PwnMonitoringTarget_verificationStatus_idx" ON "PwnMonitoringTarget"("verificationStatus");
-- creado por Patodev y Invertilo
