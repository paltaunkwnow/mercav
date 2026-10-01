-- AlterEnum
CREATE TYPE "PwnTargetVerificationStatus_new" AS ENUM ('PENDING', 'REQUESTED', 'VERIFIED', 'DENIED');
ALTER TABLE "PwnMonitoringTarget" ALTER COLUMN "verificationStatus" DROP DEFAULT;
ALTER TABLE "PwnMonitoringTarget" ALTER COLUMN "verificationStatus" TYPE "PwnTargetVerificationStatus_new" USING ("verificationStatus"::text::"PwnTargetVerificationStatus_new");
ALTER TYPE "PwnTargetVerificationStatus" RENAME TO "PwnTargetVerificationStatus_old";
ALTER TYPE "PwnTargetVerificationStatus_new" RENAME TO "PwnTargetVerificationStatus";
DROP TYPE "PwnTargetVerificationStatus_old";
ALTER TABLE "PwnMonitoringTarget" ALTER COLUMN "verificationStatus" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PwnMonitoringTarget"
  ADD COLUMN "authorizationRequestedAt" TIMESTAMP(3),
  ADD COLUMN "authorizationMessage" VARCHAR(280),
  ADD COLUMN "verifiedByUserId" TEXT;
-- creado por pato dev y askforvini
