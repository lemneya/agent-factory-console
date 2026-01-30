/**
 * AFC-ROUTER-INVENTORY-OSS-0: Build Routing Decision Engine
 *
 * Determines HOW an application should be built:
 * 1) Inventory App Shells first (internal assets)
 * 2) Open Source adoption second
 * 3) Kimi execution last (for true delta)
 *
 * INTERNAL USE ONLY - Does not affect client pricing.
 */

import { matchInventory, type EstimateScope, type InventoryMatchResult } from './inventory-matcher';
import { sniffOSS, type OSSSniffResult } from './oss-sniffer';

// ============================================================================
// Types
// ============================================================================

export type BuildStrategy = 'INVENTORY' | 'INVENTORY_PLUS_OSS' | 'OSS' | 'CUSTOM';

export interface BuildRouteResult {
  strategy: BuildStrategy;
  coverage: number;
  inventory: InventoryMatchResult;
  oss: OSSSniffResult;
  rationale: string;
  details: BuildPlanDetails;
}

export interface BuildPlanDetails {
  inventoryCoverage: number;
  ossCoverage: number;
  combinedCoverage: number;
  uncoveredFeatures: string[];
  requiresKimi: boolean;
  estimatedReusePercentage: number;
}

// ============================================================================
// Routing Thresholds (Authoritative)
// ============================================================================

const INVENTORY_ONLY_THRESHOLD = 0.7;
const INVENTORY_PLUS_OSS_INVENTORY_MIN = 0.4;
const INVENTORY_PLUS_OSS_OSS_MIN = 0.6;
const OSS_ONLY_THRESHOLD = 0.7;

// ============================================================================
// Routing Logic
// ============================================================================

/**
 * Route a build request to the appropriate strategy.
 *
 * Decision logic (authoritative):
 *
 * IF inventoryCoverage >= 0.7:
 *   strategy = "INVENTORY"
 * ELSE IF inventoryCoverage >= 0.4 AND ossCoverage >= 0.6:
 *   strategy = "INVENTORY_PLUS_OSS"
 * ELSE IF ossCoverage >= 0.7:
 *   strategy = "OSS"
 * ELSE:
 *   strategy = "CUSTOM" (escalate to Kimi later)
 */
export async function routeBuild(scope: EstimateScope): Promise<BuildRouteResult> {
  // Run matchers in parallel
  const [inventory, oss] = await Promise.all([
    matchInventory(scope),
    Promise.resolve(sniffOSS(scope)),
  ]);

  const inventoryCoverage = inventory.totalCoverage;
  const ossCoverage = oss.totalCoverage;

  // Determine strategy based on thresholds
  let strategy: BuildStrategy;
  let rationale: string;

  if (inventoryCoverage >= INVENTORY_ONLY_THRESHOLD) {
    strategy = 'INVENTORY';
    rationale = `Internal inventory provides ${(inventoryCoverage * 100).toFixed(0)}% coverage. No external dependencies needed.`;
  } else if (
    inventoryCoverage >= INVENTORY_PLUS_OSS_INVENTORY_MIN &&
    ossCoverage >= INVENTORY_PLUS_OSS_OSS_MIN
  ) {
    strategy = 'INVENTORY_PLUS_OSS';
    rationale = `Combining inventory (${(inventoryCoverage * 100).toFixed(0)}%) with OSS (${(ossCoverage * 100).toFixed(0)}%) for optimal coverage.`;
  } else if (ossCoverage >= OSS_ONLY_THRESHOLD) {
    strategy = 'OSS';
    rationale = `OSS provides ${(ossCoverage * 100).toFixed(0)}% coverage. Minimal inventory match (${(inventoryCoverage * 100).toFixed(0)}%).`;
  } else {
    strategy = 'CUSTOM';
    rationale = `Low reuse potential (inventory: ${(inventoryCoverage * 100).toFixed(0)}%, OSS: ${(ossCoverage * 100).toFixed(0)}%). Custom build required.`;
  }

  // Calculate combined coverage (non-overlapping)
  // For simplicity, take the max of inventory and OSS, plus partial credit for non-overlapping
  const combinedCoverage = Math.min(
    1.0,
    Math.max(inventoryCoverage, ossCoverage) + Math.min(inventoryCoverage, ossCoverage) * 0.3
  );

  // Determine uncovered features
  const coveredByInventory = new Set(inventory.coveredFeatures);
  const coveredByOSS = new Set(oss.bestMatch?.features.map(f => f.toLowerCase()) || []);
  const allCovered = new Set([...coveredByInventory, ...coveredByOSS]);
  const uncoveredFeatures = scope.features.filter(f => !allCovered.has(f.toLowerCase()));

  // Calculate estimated reuse percentage
  const estimatedReusePercentage = Math.round(
    (strategy === 'CUSTOM' ? combinedCoverage * 0.5 : combinedCoverage) * 100
  );

  const details: BuildPlanDetails = {
    inventoryCoverage,
    ossCoverage,
    combinedCoverage,
    uncoveredFeatures,
    requiresKimi: strategy === 'CUSTOM' || uncoveredFeatures.length > 0,
    estimatedReusePercentage,
  };

  return {
    strategy,
    coverage: combinedCoverage,
    inventory,
    oss,
    rationale,
    details,
  };
}

/**
 * Generate a human-readable summary of the build plan.
 */
export function generateBuildSummary(result: BuildRouteResult): string {
  const { strategy, coverage, inventory, oss, details } = result;

  const lines: string[] = [];

  lines.push(`Strategy: ${strategy}`);
  lines.push(`Overall Coverage: ${(coverage * 100).toFixed(0)}%`);

  if (inventory.matchedAssets.length > 0) {
    lines.push(`Inventory Assets: ${inventory.matchedAssets.map(a => a.name).join(', ')}`);
  }

  if (oss.bestMatch) {
    lines.push(`OSS Candidate: ${oss.bestMatch.name} (${oss.bestMatch.license})`);
  }

  if (details.uncoveredFeatures.length > 0) {
    lines.push(`Custom Build Required For: ${details.uncoveredFeatures.join(', ')}`);
  }

  if (oss.rejectedForLicense.length > 0) {
    lines.push(`License Rejected: ${oss.rejectedForLicense.join(', ')} (GPL/AGPL)`);
  }

  return lines.join('\n');
}

// Re-export types for convenience
export type { EstimateScope, InventoryMatchResult } from './inventory-matcher';
export type { OSSSniffResult, OSSCandidate } from './oss-sniffer';
