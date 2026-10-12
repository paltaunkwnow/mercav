-- CreateEnum
CREATE TYPE "KosherKashrutPreference" AS ENUM ('certified', 'supervised', 'all');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "KosherStatus" ADD VALUE 'supervised';
ALTER TYPE "KosherStatus" ADD VALUE 'self_declared';
ALTER TYPE "KosherStatus" ADD VALUE 'some_products';
ALTER TYPE "KosherStatus" ADD VALUE 'some_dishes';
ALTER TYPE "KosherStatus" ADD VALUE 'kosher_style';

-- AlterTable
ALTER TABLE "KosherProfile" ADD COLUMN     "kashrutPreference" "KosherKashrutPreference";

-- AlterTable
ALTER TABLE "KosherPlace" ADD COLUMN     "coverPhotoId" TEXT,
ADD COLUMN     "hours" JSONB,
ADD COLUMN     "osmId" TEXT,
ADD COLUMN     "priceLevel" INTEGER,
ADD COLUMN     "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timezone" TEXT;

-- CreateTable
CREATE TABLE "KosherPhoto" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mime" VARCHAR(40) NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "bytes" INTEGER NOT NULL,
    "caption" VARCHAR(140),
    "position" INTEGER NOT NULL DEFAULT 0,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KosherFavorite" (
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KosherFavorite_pkey" PRIMARY KEY ("userId","placeId")
);

-- CreateIndex
CREATE INDEX "KosherPhoto_placeId_position_idx" ON "KosherPhoto"("placeId", "position");

-- CreateIndex
CREATE INDEX "KosherFavorite_placeId_idx" ON "KosherFavorite"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "KosherPlace_osmId_key" ON "KosherPlace"("osmId");

-- AddForeignKey
ALTER TABLE "KosherPhoto" ADD CONSTRAINT "KosherPhoto_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherPhoto" ADD CONSTRAINT "KosherPhoto_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherFavorite" ADD CONSTRAINT "KosherFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KosherFavorite" ADD CONSTRAINT "KosherFavorite_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "KosherPlace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

