-- UX-GATE-COPILOT-1: Copilot Draft Mode
-- Add CopilotDraft and CopilotDraftEvent models

-- CreateEnum
CREATE TYPE "CopilotDraftKind" AS ENUM ('BLUEPRINT', 'WORKORDERS', 'COUNCIL');

-- CreateEnum
CREATE TYPE "CopilotDraftStatus" AS ENUM ('DRAFT', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CopilotDraftEventType" AS ENUM ('CREATED', 'UPDATED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CopilotDraft" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "runId" TEXT,
    "kind" "CopilotDraftKind" NOT NULL,
    "status" "CopilotDraftStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "sourcesJson" JSONB,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "resultRef" TEXT,

    CONSTRAINT "CopilotDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopilotDraftEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "draftId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" "CopilotDraftEventType" NOT NULL,
    "detailsJson" JSONB,

    CONSTRAINT "CopilotDraftEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CopilotDraft_projectId_idx" ON "CopilotDraft"("projectId");

-- CreateIndex
CREATE INDEX "CopilotDraft_runId_idx" ON "CopilotDraft"("runId");

-- CreateIndex
CREATE INDEX "CopilotDraft_createdAt_idx" ON "CopilotDraft"("createdAt");

-- CreateIndex
CREATE INDEX "CopilotDraft_status_idx" ON "CopilotDraft"("status");

-- CreateIndex
CREATE INDEX "CopilotDraft_kind_idx" ON "CopilotDraft"("kind");

-- CreateIndex
CREATE INDEX "CopilotDraftEvent_draftId_idx" ON "CopilotDraftEvent"("draftId");

-- CreateIndex
CREATE INDEX "CopilotDraftEvent_createdAt_idx" ON "CopilotDraftEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "CopilotDraftEvent" ADD CONSTRAINT "CopilotDraftEvent_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "CopilotDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;
