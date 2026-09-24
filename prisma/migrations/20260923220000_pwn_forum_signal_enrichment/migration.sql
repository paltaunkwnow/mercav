-- AlterTable
ALTER TABLE "PwnForumSignal" ADD COLUMN "priorityRank" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PwnForumSignal" ADD COLUMN "titleKey" TEXT;
ALTER TABLE "PwnForumSignal" ADD COLUMN "breachId" TEXT;

-- CreateIndex
CREATE INDEX "PwnForumSignal_priorityRank_idx" ON "PwnForumSignal"("priorityRank");
CREATE INDEX "PwnForumSignal_titleKey_idx" ON "PwnForumSignal"("titleKey");

-- AddForeignKey
ALTER TABLE "PwnForumSignal" ADD CONSTRAINT "PwnForumSignal_breachId_fkey" FOREIGN KEY ("breachId") REFERENCES "PwnBreach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
