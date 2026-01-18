-- AFC-RUNNER-0: Build-to-PR Execution Engine MVP
-- Migration to add ExecutionRun model for tracking execution state, logs, and PR results

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('PENDING', 'CLONING', 'APPLYING', 'BUILDING', 'TESTING', 'CREATING_PR', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ExecutionRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    -- Target repository info
    "targetRepoOwner" TEXT NOT NULL,
    "targetRepoName" TEXT NOT NULL,
    "targetBranch" TEXT NOT NULL DEFAULT 'main',
    "sourceBranch" TEXT NOT NULL,

    -- Execution state
    "status" "ExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,

    -- WorkOrders being executed
    "workOrderIds" TEXT[],

    -- PR result
    "prNumber" INTEGER,
    "prUrl" TEXT,
    "prTitle" TEXT,
    "prBody" TEXT,

    -- Evidence and logs
    "cloneLog" TEXT,
    "buildLog" TEXT,
    "testLog" TEXT,
    "prCreationLog" TEXT,
    "evidencePath" TEXT,

    -- User/session context
    "userId" TEXT,
    "projectId" TEXT,

    -- Safety gate references
    "councilDecisionId" TEXT,
    "requiresBreakGlass" BOOLEAN NOT NULL DEFAULT false,
    "breakGlassApprovedAt" TIMESTAMP(3),
    "breakGlassApprovedBy" TEXT,

    CONSTRAINT "ExecutionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executionRunId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "detailsJson" JSONB,

    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutionRun_status_idx" ON "ExecutionRun"("status");
CREATE INDEX "ExecutionRun_userId_idx" ON "ExecutionRun"("userId");
CREATE INDEX "ExecutionRun_projectId_idx" ON "ExecutionRun"("projectId");
CREATE INDEX "ExecutionRun_createdAt_idx" ON "ExecutionRun"("createdAt");

-- CreateIndex
CREATE INDEX "ExecutionLog_executionRunId_idx" ON "ExecutionLog"("executionRunId");
CREATE INDEX "ExecutionLog_phase_idx" ON "ExecutionLog"("phase");
CREATE INDEX "ExecutionLog_createdAt_idx" ON "ExecutionLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_executionRunId_fkey" FOREIGN KEY ("executionRunId") REFERENCES "ExecutionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
