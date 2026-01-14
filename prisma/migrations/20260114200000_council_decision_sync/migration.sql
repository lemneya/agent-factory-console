-- CouncilDecision schema sync (additive only)

ALTER TABLE "CouncilDecision"
  ADD COLUMN IF NOT EXISTS "rationale" TEXT;

ALTER TABLE "CouncilDecision"
  ADD COLUMN IF NOT EXISTS "evidenceJson" JSONB;
