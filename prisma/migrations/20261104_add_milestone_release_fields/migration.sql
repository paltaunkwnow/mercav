-- Add milestone release tracking fields
ALTER TABLE "Milestone" ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "approvedAt" TIMESTAMP(3),
ADD COLUMN "released" BOOLEAN NOT NULL DEFAULT false;

-- Add index for better query performance on status and orderId
CREATE INDEX "Milestone_orderId_status_idx" ON "Milestone"("orderId", "status");
