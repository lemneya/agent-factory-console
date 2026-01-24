// ForgeAI - Spec Execution Agent Maximizer
export * from './types';
export { decomposeSpec } from './decomposer';
export {
  FEATURE_INVENTORY,
  matchFeaturesFromSpec,
  getFeatureById,
  getFeaturesForCategory,
  getEstimatedTime,
  getRequiredPackages,
  getRequiredEnvVars,
  type FeatureTemplate,
  type FeatureCategory,
} from './inventory';
export {
  STARTER_TEMPLATES,
  matchStartersFromSpec,
  getBestStarter,
  getStartersByCategory,
  getStarterById,
  calculateTimeSavings,
  type StarterTemplate,
  type StarterCategory,
  type CustomizationPoint,
} from './starters';
export {
  COMPETITORS,
  FORGE_ADVANTAGES,
  TIME_COMPARISON,
  getCompetitiveSummary,
  getTimeSavings,
  type Competitor,
  type CompetitiveAdvantage,
} from './competitive';
export {
  // Memory types
  type ForgeMemory,
  type PatternMemory,
  type UserPreferences,
  type ProjectStructure,
  type ErrorFix,
  type ComponentCombo,
  type BuildOutcome,
  // Memory functions
  createInitialMemory,
  learnFromBuild,
  getSuggestedStack,
  getRelevantFixes,
  getRecommendedCombos,
  getBestStructure,
  getMemoryEnhancements,
  getMemoryStats,
  // Pre-learned data
  DEFAULT_PREFERENCES,
  LEARNED_STRUCTURES,
  LEARNED_ERROR_FIXES,
  LEARNED_COMBOS,
} from './memory';
