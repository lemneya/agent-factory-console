-- Add Worker model for Agent B implementation
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'AGENT',
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "capabilities" TEXT[],
    "metadata" JSONB,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- Add WorkerLog table for activity tracking
CREATE TABLE "WorkerLog" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "taskId" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkerLog_pkey" PRIMARY KEY ("id")
);

-- Enhance Task table with worker support and additional fields
ALTER TABLE "Task" ADD COLUMN "description" TEXT;
ALTER TABLE "Task" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Task" ADD COLUMN "workerId" TEXT;
ALTER TABLE "Task" ADD COLUMN "result" JSONB;
ALTER TABLE "Task" ADD COLUMN "errorMsg" TEXT;
ALTER TABLE "Task" ADD COLUMN "startedAt" TIMESTAMP(3);
ALTER TABLE "Task" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Add unique constraint for Worker's current task
CREATE UNIQUE INDEX "Worker_currentTaskId_key" ON "Worker"("currentTaskId");

-- Add indexes for WorkerLog
CREATE INDEX "WorkerLog_workerId_idx" ON "WorkerLog"("workerId");
CREATE INDEX "WorkerLog_taskId_idx" ON "WorkerLog"("taskId");

-- Add foreign key from Task to Worker
ALTER TABLE "Task" ADD CONSTRAINT "Task_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
