-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOCTURNO', 'COMPLETO', 'OTRO');

-- CreateTable
CREATE TABLE "BusinessShift" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "shiftType" "ShiftType" NOT NULL DEFAULT 'OTRO',
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessShift_employeeId_date_startTime_endTime_key" ON "BusinessShift"("employeeId", "date", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "BusinessShift_workspaceId_date_idx" ON "BusinessShift"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "BusinessShift_employeeId_date_idx" ON "BusinessShift"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "BusinessShift" ADD CONSTRAINT "BusinessShift_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessShift" ADD CONSTRAINT "BusinessShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "BusinessEmployee"("id") ON DELETE CASCADE;
