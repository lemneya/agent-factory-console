-- AFC-1.4: Ralph Mode Runner Migration

-- CreateEnum
CREATE TYPE "IterationStatus" AS ENUM ('RUNNING', 'PASSED', 'FAILED', 'WAITING_FOR_APPROVAL', 'ABORTED');

-- CreateEnum
CREATE TYPE "AbortReason" AS ENUM ('TIME_BUDGET', 'ITERATION_BUDGET', 'FAILURE_BUDGET', 'THRASHING', 'MANUAL_ABORT');

-- AlterTable: Add ralphMode to Run
ALTER TABLE "Run" ADD COLUMN "ralphMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: RunPolicy
CREATE TABLE "RunPolicy" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "maxIterations" INTEGER NOT NULL DEFAULT 25,
    "maxWallClockSeconds" INTEGER NOT NULL DEFAULT 14400,
    "maxFailures" INTEGER NOT NULL DEFAULT 10,
    "maxRepeatedError" INTEGER NOT NULL DEFAULT 3,
    "maxNoProgressIterations" INTEGER NOT NULL DEFAULT 5,
    "requireHumanApprovalAt" JSONB,
    "verificationCommands" JSONB NOT NULL DEFAULT '["npm run lint","npm test","npm run build"]',
    "completionPromise" TEXT NOT NULL DEFAULT '<AFC_DONE/>',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RunIteration
CREATE TABLE "RunIteration" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "iteration" INTEGER NOT NULL,
    "status" "IterationStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "verificationSummary" JSONB,
    "errorFingerprint" TEXT,
    "diffStats" JSONB,
    "checkpointId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunIteration_pkey" PRIMARY KEY ("id")
);

-- CreateTable: RunAbortReason
CREATE TABLE "RunAbortReason" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "reason" "AbortReason" NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RunAbortReason_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RunPolicy_runId_key" ON "RunPolicy"("runId");

-- CreateIndex
CREATE INDEX "RunIteration_runId_idx" ON "RunIteration"("runId");

-- CreateIndex
CREATE INDEX "RunIteration_errorFingerprint_idx" ON "RunIteration"("errorFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "RunIteration_runId_iteration_key" ON "RunIteration"("runId", "iteration");

-- CreateIndex
CREATE UNIQUE INDEX "RunAbortReason_runId_key" ON "RunAbortReason"("runId");

-- AddForeignKey
ALTER TABLE "RunPolicy" ADD CONSTRAINT "RunPolicy_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunIteration" ADD CONSTRAINT "RunIteration_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunIteration" ADD CONSTRAINT "RunIteration_checkpointId_fkey" FOREIGN KEY ("checkpointId") REFERENCES "RunCheckpoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunAbortReason" ADD CONSTRAINT "RunAbortReason_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
