-- AFC-1.1: Worker Contract v0.2 Migration
-- Adds: RunCheckpoint, queue lease fields, nested logs

-- Add threadId to Run
ALTER TABLE "Run" ADD COLUMN "threadId" TEXT;
UPDATE "Run" SET "threadId" = "id" WHERE "threadId" IS NULL;
ALTER TABLE "Run" ALTER COLUMN "threadId" SET NOT NULL;
ALTER TABLE "Run" ALTER COLUMN "threadId" SET DEFAULT '';
CREATE INDEX "Run_threadId_idx" ON "Run"("threadId");

-- Create RunCheckpoint table
CREATE TABLE "RunCheckpoint" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "graphVersion" TEXT NOT NULL,
    "graphHash" TEXT,
    "checkpointId" TEXT NOT NULL,
    "nextNode" TEXT,
    "status" TEXT NOT NULL,
    "stateJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunCheckpoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RunCheckpoint_runId_idx" ON "RunCheckpoint"("runId");
CREATE INDEX "RunCheckpoint_threadId_idx" ON "RunCheckpoint"("threadId");

ALTER TABLE "RunCheckpoint" ADD CONSTRAINT "RunCheckpoint_runId_fkey" 
    FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add queue lease fields to Task
ALTER TABLE "Task" ADD COLUMN "claimedBy" TEXT;
ALTER TABLE "Task" ADD COLUMN "claimedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_leaseExpiresAt_idx" ON "Task"("leaseExpiresAt");

-- Add parentId to WorkerLog for nested logs
ALTER TABLE "WorkerLog" ADD COLUMN "parentId" TEXT;
CREATE INDEX "WorkerLog_parentId_idx" ON "WorkerLog"("parentId");

ALTER TABLE "WorkerLog" ADD CONSTRAINT "WorkerLog_parentId_fkey" 
    FOREIGN KEY ("parentId") REFERENCES "WorkerLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
