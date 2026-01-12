-- CreateEnum
CREATE TYPE "BlueprintStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WorkOrderDomain" AS ENUM ('FRONTEND', 'BACKEND', 'DEVOPS', 'QA', 'ALGO', 'INTEGRATION');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PLANNED', 'READY', 'BLOCKED', 'IN_PROGRESS', 'WAITING_FOR_APPROVAL', 'DONE', 'ABORTED');

-- CreateTable
CREATE TABLE "Blueprint" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "BlueprintStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlueprintVersion" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schemaVersion" TEXT NOT NULL DEFAULT '1.0',
    "specJson" JSONB NOT NULL,
    "specHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlueprintVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "runId" TEXT,
    "blueprintVersionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "domain" "WorkOrderDomain" NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PLANNED',
    "specIds" JSONB NOT NULL,
    "ownedPaths" JSONB NOT NULL,
    "interfaces" JSONB,
    "acceptanceChecks" JSONB NOT NULL,
    "assetsToUse" JSONB NOT NULL,
    "memoryHints" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderDependency" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderTaskLink" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderTaskLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderAuditEvent" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "actor" TEXT,
    "fromStatus" "WorkOrderStatus" NOT NULL,
    "toStatus" "WorkOrderStatus" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkOrderAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Blueprint_projectId_idx" ON "Blueprint"("projectId");

-- CreateIndex
CREATE INDEX "Blueprint_status_idx" ON "Blueprint"("status");

-- CreateIndex
CREATE INDEX "BlueprintVersion_blueprintId_idx" ON "BlueprintVersion"("blueprintId");

-- CreateIndex
CREATE INDEX "BlueprintVersion_specHash_idx" ON "BlueprintVersion"("specHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlueprintVersion_blueprintId_version_key" ON "BlueprintVersion"("blueprintId", "version");

-- CreateIndex
CREATE INDEX "WorkOrder_projectId_idx" ON "WorkOrder"("projectId");

-- CreateIndex
CREATE INDEX "WorkOrder_runId_idx" ON "WorkOrder"("runId");

-- CreateIndex
CREATE INDEX "WorkOrder_blueprintVersionId_idx" ON "WorkOrder"("blueprintVersionId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_domain_idx" ON "WorkOrder"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_blueprintVersionId_key_key" ON "WorkOrder"("blueprintVersionId", "key");

-- CreateIndex
CREATE INDEX "WorkOrderDependency_workOrderId_idx" ON "WorkOrderDependency"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderDependency_dependsOnId_idx" ON "WorkOrderDependency"("dependsOnId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderDependency_workOrderId_dependsOnId_key" ON "WorkOrderDependency"("workOrderId", "dependsOnId");

-- CreateIndex
CREATE INDEX "WorkOrderTaskLink_workOrderId_idx" ON "WorkOrderTaskLink"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderTaskLink_taskId_idx" ON "WorkOrderTaskLink"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderTaskLink_workOrderId_taskId_key" ON "WorkOrderTaskLink"("workOrderId", "taskId");

-- CreateIndex
CREATE INDEX "WorkOrderAuditEvent_workOrderId_idx" ON "WorkOrderAuditEvent"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderAuditEvent_createdAt_idx" ON "WorkOrderAuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "Blueprint" ADD CONSTRAINT "Blueprint_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintVersion" ADD CONSTRAINT "BlueprintVersion_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "Blueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_blueprintVersionId_fkey" FOREIGN KEY ("blueprintVersionId") REFERENCES "BlueprintVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderDependency" ADD CONSTRAINT "WorkOrderDependency_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderDependency" ADD CONSTRAINT "WorkOrderDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderTaskLink" ADD CONSTRAINT "WorkOrderTaskLink_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderTaskLink" ADD CONSTRAINT "WorkOrderTaskLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAuditEvent" ADD CONSTRAINT "WorkOrderAuditEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
