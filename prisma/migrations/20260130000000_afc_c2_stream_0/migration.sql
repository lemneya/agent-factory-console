-- AFC-C2-STREAM-0: Command & Control Dashboard
-- Creates C2Session, C2Event, C2Artifact tables with enums

-- CreateEnum
CREATE TYPE "C2SessionStatus" AS ENUM ('IDLE', 'RUNNING', 'PAUSED', 'COMPLETED', 'ABORTED');

-- CreateEnum
CREATE TYPE "C2EventType" AS ENUM ('SESSION_START', 'SESSION_STOP', 'SESSION_ABORT', 'AGENT_STATE', 'PROGRESS', 'LOG', 'ARTIFACT_CREATED', 'PING');

-- CreateEnum
CREATE TYPE "C2AgentState" AS ENUM ('IDLE', 'THINKING', 'WORKING', 'DONE', 'ERROR');

-- CreateEnum
CREATE TYPE "C2ArtifactType" AS ENUM ('CODE', 'DOCUMENT', 'CONFIG', 'LOG', 'REPORT', 'OTHER');

-- CreateTable
CREATE TABLE "C2Session" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "name" TEXT NOT NULL DEFAULT 'Unnamed Session',
    "status" "C2SessionStatus" NOT NULL DEFAULT 'IDLE',
    "agentCount" INTEGER NOT NULL DEFAULT 20,
    "gridRows" INTEGER NOT NULL DEFAULT 4,
    "gridCols" INTEGER NOT NULL DEFAULT 5,
    "startedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),

    CONSTRAINT "C2Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "C2Event" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "type" "C2EventType" NOT NULL,
    "payload" JSONB NOT NULL,
    "agentIndex" INTEGER,
    "agentState" "C2AgentState",
    "progress" DOUBLE PRECISION,
    "level" TEXT,
    "message" TEXT,

    CONSTRAINT "C2Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "C2Artifact" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "C2ArtifactType" NOT NULL,
    "contentJson" JSONB,
    "filePath" TEXT,
    "sizeBytes" INTEGER,

    CONSTRAINT "C2Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "C2Session_userId_idx" ON "C2Session"("userId");

-- CreateIndex
CREATE INDEX "C2Session_status_idx" ON "C2Session"("status");

-- CreateIndex
CREATE INDEX "C2Session_createdAt_idx" ON "C2Session"("createdAt");

-- CreateIndex
CREATE INDEX "C2Event_sessionId_idx" ON "C2Event"("sessionId");

-- CreateIndex
CREATE INDEX "C2Event_type_idx" ON "C2Event"("type");

-- CreateIndex
CREATE INDEX "C2Event_createdAt_idx" ON "C2Event"("createdAt");

-- CreateIndex
CREATE INDEX "C2Artifact_sessionId_idx" ON "C2Artifact"("sessionId");

-- CreateIndex
CREATE INDEX "C2Artifact_type_idx" ON "C2Artifact"("type");

-- CreateIndex
CREATE INDEX "C2Artifact_createdAt_idx" ON "C2Artifact"("createdAt");

-- AddForeignKey
ALTER TABLE "C2Event" ADD CONSTRAINT "C2Event_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "C2Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "C2Artifact" ADD CONSTRAINT "C2Artifact_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "C2Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
