-- CreateEnum
CREATE TYPE "KosherReviewState" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "KosherEventKind" AS ENUM ('shiur', 'tefila', 'jag', 'comunidad', 'juventud', 'otro');

-- CreateEnum
CREATE TYPE "KosherPrayer" AS ENUM ('shacharit', 'mincha', 'maariv');

-- CreateEnum
CREATE TYPE "KosherChesedKind" AS ENUM ('volunteer', 'bikur_cholim', 'donation', 'need');

-- CreateEnum
CREATE TYPE "KosherHostRequestStatus" AS ENUM ('pending', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "KosherClaimKind" AS ENUM ('ownership', 'certificate');

-- AlterTable
ALTER TABLE "KosherProfile" ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "KosherPlace" ADD COLUMN     "certExpiresAt" TIMESTAMP(3),
ADD COLUMN     "certificateUrl" TEXT;

-- AlterTable
ALTER TABLE "KosherCommunity" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "KosherEvent" (
    "id" TEXT NOT NULL,
    "kind" "KosherEventKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "placeId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "official" BOOLEAN NOT NULL DEFAULT false,
    "state" "KosherReviewState" NOT NULL DEFAULT 'pending',
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherMinyan" (
    "id" TEXT NOT NULL,
    "prayer" "KosherPrayer" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "placeId" TEXT,
    "locationNote" TEXT,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherMinyan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherMinyanRsvp" (
    "minyanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherMinyanRsvp_pkey" PRIMARY KEY ("minyanId","userId")
);

-- CreateTable
CREATE TABLE "KosherHost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "meals" TEXT[],
    "kashrut" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "state" "KosherReviewState" NOT NULL DEFAULT 'pending',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherHost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherHostRequest" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "status" "KosherHostRequestStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherHostRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherChesed" (
    "id" TEXT NOT NULL,
    "kind" "KosherChesedKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "contact" TEXT,
    "state" "KosherReviewState" NOT NULL DEFAULT 'pending',
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherChesed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "topics" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherPlaceManager" (
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherPlaceManager_pkey" PRIMARY KEY ("placeId","userId")
);

-- CreateTable
CREATE TABLE "KosherClaim" (
    "id" TEXT NOT NULL,
    "kind" "KosherClaimKind" NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactRole" TEXT NOT NULL,
    "contactPhone" TEXT,
    "evidence" TEXT NOT NULL,
    "agencyName" TEXT,
    "certificateUrl" TEXT,
    "certExpiresAt" TIMESTAMP(3),
    "state" "KosherReviewState" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "note" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedById" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KosherEvent_city_countryCode_startsAt_idx" ON "KosherEvent"("city", "countryCode", "startsAt");

-- CreateIndex
CREATE INDEX "KosherEvent_state_idx" ON "KosherEvent"("state");

-- CreateIndex
CREATE INDEX "KosherMinyan_city_countryCode_startsAt_idx" ON "KosherMinyan"("city", "countryCode", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "KosherHost_userId_key" ON "KosherHost"("userId");

-- CreateIndex
CREATE INDEX "KosherHost_city_countryCode_state_idx" ON "KosherHost"("city", "countryCode", "state");

-- CreateIndex
CREATE UNIQUE INDEX "KosherHostRequest_hostId_guestId_date_key" ON "KosherHostRequest"("hostId", "guestId", "date");

-- CreateIndex
CREATE INDEX "KosherChesed_city_countryCode_state_idx" ON "KosherChesed"("city", "countryCode", "state");

-- CreateIndex
CREATE INDEX "KosherAlert_city_countryCode_idx" ON "KosherAlert"("city", "countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "KosherAlert_userId_city_countryCode_key" ON "KosherAlert"("userId", "city", "countryCode");

-- CreateIndex
CREATE INDEX "KosherClaim_state_idx" ON "KosherClaim"("state");

-- CreateIndex
CREATE UNIQUE INDEX "KosherInvite_token_key" ON "KosherInvite"("token");

-- CreateIndex
CREATE INDEX "KosherInvite_placeId_idx" ON "KosherInvite"("placeId");

-- AddForeignKey
ALTER TABLE "KosherEvent" ADD CONSTRAINT "KosherEvent_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherEvent" ADD CONSTRAINT "KosherEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMinyan" ADD CONSTRAINT "KosherMinyan_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMinyan" ADD CONSTRAINT "KosherMinyan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMinyanRsvp" ADD CONSTRAINT "KosherMinyanRsvp_minyanId_fkey" FOREIGN KEY ("minyanId") REFERENCES "KosherMinyan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMinyanRsvp" ADD CONSTRAINT "KosherMinyanRsvp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherHost" ADD CONSTRAINT "KosherHost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherHostRequest" ADD CONSTRAINT "KosherHostRequest_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "KosherHost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherHostRequest" ADD CONSTRAINT "KosherHostRequest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherChesed" ADD CONSTRAINT "KosherChesed_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherAlert" ADD CONSTRAINT "KosherAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherPlaceManager" ADD CONSTRAINT "KosherPlaceManager_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherPlaceManager" ADD CONSTRAINT "KosherPlaceManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherClaim" ADD CONSTRAINT "KosherClaim_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherClaim" ADD CONSTRAINT "KosherClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

