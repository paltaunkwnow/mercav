-- CreateEnum
CREATE TYPE "PwnVerificationStatus" AS ENUM ('UNVERIFIED', 'PARTIALLY_CORROBORATED', 'CORROBORATED', 'CONFIRMED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PwnSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PwnTargetType" AS ENUM ('EMAIL', 'DOMAIN', 'IP', 'CVE');

-- CreateEnum
CREATE TYPE "PwnExposureKind" AS ENUM ('EMAIL', 'DOMAIN', 'PASSWORD_RANGE', 'ASSET');

-- CreateTable
CREATE TABLE "PwnSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "historicalReliability" INTEGER NOT NULL DEFAULT 50,
    "verificationMethod" TEXT,
    "lastEvaluatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnBreach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discoveredAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "verificationStatus" "PwnVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "claimedRecordCount" INTEGER,
    "verifiedRecordCount" INTEGER,
    "dataTypes" TEXT[],
    "severity" "PwnSeverity" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnBreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnExposure" (
    "id" TEXT NOT NULL,
    "kind" "PwnExposureKind" NOT NULL,
    "subjectHash" TEXT NOT NULL,
    "subjectHint" TEXT,
    "breachId" TEXT,
    "sourceId" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "verificationStatus" "PwnVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "riskScore" INTEGER,
    "firstSeenAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnVulnerability" (
    "id" TEXT NOT NULL,
    "cveId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cvssScore" DOUBLE PRECISION,
    "severity" "PwnSeverity" NOT NULL DEFAULT 'MEDIUM',
    "kev" BOOLEAN NOT NULL DEFAULT false,
    "sourceId" TEXT,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "references" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnVulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnOrganization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnMonitoringTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "targetType" "PwnTargetType" NOT NULL,
    "targetHash" TEXT NOT NULL,
    "targetDisplay" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnMonitoringTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "severity" "PwnSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "sourceId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdByEngine" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwnIngestionJob" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwnIngestionJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PwnSource_name_key" ON "PwnSource"("name");

-- CreateIndex
CREATE INDEX "PwnBreach_sourceId_idx" ON "PwnBreach"("sourceId");

-- CreateIndex
CREATE INDEX "PwnBreach_verificationStatus_idx" ON "PwnBreach"("verificationStatus");

-- CreateIndex
CREATE INDEX "PwnBreach_severity_idx" ON "PwnBreach"("severity");

-- CreateIndex
CREATE INDEX "PwnExposure_subjectHash_idx" ON "PwnExposure"("subjectHash");

-- CreateIndex
CREATE INDEX "PwnExposure_kind_idx" ON "PwnExposure"("kind");

-- CreateIndex
CREATE INDEX "PwnExposure_sourceId_idx" ON "PwnExposure"("sourceId");

-- CreateIndex
CREATE INDEX "PwnExposure_breachId_idx" ON "PwnExposure"("breachId");

-- CreateIndex
CREATE UNIQUE INDEX "PwnVulnerability_cveId_key" ON "PwnVulnerability"("cveId");

-- CreateIndex
CREATE INDEX "PwnVulnerability_sourceId_idx" ON "PwnVulnerability"("sourceId");

-- CreateIndex
CREATE INDEX "PwnVulnerability_severity_idx" ON "PwnVulnerability"("severity");

-- CreateIndex
CREATE INDEX "PwnVulnerability_kev_idx" ON "PwnVulnerability"("kev");

-- CreateIndex
CREATE INDEX "PwnOrganization_domain_idx" ON "PwnOrganization"("domain");

-- CreateIndex
CREATE INDEX "PwnOrganization_ownerUserId_idx" ON "PwnOrganization"("ownerUserId");

-- CreateIndex
CREATE INDEX "PwnMonitoringTarget_targetHash_idx" ON "PwnMonitoringTarget"("targetHash");

-- CreateIndex
CREATE INDEX "PwnMonitoringTarget_organizationId_idx" ON "PwnMonitoringTarget"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PwnMonitoringTarget_userId_targetType_targetHash_key" ON "PwnMonitoringTarget"("userId", "targetType", "targetHash");

-- CreateIndex
CREATE INDEX "PwnAlert_userId_status_idx" ON "PwnAlert"("userId", "status");

-- CreateIndex
CREATE INDEX "PwnAlert_targetId_idx" ON "PwnAlert"("targetId");

-- CreateIndex
CREATE INDEX "PwnAlert_sourceId_idx" ON "PwnAlert"("sourceId");

-- CreateIndex
CREATE INDEX "PwnAlert_createdAt_idx" ON "PwnAlert"("createdAt");

-- CreateIndex
CREATE INDEX "PwnReport_userId_idx" ON "PwnReport"("userId");

-- CreateIndex
CREATE INDEX "PwnReport_organizationId_idx" ON "PwnReport"("organizationId");

-- CreateIndex
CREATE INDEX "PwnAuditLog_actorId_idx" ON "PwnAuditLog"("actorId");

-- CreateIndex
CREATE INDEX "PwnAuditLog_action_idx" ON "PwnAuditLog"("action");

-- CreateIndex
CREATE INDEX "PwnAuditLog_createdAt_idx" ON "PwnAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "PwnIngestionJob_sourceId_idx" ON "PwnIngestionJob"("sourceId");

-- CreateIndex
CREATE INDEX "PwnIngestionJob_status_idx" ON "PwnIngestionJob"("status");

-- AddForeignKey
ALTER TABLE "PwnBreach" ADD CONSTRAINT "PwnBreach_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PwnSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnExposure" ADD CONSTRAINT "PwnExposure_breachId_fkey" FOREIGN KEY ("breachId") REFERENCES "PwnBreach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnExposure" ADD CONSTRAINT "PwnExposure_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PwnSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnVulnerability" ADD CONSTRAINT "PwnVulnerability_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PwnSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnMonitoringTarget" ADD CONSTRAINT "PwnMonitoringTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnMonitoringTarget" ADD CONSTRAINT "PwnMonitoringTarget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "PwnOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnAlert" ADD CONSTRAINT "PwnAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnAlert" ADD CONSTRAINT "PwnAlert_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "PwnMonitoringTarget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnAlert" ADD CONSTRAINT "PwnAlert_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PwnSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnReport" ADD CONSTRAINT "PwnReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnReport" ADD CONSTRAINT "PwnReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "PwnOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwnIngestionJob" ADD CONSTRAINT "PwnIngestionJob_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "PwnSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
