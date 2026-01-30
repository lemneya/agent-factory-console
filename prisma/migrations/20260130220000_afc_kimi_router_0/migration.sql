-- AFC-KIMI-ROUTER-0: Controlled Kimi Execution
-- Creates ExecutionEnvelope and KimiExecutionRun tables
-- NOTE: This does NOT allow autonomous execution

-- CreateTable
CREATE TABLE "ExecutionEnvelope" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "buildPlanId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "maxCostUSD" DOUBLE PRECISION NOT NULL,
    "maxAgents" INTEGER NOT NULL,
    "maxRuntimeSec" INTEGER NOT NULL,
    "allowedScopes" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionEnvelope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KimiExecutionRun" (
    "id" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "tokensUsed" INTEGER,
    "costUSD" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "summary" TEXT,

    CONSTRAINT "KimiExecutionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutionEnvelope_userId_idx" ON "ExecutionEnvelope"("userId");

-- CreateIndex
CREATE INDEX "ExecutionEnvelope_buildPlanId_idx" ON "ExecutionEnvelope"("buildPlanId");

-- CreateIndex
CREATE INDEX "ExecutionEnvelope_status_idx" ON "ExecutionEnvelope"("status");

-- CreateIndex
CREATE INDEX "KimiExecutionRun_envelopeId_idx" ON "KimiExecutionRun"("envelopeId");

-- CreateIndex
CREATE INDEX "KimiExecutionRun_status_idx" ON "KimiExecutionRun"("status");
