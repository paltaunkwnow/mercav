-- Preferencias y estado de ayuda: aditivo, sin cambiar datos existentes.
ALTER TABLE "User" ADD COLUMN "lastBusinessWorkspaceId" TEXT;
CREATE TABLE "BusinessGuideProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "dismissedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessGuideProgress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessGuideProgress_userId_workspaceId_key" ON "BusinessGuideProgress"("userId", "workspaceId");
CREATE INDEX "BusinessGuideProgress_workspaceId_idx" ON "BusinessGuideProgress"("workspaceId");
ALTER TABLE "BusinessGuideProgress" ADD CONSTRAINT "BusinessGuideProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BusinessGuideProgress" ADD CONSTRAINT "BusinessGuideProgress_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
