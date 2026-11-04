-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARIOS', 'SERVICIOS', 'MARKETING', 'OPERACION', 'OTROS');

-- CreateTable
CREATE TABLE "BusinessExpense" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT NOT NULL,
    "receipt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessExpense_workspaceId_date_idx" ON "BusinessExpense"("workspaceId", "date");

-- CreateIndex
CREATE INDEX "BusinessExpense_workspaceId_category_idx" ON "BusinessExpense"("workspaceId", "category");

-- AddForeignKey
ALTER TABLE "BusinessExpense" ADD CONSTRAINT "BusinessExpense_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE;
