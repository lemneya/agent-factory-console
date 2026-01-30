/**
 * AFC-ROUTER-INVENTORY-OSS-0: Build Routing Module
 *
 * Internal routing engine for determining how applications should be built.
 * DOES NOT affect client pricing.
 */

export { matchInventory } from './inventory-matcher';
export type {
  AppType,
  EstimateScope,
  MatchedAsset,
  InventoryMatchResult,
} from './inventory-matcher';

export { sniffOSS, checkLicense } from './oss-sniffer';
export type { OSSCandidate, OSSSniffResult } from './oss-sniffer';

export { routeBuild, generateBuildSummary } from './build-router';
export type { BuildStrategy, BuildRouteResult, BuildPlanDetails } from './build-router';
