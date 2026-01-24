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
export {
  // Chat types
  type ChatMessage,
  type ChatIntent,
  type ChatContext,
  type ChatSession,
  type ChatAgentResponse,
  type ChatAction,
  // Chat functions
  detectIntent,
  generateResponse,
  resolveTarget,
  createChatSession,
  processMessage,
  QUICK_ACTIONS,
} from './chat-agent';

// ============================================
// KILLER FEATURES
// ============================================

// Live Preview (Killer Feature #1)
export {
  type PreviewFrame,
  type PreviewSession,
  type PreviewConfig,
  type PreviewProvider,
  type FileChange,
  type PreviewEvent,
  DEFAULT_PREVIEW_CONFIG,
  createPreviewSession,
  getPreviewSession,
  addPreviewFrame,
  destroyPreviewSession,
  detectPreviewRelevantChanges,
  onPreviewEvent,
  emitPreviewEvent,
  getPreviewUrl,
  getPreviewRoutes,
} from './live-preview';

// AI Code Review (Killer Feature #2)
export {
  type CodeIssue,
  type ReviewResult,
  type ReviewSummary,
  type CodeMetrics,
  type AISuggestion,
  type IssueSeverity,
  type IssueCategory,
  type ReviewOptions,
  SECURITY_RULES,
  PERFORMANCE_RULES,
  A11Y_RULES,
  DEFAULT_REVIEW_OPTIONS,
  reviewCode,
  getReviewBadge,
} from './code-review';

// Multi-Platform Deploy (Killer Feature #3)
export {
  type DeployPlatform,
  type DeployStatus,
  type DeployConfig,
  type DeployResult,
  type PlatformInfo,
  type MultiDeployConfig,
  type MultiDeployResult,
  type AppCharacteristics,
  PLATFORMS,
  deployToPlatform,
  deployToMultiplePlatforms,
  recommendPlatforms,
  trackDeployment,
  getDeployments,
  getDeploymentUrls,
} from './multi-deploy';

// Collaborative Building (Killer Feature #4)
export {
  type UserRole,
  type CollaboratorPermissions,
  type Collaborator,
  type CursorPosition,
  type CollaborationSession,
  type CollaborationSettings,
  type ActivityEvent,
  type Comment,
  type CommentAnchor,
  type SyncEvent,
  type CollabNotification,
  ROLE_PERMISSIONS,
  createCollaborationSession,
  getCollaborationSession,
  joinSession,
  leaveSession,
  updateCursor,
  addComment,
  getComments,
  resolveComment,
  generateShareLink,
  getOnlineCollaborators,
  getCollaboratorsByFile,
  onSyncEvent,
  sendNotification,
  getUserNotifications,
  markNotificationRead,
} from './collaboration';

// Version Time Machine (Killer Feature #5)
export {
  type Snapshot,
  type SnapshotTrigger,
  type FileSnapshot,
  type SnapshotMetadata,
  type SnapshotDiff,
  type FileDiff,
  type Timeline,
  type Branch,
  type TimelineStats,
  createTimeline,
  getTimeline,
  createSnapshot,
  getSnapshot,
  getSnapshotById,
  getLatestSnapshot,
  restoreSnapshot,
  compareSnapshots,
  createBranch,
  getBranches,
  mergeBranch,
  searchSnapshots,
  exportTimeline,
  importTimeline,
  getTimelineStats,
} from './time-machine';

// Agent Gym (Killer Feature #6)
export {
  type TestCategory,
  type TestStatus,
  type TestScenario,
  type TestAgent,
  type Assertion,
  type TestResult,
  type TestError,
  type GymSession,
  type GymConfig,
  type ConfidenceScore,
  type CategoryScore,
  type GymReport,
  type CategoryReport,
  type ProductionCertificate,
  DEFAULT_GYM_CONFIG,
  createGymSession,
  getGymSession,
  runGymSession,
  generateGymReport,
  issueProductionCertificate,
  // Test generators
  generateFunctionalTests,
  generateUserJourneyTests,
  generateEdgeCaseTests,
  generatePerformanceTests,
  generateSecurityTests,
  generateAccessibilityTests,
  generateChaosTests,
} from './agent-gym';

// Agent Academy (Killer Feature #7) - Agent Training & Certification
export {
  // Domain types
  type Domain,
  type DomainProfile,
  // Certification types
  type CertificationRequirement,
  type CertificationLevel,
  type AgentCertification,
  type SkillAssessment,
  type CertificationBadge,
  // Training types
  type TrainingCurriculum,
  type TrainingModule,
  type TrainingChallenge,
  type ChallengeScenario,
  type HiddenTest,
  type GradingRubric,
  type TrainingSession,
  type TrainingFeedback,
  // Agent profile types
  type AgentProfile,
  type LearningPath,
  type PerformanceMetrics,
  type AcademyStats,
  // Domain data
  DOMAINS,
  // Academy functions
  enrollAgent,
  getAgentProfile,
  getCurriculum,
  startTrainingSession,
  completeTrainingSession,
  issueCertification,
  getAgentCertifications,
  getCertifiedAgents,
  recommendAgentForBuild,
  getAcademyStats,
  generateAcademyReport,
} from './agent-academy';

// Figma Integration (Killer Feature #8) - Design → Production in One Click
export {
  // Figma API types
  type FigmaFile,
  type FigmaDocument,
  type FigmaNode,
  type FigmaNodeType,
  type FigmaComponent,
  type FigmaStyle,
  type BoundingBox,
  type Paint,
  type RGBAColor,
  type Effect,
  type TextStyle,
  // Design token types
  type DesignTokens,
  type ColorTokens,
  type TypographyTokens,
  type SpacingTokens,
  type BorderRadiusTokens,
  type ShadowTokens,
  // Generated component types
  type GeneratedComponent,
  type ComponentProp,
  type ComponentVariant,
  // Import types
  type FigmaImportConfig,
  type FigmaImportResult,
  type ExtractedAsset,
  type PageStructure,
  type DesignSystemOutput,
  type ImportStats,
  type ImportError,
  type ImportWarning,
  // Sync types
  type FigmaWebhook,
  type SyncStatus,
  // Config
  DEFAULT_IMPORT_CONFIG,
  // Client
  FigmaClient,
  // Core functions
  importFromFigma,
  extractDesignTokens,
  generateComponent,
  extractAssets,
  detectPageStructure,
  generateDesignSystem,
  // Sync functions
  getSyncStatus,
  updateSyncStatus,
  checkForUpdates,
  // Reporting
  generateImportReport,
} from './figma-integration';
