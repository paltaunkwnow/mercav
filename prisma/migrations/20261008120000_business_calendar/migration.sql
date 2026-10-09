-- CreateEnum
CREATE TYPE "BusinessRole" AS ENUM ('OWNER', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "BusinessEmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BusinessContractType" AS ENUM ('INDEFINIDO', 'PLAZO_FIJO', 'EVENTUAL', 'PASANTIA', 'CONSULTORIA');

-- CreateEnum
CREATE TYPE "BusinessPayrollStatus" AS ENUM ('DRAFT', 'CLOSED');

-- CreateTable
CREATE TABLE "CalendarPreference" (
    "userId" TEXT NOT NULL,
    "sources" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "country" TEXT,
    "region" TEXT,
    "israel" BOOLEAN NOT NULL DEFAULT false,
    "hidden" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "BusinessWorkspace" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "nit" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BO',
    "currency" TEXT NOT NULL DEFAULT 'BOB',
    "region" TEXT,
    "city" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "productive" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessWorkspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BusinessRole" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessEmployee" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "ciEnc" TEXT,
    "ciExt" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" TEXT,
    "nationality" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "position" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "contractType" "BusinessContractType" NOT NULL DEFAULT 'INDEFINIDO',
    "baseSalary" DECIMAL(12,2) NOT NULL,
    "bankName" TEXT,
    "bankAccountEnc" TEXT,
    "nua" TEXT,
    "cnsNumber" TEXT,
    "status" "BusinessEmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessInvite" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "employeeId" TEXT,
    "email" TEXT,
    "role" "BusinessRole" NOT NULL DEFAULT 'EMPLOYEE',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPayrollRun" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" "BusinessPayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "params" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessPayrollLine" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "daysWorked" INTEGER NOT NULL DEFAULT 30,
    "overtimeHours" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "sundayHolidayDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "otherBonuses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "advances" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "otherDeductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "rcivaCredit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "result" JSONB NOT NULL,
    "totalEarned" DECIMAL(12,2) NOT NULL,
    "totalDeductions" DECIMAL(12,2) NOT NULL,
    "netPay" DECIMAL(12,2) NOT NULL,
    "employerCost" DECIMAL(12,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessPayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessAuditLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessWorkspace_slug_key" ON "BusinessWorkspace"("slug");

-- CreateIndex
CREATE INDEX "BusinessWorkspace_ownerId_idx" ON "BusinessWorkspace"("ownerId");

-- CreateIndex
CREATE INDEX "BusinessMember_userId_idx" ON "BusinessMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMember_workspaceId_userId_key" ON "BusinessMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "BusinessEmployee_workspaceId_status_idx" ON "BusinessEmployee"("workspaceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessEmployee_workspaceId_userId_key" ON "BusinessEmployee"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInvite_tokenHash_key" ON "BusinessInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "BusinessInvite_workspaceId_idx" ON "BusinessInvite"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPayrollRun_workspaceId_year_month_key" ON "BusinessPayrollRun"("workspaceId", "year", "month");

-- CreateIndex
CREATE INDEX "BusinessPayrollLine_employeeId_idx" ON "BusinessPayrollLine"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessPayrollLine_runId_employeeId_key" ON "BusinessPayrollLine"("runId", "employeeId");

-- CreateIndex
CREATE INDEX "BusinessAuditLog_workspaceId_createdAt_idx" ON "BusinessAuditLog"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "CalendarPreference" ADD CONSTRAINT "CalendarPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessWorkspace" ADD CONSTRAINT "BusinessWorkspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessMember" ADD CONSTRAINT "BusinessMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInvite" ADD CONSTRAINT "BusinessInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInvite" ADD CONSTRAINT "BusinessInvite_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "BusinessEmployee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPayrollRun" ADD CONSTRAINT "BusinessPayrollRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPayrollLine" ADD CONSTRAINT "BusinessPayrollLine_runId_fkey" FOREIGN KEY ("runId") REFERENCES "BusinessPayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessPayrollLine" ADD CONSTRAINT "BusinessPayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "BusinessEmployee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessAuditLog" ADD CONSTRAINT "BusinessAuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
