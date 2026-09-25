-- CreateTable
CREATE TABLE "PwnForumSignal" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "externalKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "author" TEXT,
    "category" TEXT,
    "forum" TEXT,
    "publishedAt" TIMESTAMP(3),
    "verificationStatus" "PwnVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnForumSignal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PwnForumSignal_externalKey_key" ON "PwnForumSignal"("externalKey");

-- CreateIndex
CREATE INDEX "PwnForumSignal_sourceId_idx" ON "PwnForumSignal"("sourceId");

-- CreateIndex
CREATE INDEX "PwnForumSignal_lastSeenAt_idx" ON "PwnForumSignal"("lastSeenAt");

-- CreateIndex
CREATE INDEX "PwnForumSignal_publishedAt_idx" ON "PwnForumSignal"("publishedAt");

-- AddForeignKey
ALTER TABLE "PwnForumSignal" ADD CONSTRAINT "PwnForumSignal_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PwnSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- creado por Patodev y Invertilo
