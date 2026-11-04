-- CreateTable BusinessAttendance
CREATE TABLE "BusinessAttendance" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL,
    "checkOutTime" TIMESTAMP(3),
    "date" DATE NOT NULL,
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessAttendance_employeeId_date_key" ON "BusinessAttendance"("employeeId", "date");

-- CreateIndex
CREATE INDEX "BusinessAttendance_workspaceId_date_idx" ON "BusinessAttendance"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "BusinessAttendance_employeeId_date_idx" ON "BusinessAttendance"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "BusinessAttendance" ADD CONSTRAINT "BusinessAttendance_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAttendance" ADD CONSTRAINT "BusinessAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "BusinessEmployee"("id") ON DELETE CASCADE;
