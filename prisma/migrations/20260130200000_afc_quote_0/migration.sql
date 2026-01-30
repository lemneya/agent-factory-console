-- AFC-QUOTE-0: Baseline Estimation Engine
-- Creates RateCard and Estimate tables for cost estimation

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "baseRate" DOUBLE PRECISION NOT NULL,
    "roles" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT,
    "scopeJson" JSONB NOT NULL,
    "effortHours" INTEGER NOT NULL,
    "minCost" DOUBLE PRECISION NOT NULL,
    "maxCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "assumptions" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateCard_name_idx" ON "RateCard"("name");

-- CreateIndex
CREATE INDEX "Estimate_userId_idx" ON "Estimate"("userId");

-- CreateIndex
CREATE INDEX "Estimate_createdAt_idx" ON "Estimate"("createdAt");

-- Seed default rate card
INSERT INTO "RateCard" ("id", "name", "currency", "baseRate", "roles", "createdAt")
VALUES (
    'default-rate-card',
    'US Standard Web Dev',
    'USD',
    90,
    '{"frontend": 1.0, "backend": 1.1, "devops": 1.2, "qa": 0.9}',
    CURRENT_TIMESTAMP
);
