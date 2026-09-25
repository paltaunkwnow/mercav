-- AlterTable
ALTER TABLE "PwnForumSignal" ADD COLUMN "signalKind" TEXT NOT NULL DEFAULT 'OTHER';

-- CreateIndex
CREATE INDEX "PwnForumSignal_signalKind_idx" ON "PwnForumSignal"("signalKind");
-- creado por Patodev y Invertilo
