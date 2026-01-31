-- AFC-COPILOT-UX-1: Add Human-in-the-Loop fields to Task model
-- hitlJson stores questions, patches, and decisions requiring human input
-- blockedReason stores the reason a task is blocked (HITL prompt)

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "hitlJson" JSONB;
ALTER TABLE "Task" ADD COLUMN "blockedReason" TEXT;
