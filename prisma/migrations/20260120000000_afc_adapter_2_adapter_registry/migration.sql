-- AFC-ADAPTER-2: Adapter Registry
-- CreateTable
CREATE TABLE "Adapter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Adapter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Adapter_name_key" ON "Adapter"("name");

-- CreateIndex
CREATE INDEX "Adapter_enabled_idx" ON "Adapter"("enabled");

-- CreateIndex
CREATE INDEX "Adapter_name_idx" ON "Adapter"("name");
