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
