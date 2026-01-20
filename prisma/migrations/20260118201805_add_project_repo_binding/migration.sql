-- AlterTable
-- AFC-RUNNER-UX-3: Add repo binding fields to Project
ALTER TABLE "Project" ADD COLUMN "repoOwner" TEXT,
ADD COLUMN "baseBranch" TEXT DEFAULT 'main';
