-- AFC-ROUTER-INVENTORY-OSS-0: Internal Build Routing
-- Creates BuildPlan table for routing decisions
-- Depends on: AFC-QUOTE-0 (Estimate table must exist)
-- NOTE: This does NOT affect client pricing

-- CreateTable
CREATE TABLE "BuildPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "estimateId" TEXT,
    "strategy" TEXT NOT NULL,
    "coverage" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BuildPlan_userId_idx" ON "BuildPlan"("userId");

-- CreateIndex
CREATE INDEX "BuildPlan_sessionId_idx" ON "BuildPlan"("sessionId");
