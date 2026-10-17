-- Additive and opt-in. No existing business or product becomes public.
CREATE TYPE "BusinessPublicPageStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED');
CREATE TABLE "BusinessPublicPage" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "publicSlug" TEXT,
  "status" "BusinessPublicPageStatus" NOT NULL DEFAULT 'DRAFT',
  "draft" JSONB NOT NULL,
  "published" JSONB,
  "version" INTEGER NOT NULL DEFAULT 1,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BusinessPublicPage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BusinessPublicPage_workspaceId_key" ON "BusinessPublicPage"("workspaceId");
CREATE UNIQUE INDEX "BusinessPublicPage_publicSlug_key" ON "BusinessPublicPage"("publicSlug");
CREATE INDEX "BusinessPublicPage_status_idx" ON "BusinessPublicPage"("status");
ALTER TABLE "BusinessPublicPage" ADD CONSTRAINT "BusinessPublicPage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "BusinessPublicPageAlias" (
  "slug" TEXT NOT NULL,
  "pageId" TEXT NOT NULL,
  "activated" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BusinessPublicPageAlias_pkey" PRIMARY KEY ("slug")
);
CREATE INDEX "BusinessPublicPageAlias_pageId_idx" ON "BusinessPublicPageAlias"("pageId");
ALTER TABLE "BusinessPublicPageAlias" ADD CONSTRAINT "BusinessPublicPageAlias_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "BusinessPublicPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
