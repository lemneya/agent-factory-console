-- AFC-1: Add Agent model and enhance Task model
-- Migration: afc1_agents_and_enhanced_tasks

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('BACKEND', 'FRONTEND', 'GITHUB_INTEGRATION', 'DEVOPS', 'QA_DOCS', 'ORCHESTRATOR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'DOING', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AgentType" NOT NULL,
    "description" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_userId_name_key" ON "Agent"("userId", "name");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Add description, priority, and agentId to Task
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "priority" TEXT DEFAULT 'MEDIUM';
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "agentId" TEXT;

-- AddForeignKey for Task.agentId
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update Run.status to use enum (if needed, convert existing string values)
-- Note: This assumes the status column already exists as TEXT
-- The actual migration might need adjustment based on the current database state

-- Add cascade delete for Project -> Run
ALTER TABLE "Run" DROP CONSTRAINT IF EXISTS "Run_projectId_fkey";
ALTER TABLE "Run" ADD CONSTRAINT "Run_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add cascade delete for Run -> Task
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_runId_fkey";
ALTER TABLE "Task" ADD CONSTRAINT "Task_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE CASCADE ON UPDATE CASCADE;
