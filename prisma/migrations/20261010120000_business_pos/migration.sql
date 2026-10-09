-- Mercav Business: la caja (POS) pasa a ser de la empresa y la usan sus miembros según su rol.
-- Aditiva: la caja personal de antes (userId) sigue andando hasta que el dueño la trae a su empresa.

ALTER TABLE "POSConfig" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "POSConfig" ADD COLUMN "workspaceId" TEXT;
CREATE UNIQUE INDEX "POSConfig_workspaceId_key" ON "POSConfig"("workspaceId");
ALTER TABLE "POSConfig" ADD CONSTRAINT "POSConfig_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "BusinessWorkspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Quién vendió, anuló, abrió y cerró (cuentas Mercav; null en la caja personal).
ALTER TABLE "POSSale" ADD COLUMN "sellerUserId" TEXT, ADD COLUMN "voidedByUserId" TEXT;
ALTER TABLE "POSCashSession" ADD COLUMN "openedByUserId" TEXT, ADD COLUMN "closedByUserId" TEXT;

CREATE INDEX "POSSale_posConfigId_createdAt_idx" ON "POSSale"("posConfigId", "createdAt");
CREATE INDEX "POSCashSession_posConfigId_status_idx" ON "POSCashSession"("posConfigId", "status");
CREATE INDEX "POSCategory_posConfigId_idx" ON "POSCategory"("posConfigId");

-- Una sola caja abierta por tienda: con varios trabajadores, "chequear y crear" ya no alcanza.
-- Antes, cerrar las abiertas de más (dejando la más reciente) para que el índice se pueda crear.
UPDATE "POSCashSession" s
   SET "status" = 'CLOSED', "closedAt" = COALESCE(s."closedAt", NOW())
 WHERE s."status" = 'OPEN'
   AND EXISTS (
     SELECT 1 FROM "POSCashSession" t
      WHERE t."posConfigId" = s."posConfigId" AND t."status" = 'OPEN' AND t."openedAt" > s."openedAt"
   );
CREATE UNIQUE INDEX "POSCashSession_one_open_per_config" ON "POSCashSession"("posConfigId") WHERE "status" = 'OPEN';
