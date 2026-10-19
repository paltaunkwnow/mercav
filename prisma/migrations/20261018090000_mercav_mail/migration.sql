-- Additive: independent internal mail allowlist. No existing User receives a mailbox.
CREATE TYPE "MailAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE "MailRole" AS ENUM ('USER', 'ADMIN', 'AUDITOR');
CREATE TABLE "MailAccount" (
  "id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL,
  "role" "MailRole" NOT NULL DEFAULT 'USER', "status" "MailAccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "signature" VARCHAR(4000) NOT NULL DEFAULT '', "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MailAccount_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MailAccount_email_key" ON "MailAccount"("email");
CREATE TABLE "MailSession" (
  "id" TEXT NOT NULL, "tokenHash" TEXT NOT NULL, "accountId" TEXT NOT NULL,
  "credential" TEXT NOT NULL, "jmapAccountId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MailSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MailSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "MailAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "MailSession_tokenHash_key" ON "MailSession"("tokenHash");
CREATE INDEX "MailSession_accountId_idx" ON "MailSession"("accountId");
CREATE INDEX "MailSession_expiresAt_idx" ON "MailSession"("expiresAt");
CREATE TABLE "MailAuditEvent" (
  "id" TEXT NOT NULL, "actorId" TEXT, "targetId" TEXT, "action" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MailAuditEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MailAuditEvent_createdAt_idx" ON "MailAuditEvent"("createdAt");
CREATE INDEX "MailAuditEvent_actorId_createdAt_idx" ON "MailAuditEvent"("actorId", "createdAt");
CREATE TABLE "MailRateLimit" (
  "key" TEXT NOT NULL, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MailRateLimit_pkey" PRIMARY KEY ("key")
);
CREATE INDEX "MailRateLimit_expiresAt_idx" ON "MailRateLimit"("expiresAt");
