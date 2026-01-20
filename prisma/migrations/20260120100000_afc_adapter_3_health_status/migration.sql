-- AFC-ADAPTER-3: Adapter Health Status
-- Add health monitoring fields to Adapter table

-- AddColumn
ALTER TABLE "Adapter" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- AddColumn
ALTER TABLE "Adapter" ADD COLUMN "healthStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';

-- AddColumn
ALTER TABLE "Adapter" ADD COLUMN "lastHealthCheckAt" TIMESTAMP(3);

-- AddColumn
ALTER TABLE "Adapter" ADD COLUMN "lastHealthError" VARCHAR(500);

-- CreateIndex
CREATE INDEX "Adapter_healthStatus_idx" ON "Adapter"("healthStatus");
