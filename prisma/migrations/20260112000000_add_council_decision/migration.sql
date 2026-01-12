-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('ADOPT', 'ADAPT', 'BUILD');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "CouncilDecision" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "decision" "DecisionType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "candidateName" TEXT,
    "candidateUrl" TEXT,
    "licenseType" TEXT,
    "maintenanceRisk" "RiskLevel" NOT NULL,
    "integrationPlan" TEXT,
    "redTeamCritique" TEXT,
    "sources" JSONB NOT NULL,
    "reasoning" TEXT NOT NULL,
    "overrideOf" TEXT,
    "overrideReason" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CouncilDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CouncilDecision_projectId_idx" ON "CouncilDecision"("projectId");

-- CreateIndex
CREATE INDEX "CouncilDecision_taskId_idx" ON "CouncilDecision"("taskId");

-- AddForeignKey
ALTER TABLE "CouncilDecision" ADD CONSTRAINT "CouncilDecision_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouncilDecision" ADD CONSTRAINT "CouncilDecision_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
