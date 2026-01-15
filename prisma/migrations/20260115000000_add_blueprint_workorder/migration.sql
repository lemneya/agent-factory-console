-- UX-GATE-COPILOT-2: Blueprint & WorkOrder Models

-- Blueprint: Defines a reusable project specification
CREATE TABLE "Blueprint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Blueprint_pkey" PRIMARY KEY ("id")
);

-- BlueprintVersion: Immutable snapshot of a Blueprint specification
CREATE TABLE "BlueprintVersion" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "specHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlueprintVersion_pkey" PRIMARY KEY ("id")
);

-- WorkOrder: Individual unit of work derived from a Blueprint
CREATE TYPE "WorkOrderStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'SKIPPED');

CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "blueprintId" TEXT,
    "blueprintVersionId" TEXT,
    "key" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "spec" TEXT,
    "dependsOn" TEXT[],
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'PENDING',
    "runId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "Blueprint_projectId_idx" ON "Blueprint"("projectId");
CREATE INDEX "Blueprint_name_idx" ON "Blueprint"("name");
CREATE INDEX "BlueprintVersion_blueprintId_idx" ON "BlueprintVersion"("blueprintId");
CREATE INDEX "BlueprintVersion_specHash_idx" ON "BlueprintVersion"("specHash");
CREATE INDEX "WorkOrder_blueprintId_idx" ON "WorkOrder"("blueprintId");
CREATE INDEX "WorkOrder_blueprintVersionId_idx" ON "WorkOrder"("blueprintVersionId");
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX "WorkOrder_runId_idx" ON "WorkOrder"("runId");

-- Foreign Keys
ALTER TABLE "BlueprintVersion" ADD CONSTRAINT "BlueprintVersion_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "Blueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "Blueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_blueprintVersionId_fkey" FOREIGN KEY ("blueprintVersionId") REFERENCES "BlueprintVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
