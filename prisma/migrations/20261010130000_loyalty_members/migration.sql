-- Fidelización: número de cliente, MercavClub y tarjetas vinculadas a una cuenta Mercav.

CREATE TYPE "LoyaltyHolderStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED');

ALTER TABLE "LoyaltyProgram" ADD COLUMN "nextCustomerNo" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "LoyaltyCard"
  ADD COLUMN "customerNo" INTEGER,
  ADD COLUMN "linkedAt" TIMESTAMP(3),
  ADD COLUMN "holderStatus" "LoyaltyHolderStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "holderVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "holderVerifiedById" TEXT,
  ADD COLUMN "holderDocType" TEXT,
  ADD COLUMN "holderDocLast4" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "realDataAckAt" TIMESTAMP(3);

-- Numerar las tarjetas que ya existen, por programa y en orden de alta; el contador sigue desde ahí.
WITH numbered AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "programId" ORDER BY "createdAt", "id") AS n FROM "LoyaltyCard"
)
UPDATE "LoyaltyCard" c SET "customerNo" = numbered.n FROM numbered WHERE numbered."id" = c."id";
UPDATE "LoyaltyProgram" p
   SET "nextCustomerNo" = COALESCE((SELECT MAX(c."customerNo") FROM "LoyaltyCard" c WHERE c."programId" = p."id"), 0) + 1;
ALTER TABLE "LoyaltyCard" ALTER COLUMN "customerNo" SET NOT NULL;
CREATE UNIQUE INDEX "LoyaltyCard_programId_customerNo_key" ON "LoyaltyCard"("programId", "customerNo");

-- La columna userId existía sin uso ni clave foránea: limpiar lo que no apunte a una cuenta y atarla a User.
UPDATE "LoyaltyCard" SET "userId" = NULL WHERE "userId" IS NOT NULL AND "userId" NOT IN (SELECT "id" FROM "User");
ALTER TABLE "LoyaltyCard" ADD CONSTRAINT "LoyaltyCard_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "LoyaltyCard_userId_idx" ON "LoyaltyCard"("userId");
CREATE UNIQUE INDEX "LoyaltyCard_programId_userId_key" ON "LoyaltyCard"("programId", "userId");

-- MercavClub: un código por cuenta.
ALTER TABLE "User" ADD COLUMN "clubCode" TEXT;
CREATE UNIQUE INDEX "User_clubCode_key" ON "User"("clubCode");
