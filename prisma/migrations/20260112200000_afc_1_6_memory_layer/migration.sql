-- CreateEnum
CREATE TYPE "MemoryScope" AS ENUM ('GLOBAL', 'PROJECT', 'RUN');

-- CreateEnum
CREATE TYPE "MemoryCategory" AS ENUM ('CODE', 'DOCUMENTATION', 'DECISION', 'ERROR', 'CONTEXT', 'CUSTOM');

-- CreateTable
CREATE TABLE "MemoryItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "runId" TEXT,
    "contentHash" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "scope" "MemoryScope" NOT NULL DEFAULT 'PROJECT',
    "category" "MemoryCategory" NOT NULL DEFAULT 'CONTEXT',
    "source" TEXT,
    "sourceType" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessed" TIMESTAMP(3),
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryUse" (
    "id" TEXT NOT NULL,
    "memoryItemId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "context" TEXT,
    "queryText" TEXT,
    "relevance" DOUBLE PRECISION,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MemoryUse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryPolicy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "maxItems" INTEGER NOT NULL DEFAULT 1000,
    "maxTokensPerQuery" INTEGER NOT NULL DEFAULT 4000,
    "maxTokensTotal" INTEGER NOT NULL DEFAULT 100000,
    "enabledScopes" JSONB NOT NULL DEFAULT '["PROJECT", "RUN"]',
    "enabledCategories" JSONB NOT NULL DEFAULT '["CODE", "DOCUMENTATION", "DECISION", "ERROR", "CONTEXT", "CUSTOM"]',
    "defaultTtlDays" INTEGER,
    "autoArchiveDays" INTEGER,
    "dedupeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "similarityThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.95,
    "decayFactor" DOUBLE PRECISION NOT NULL DEFAULT 0.99,
    "accessBoost" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunMemorySnapshot" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "snapshotAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunMemorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunMemorySnapshotItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "memoryItemId" TEXT NOT NULL,
    "scoreAtSnapshot" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RunMemorySnapshotItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryItem_projectId_idx" ON "MemoryItem"("projectId");

-- CreateIndex
CREATE INDEX "MemoryItem_runId_idx" ON "MemoryItem"("runId");

-- CreateIndex
CREATE INDEX "MemoryItem_scope_idx" ON "MemoryItem"("scope");

-- CreateIndex
CREATE INDEX "MemoryItem_category_idx" ON "MemoryItem"("category");

-- CreateIndex
CREATE INDEX "MemoryItem_score_idx" ON "MemoryItem"("score");

-- CreateIndex
CREATE INDEX "MemoryItem_contentHash_idx" ON "MemoryItem"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryItem_projectId_contentHash_key" ON "MemoryItem"("projectId", "contentHash");

-- CreateIndex
CREATE INDEX "MemoryUse_memoryItemId_idx" ON "MemoryUse"("memoryItemId");

-- CreateIndex
CREATE INDEX "MemoryUse_runId_idx" ON "MemoryUse"("runId");

-- CreateIndex
CREATE INDEX "MemoryUse_usedAt_idx" ON "MemoryUse"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MemoryPolicy_projectId_key" ON "MemoryPolicy"("projectId");

-- CreateIndex
CREATE INDEX "MemoryPolicy_projectId_idx" ON "MemoryPolicy"("projectId");

-- CreateIndex
CREATE INDEX "RunMemorySnapshot_runId_idx" ON "RunMemorySnapshot"("runId");

-- CreateIndex
CREATE INDEX "RunMemorySnapshot_snapshotAt_idx" ON "RunMemorySnapshot"("snapshotAt");

-- CreateIndex
CREATE INDEX "RunMemorySnapshotItem_snapshotId_idx" ON "RunMemorySnapshotItem"("snapshotId");

-- CreateIndex
CREATE INDEX "RunMemorySnapshotItem_memoryItemId_idx" ON "RunMemorySnapshotItem"("memoryItemId");

-- CreateIndex
CREATE UNIQUE INDEX "RunMemorySnapshotItem_snapshotId_memoryItemId_key" ON "RunMemorySnapshotItem"("snapshotId", "memoryItemId");

-- AddForeignKey
ALTER TABLE "MemoryItem" ADD CONSTRAINT "MemoryItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryUse" ADD CONSTRAINT "MemoryUse_memoryItemId_fkey" FOREIGN KEY ("memoryItemId") REFERENCES "MemoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryPolicy" ADD CONSTRAINT "MemoryPolicy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunMemorySnapshot" ADD CONSTRAINT "RunMemorySnapshot_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunMemorySnapshotItem" ADD CONSTRAINT "RunMemorySnapshotItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RunMemorySnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunMemorySnapshotItem" ADD CONSTRAINT "RunMemorySnapshotItem_memoryItemId_fkey" FOREIGN KEY ("memoryItemId") REFERENCES "MemoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
