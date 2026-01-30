/**
 * AFC-ROUTER-INVENTORY-OSS-0: Inventory Matching Engine
 *
 * Searches internal AFC inventory (Assets) to find reusable components
 * that can fulfill requested features.
 *
 * INTERNAL USE ONLY - Does not affect client pricing.
 */

import prisma from '@/lib/prisma';

// ============================================================================
// Types
// ============================================================================

export type AppType = 'web' | 'mobile' | 'backend';

export interface EstimateScope {
  appType: AppType;
  features: string[];
  integrations: string[];
  complexity: 'low' | 'medium' | 'high';
  timeline: 'normal' | 'rush';
}

export interface MatchedAsset {
  assetId: string;
  name: string;
  slug: string;
  category: string;
  matchedFeatures: string[];
  coverageContribution: number;
}

export interface InventoryMatchResult {
  matchedAssets: MatchedAsset[];
  coveredFeatures: string[];
  uncoveredFeatures: string[];
  totalCoverage: number;
}

// ============================================================================
// Feature to Category Mapping
// ============================================================================

/**
 * Maps requested features to asset categories for matching.
 * This is a deterministic mapping used for inventory lookup.
 */
const FEATURE_TO_CATEGORY: Record<string, string[]> = {
  auth: ['auth'],
  dashboard: ['ui', 'dashboard'],
  billing: ['billing', 'payments'],
  notifications: ['notifications', 'messaging'],
  search: ['search'],
  analytics: ['analytics'],
  admin: ['admin', 'ui'],
  api: ['api', 'backend'],
  chat: ['chat', 'messaging'],
  upload: ['upload', 'storage'],
  export: ['export', 'reporting'],
  settings: ['settings', 'ui'],
};

/**
 * Maps app types to compatible stack patterns.
 */
const APP_TYPE_STACK_COMPAT: Record<AppType, string[]> = {
  web: ['nextjs', 'react', 'vue', 'angular'],
  mobile: ['react-native', 'flutter', 'expo'],
  backend: ['nodejs', 'express', 'fastapi', 'prisma'],
};

// ============================================================================
// Matching Logic
// ============================================================================

/**
 * Match inventory assets against requested scope.
 *
 * Coverage calculation:
 * - Each requested feature counts equally
 * - An asset contributes coverage if it matches the feature's category
 * - totalCoverage = coveredFeatures.length / totalRequestedFeatures
 */
export async function matchInventory(scope: EstimateScope): Promise<InventoryMatchResult> {
  const { appType, features, integrations } = scope;

  if (features.length === 0) {
    return {
      matchedAssets: [],
      coveredFeatures: [],
      uncoveredFeatures: [],
      totalCoverage: 1.0, // No features requested = fully covered
    };
  }

  // Collect all relevant categories for requested features
  const targetCategories = new Set<string>();
  for (const feature of features) {
    const categories = FEATURE_TO_CATEGORY[feature.toLowerCase()] || [];
    categories.forEach(c => targetCategories.add(c));
  }

  // Also consider integrations as potential categories
  for (const integration of integrations) {
    targetCategories.add(integration.toLowerCase());
  }

  // Query assets matching target categories
  const assets = await prisma.asset.findMany({
    where: {
      category: {
        in: Array.from(targetCategories),
      },
    },
    include: {
      tags: true,
      versions: {
        where: { status: 'ACTIVE' },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Match assets to features
  const matchedAssets: MatchedAsset[] = [];
  const coveredFeatures = new Set<string>();

  for (const asset of assets) {
    const assetTags = asset.tags.map(t => t.tag.toLowerCase());
    const assetCategories = [asset.category.toLowerCase(), ...assetTags];

    // Check stack compatibility if we have a version
    if (asset.versions.length > 0) {
      const stackCompat = asset.versions[0].stackCompat as Record<string, string>;
      const compatibleStacks = APP_TYPE_STACK_COMPAT[appType];
      const hasCompatibleStack = Object.keys(stackCompat).some(stack =>
        compatibleStacks.includes(stack.toLowerCase())
      );

      // Skip if no compatible stack (unless no stack info)
      if (Object.keys(stackCompat).length > 0 && !hasCompatibleStack) {
        continue;
      }
    }

    // Find which features this asset covers
    const matchedFeatures: string[] = [];
    for (const feature of features) {
      const featureLower = feature.toLowerCase();
      const featureCategories = FEATURE_TO_CATEGORY[featureLower] || [featureLower];

      const covers = featureCategories.some(
        cat =>
          assetCategories.includes(cat) ||
          assetTags.includes(featureLower) ||
          asset.name.toLowerCase().includes(featureLower)
      );

      if (covers && !coveredFeatures.has(featureLower)) {
        matchedFeatures.push(feature);
        coveredFeatures.add(featureLower);
      }
    }

    if (matchedFeatures.length > 0) {
      matchedAssets.push({
        assetId: asset.id,
        name: asset.name,
        slug: asset.slug,
        category: asset.category,
        matchedFeatures,
        coverageContribution: matchedFeatures.length / features.length,
      });
    }
  }

  // Calculate uncovered features
  const uncoveredFeatures = features.filter(f => !coveredFeatures.has(f.toLowerCase()));

  // Total coverage = covered / total
  const totalCoverage = features.length > 0 ? coveredFeatures.size / features.length : 1.0;

  return {
    matchedAssets,
    coveredFeatures: Array.from(coveredFeatures),
    uncoveredFeatures,
    totalCoverage,
  };
}
