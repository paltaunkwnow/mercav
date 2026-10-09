-- CreateEnum
CREATE TYPE "LoyaltyProgramType" AS ENUM ('STAMPS', 'POINTS');

-- CreateEnum
CREATE TYPE "LoyaltyProgramStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LoyaltyCardStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "LoyaltyEventType" AS ENUM ('JOIN', 'WELCOME', 'STAMP', 'POINTS', 'REDEEM', 'ADJUST', 'EXPIRE', 'BIRTHDAY', 'REFERRAL');

-- CreateEnum
CREATE TYPE "LoyaltyEventSource" AS ENUM ('STAFF', 'SELF_SERVICE', 'SYSTEM');

-- CreateTable
CREATE TABLE "LoyaltyProgram" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LoyaltyProgramType" NOT NULL DEFAULT 'STAMPS',
    "businessType" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "design" JSONB NOT NULL,
    "status" "LoyaltyProgramStatus" NOT NULL DEFAULT 'DRAFT',
    "kioskSecretEnc" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyReward" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCard" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "birthday" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lifetime" INTEGER NOT NULL DEFAULT 0,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "lastVisitAt" TIMESTAMP(3),
    "lastBirthdayYear" INTEGER,
    "referredById" TEXT,
    "referralRewarded" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "status" "LoyaltyCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyEvent" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "type" "LoyaltyEventType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "rewardId" TEXT,
    "purchaseAmount" DECIMAL(12,2),
    "source" "LoyaltyEventSource" NOT NULL DEFAULT 'STAFF',
    "actorUserId" TEXT,
    "note" TEXT,
    "clientRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyCampaign" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" JSONB NOT NULL,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "LoyaltyCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyProgram_slug_key" ON "LoyaltyProgram"("slug");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_workspaceId_idx" ON "LoyaltyProgram"("workspaceId");

-- CreateIndex
CREATE INDEX "LoyaltyReward_programId_idx" ON "LoyaltyReward"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_serial_key" ON "LoyaltyCard"("serial");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_referralCode_key" ON "LoyaltyCard"("referralCode");

-- CreateIndex
CREATE INDEX "LoyaltyCard_programId_status_idx" ON "LoyaltyCard"("programId", "status");

-- CreateIndex
CREATE INDEX "LoyaltyCard_programId_lastVisitAt_idx" ON "LoyaltyCard"("programId", "lastVisitAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyCard_programId_phone_key" ON "LoyaltyCard"("programId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyEvent_clientRef_key" ON "LoyaltyEvent"("clientRef");

-- CreateIndex
CREATE INDEX "LoyaltyEvent_programId_createdAt_idx" ON "LoyaltyEvent"("programId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyEvent_cardId_createdAt_idx" ON "LoyaltyEvent"("cardId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyEvent_actorUserId_createdAt_idx" ON "LoyaltyEvent"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyCampaign_programId_createdAt_idx" ON "LoyaltyCampaign"("programId", "createdAt");

-- AddForeignKey
ALTER TABLE "LoyaltyProgram" ADD CONSTRAINT "LoyaltyProgram_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyReward" ADD CONSTRAINT "LoyaltyReward_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "LoyaltyCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEvent" ADD CONSTRAINT "LoyaltyEvent_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "LoyaltyCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEvent" ADD CONSTRAINT "LoyaltyEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyEvent" ADD CONSTRAINT "LoyaltyEvent_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "LoyaltyReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyCampaign" ADD CONSTRAINT "LoyaltyCampaign_programId_fkey" FOREIGN KEY ("programId") REFERENCES "LoyaltyProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
