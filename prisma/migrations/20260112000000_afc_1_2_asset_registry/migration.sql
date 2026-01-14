-- AFC-1.2: Asset Registry MVP Migration
-- Adds: Asset, AssetVersion, AssetTag, ProjectAsset models
-- Updates: Task with assetVersionId and kind fields

-- Create Asset table
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "defaultLicense" TEXT NOT NULL DEFAULT 'MIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Asset_slug_key" ON "Asset"("slug");

-- Create AssetVersion table
CREATE TABLE "AssetVersion" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "stackCompat" JSONB NOT NULL,
    "source" JSONB NOT NULL,
    "installRecipe" JSONB NOT NULL,
    "interfacesRef" TEXT,
    "boundariesRef" TEXT,
    "proofPack" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AssetVersion_assetId_version_key" ON "AssetVersion"("assetId", "version");

ALTER TABLE "AssetVersion" ADD CONSTRAINT "AssetVersion_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create AssetTag table
CREATE TABLE "AssetTag" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,

    CONSTRAINT "AssetTag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AssetTag_tag_idx" ON "AssetTag"("tag");
CREATE INDEX "AssetTag_assetId_idx" ON "AssetTag"("assetId");

ALTER TABLE "AssetTag" ADD CONSTRAINT "AssetTag_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create ProjectAsset table
CREATE TABLE "ProjectAsset" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "assetVersionId" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectAsset_projectId_assetVersionId_key" ON "ProjectAsset"("projectId", "assetVersionId");

ALTER TABLE "ProjectAsset" ADD CONSTRAINT "ProjectAsset_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProjectAsset" ADD CONSTRAINT "ProjectAsset_assetVersionId_fkey"
    FOREIGN KEY ("assetVersionId") REFERENCES "AssetVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add asset integration fields to Task
ALTER TABLE "Task" ADD COLUMN "assetVersionId" TEXT;
ALTER TABLE "Task" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'BUILD_CUSTOM';

CREATE INDEX "Task_assetVersionId_idx" ON "Task"("assetVersionId");

ALTER TABLE "Task" ADD CONSTRAINT "Task_assetVersionId_fkey"
    FOREIGN KEY ("assetVersionId") REFERENCES "AssetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
