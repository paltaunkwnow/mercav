-- CreateEnum
CREATE TYPE "KosherPlaceType" AS ENUM ('restaurant', 'bakery', 'butcher', 'grocery_branch', 'judaica', 'synagogue', 'mikvah', 'school', 'hotel', 'community', 'museum');

-- CreateEnum
CREATE TYPE "KosherStatus" AS ENUM ('certified', 'community_report', 'unknown', 'disputed', 'closed');

-- CreateEnum
CREATE TYPE "KosherFood" AS ENUM ('meat', 'dairy', 'parve');

-- CreateEnum
CREATE TYPE "KosherStockCategory" AS ENUM ('meat', 'wine', 'matzah', 'cheese', 'frozen', 'bakery');

-- CreateEnum
CREATE TYPE "KosherNusach" AS ENUM ('ashkenaz', 'sefarad', 'edot_hamizrach', 'spanish_portuguese', 'yemenite', 'chabad', 'other');

-- CreateEnum
CREATE TYPE "KosherDenomination" AS ENUM ('orthodox', 'conservative', 'other');

-- CreateEnum
CREATE TYPE "KosherStream" AS ENUM ('modern', 'yeshivish', 'chabad', 'hasidic', 'sephardi', 'other');

-- CreateEnum
CREATE TYPE "KosherRole" AS ENUM ('member', 'local_moderator', 'agency');

-- CreateEnum
CREATE TYPE "KosherEditStatus" AS ENUM ('pending', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "KosherProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "KosherRole" NOT NULL DEFAULT 'member',
    "denomination" "KosherDenomination",
    "orthodoxStream" "KosherStream",
    "city" TEXT,
    "countryCode" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "shabbatMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherPlace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameLocal" TEXT,
    "type" "KosherPlaceType" NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "chainId" TEXT,
    "chainName" TEXT,
    "status" "KosherStatus" NOT NULL DEFAULT 'community_report',
    "agencyName" TEXT,
    "foodCategory" "KosherFood",
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'community',
    "confirmedAt" TIMESTAMP(3),
    "phone" TEXT,
    "website" TEXT,
    "sourceUrl" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "nusach" "KosherNusach",
    "denomination" "KosherDenomination",
    "orthodoxStream" "KosherStream",
    "prayerTimes" JSONB,
    "chalavIsrael" BOOLEAN,
    "patIsrael" BOOLEAN,
    "glatt" BOOLEAN,
    "beitYosef" BOOLEAN,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherStockReport" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "category" "KosherStockCategory" NOT NULL,
    "note" VARCHAR(300) NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "confirmations" INTEGER NOT NULL DEFAULT 0,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherStockReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherStockConfirmation" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherStockConfirmation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherCommunity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" CHAR(2) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "population" INTEGER,
    "populationYear" INTEGER,
    "populationSource" TEXT,
    "languages" TEXT[],
    "denominationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherCommunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherEditSuggestion" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT NOT NULL,
    "note" VARCHAR(500),
    "status" "KosherEditStatus" NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherEditSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherReview" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "body" VARCHAR(600),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KosherReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherMessage" (
    "id" TEXT NOT NULL,
    "threadKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" VARCHAR(500) NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherMessageFlag" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherMessageFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KosherProfile_userId_key" ON "KosherProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KosherPlace_slug_key" ON "KosherPlace"("slug");

-- CreateIndex
CREATE INDEX "KosherPlace_city_countryCode_idx" ON "KosherPlace"("city", "countryCode");

-- CreateIndex
CREATE INDEX "KosherPlace_type_idx" ON "KosherPlace"("type");

-- CreateIndex
CREATE INDEX "KosherPlace_status_idx" ON "KosherPlace"("status");

-- CreateIndex
CREATE INDEX "KosherStockReport_placeId_idx" ON "KosherStockReport"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "KosherStockConfirmation_reportId_userId_key" ON "KosherStockConfirmation"("reportId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "KosherCommunity_slug_key" ON "KosherCommunity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "KosherCommunity_city_countryCode_key" ON "KosherCommunity"("city", "countryCode");

-- CreateIndex
CREATE INDEX "KosherEditSuggestion_status_idx" ON "KosherEditSuggestion"("status");

-- CreateIndex
CREATE INDEX "KosherEditSuggestion_placeId_idx" ON "KosherEditSuggestion"("placeId");

-- CreateIndex
CREATE INDEX "KosherReview_placeId_idx" ON "KosherReview"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "KosherReview_placeId_userId_key" ON "KosherReview"("placeId", "userId");

-- CreateIndex
CREATE INDEX "KosherMessage_threadKey_createdAt_idx" ON "KosherMessage"("threadKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KosherMessageFlag_messageId_userId_key" ON "KosherMessageFlag"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "KosherProfile" ADD CONSTRAINT "KosherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherPlace" ADD CONSTRAINT "KosherPlace_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherStockReport" ADD CONSTRAINT "KosherStockReport_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherStockReport" ADD CONSTRAINT "KosherStockReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherStockConfirmation" ADD CONSTRAINT "KosherStockConfirmation_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "KosherStockReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherStockConfirmation" ADD CONSTRAINT "KosherStockConfirmation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherEditSuggestion" ADD CONSTRAINT "KosherEditSuggestion_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherEditSuggestion" ADD CONSTRAINT "KosherEditSuggestion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherReview" ADD CONSTRAINT "KosherReview_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherReview" ADD CONSTRAINT "KosherReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMessage" ADD CONSTRAINT "KosherMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMessageFlag" ADD CONSTRAINT "KosherMessageFlag_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "KosherMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherMessageFlag" ADD CONSTRAINT "KosherMessageFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

