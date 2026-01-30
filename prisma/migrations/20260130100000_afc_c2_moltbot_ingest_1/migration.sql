-- AFC-C2-MOLTBOT-INGEST-1: External Agent Identity Mapping
-- Maps external agent identifiers (Moltbot, etc.) to AFC users

-- CreateTable
CREATE TABLE "ExternalAgentIdentity" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalAgentIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalAgentIdentity_userId_idx" ON "ExternalAgentIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalAgentIdentity_provider_externalId_key" ON "ExternalAgentIdentity"("provider", "externalId");
