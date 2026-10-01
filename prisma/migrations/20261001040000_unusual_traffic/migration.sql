-- CreateTable
CREATE TABLE "UnusualTrafficEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" VARCHAR(512),
    "fingerprint" VARCHAR(160),
    "path" VARCHAR(300),
    "userId" TEXT,
    "userEmail" VARCHAR(190),
    "userName" VARCHAR(120),

    CONSTRAINT "UnusualTrafficEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UnusualTrafficEvent_createdAt_idx" ON "UnusualTrafficEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UnusualTrafficEvent_ip_idx" ON "UnusualTrafficEvent"("ip");

-- CreateIndex
CREATE INDEX "UnusualTrafficEvent_userId_idx" ON "UnusualTrafficEvent"("userId");

-- AddForeignKey
ALTER TABLE "UnusualTrafficEvent" ADD CONSTRAINT "UnusualTrafficEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- creado por pato dev y askforvini
