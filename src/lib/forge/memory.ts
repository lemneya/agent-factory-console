/**
 * Forge Memory System
 *
 * The brain of Forge - learns from every build to become increasingly useful.
 * Over time, Forge remembers:
 * - Successful patterns
 * - User preferences
 * - Project structures
 * - Error fixes
 * - Component combinations that work well together
 *
 * This is the key differentiator that no competitor has.
 */

import type { AgentRole, TechStack, Workstream } from './types';

// ============================================
// MEMORY TYPES
// ============================================

export interface ForgeMemory {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // Different memory categories
  patterns: PatternMemory[];
  preferences: UserPreferences;
  projectStructures: ProjectStructure[];
  errorFixes: ErrorFix[];
  componentCombos: ComponentCombo[];
  successMetrics: SuccessMetrics;
}

export interface PatternMemory {
  id: string;
  name: string;
  category: 'architecture' | 'component' | 'api' | 'data' | 'integration';
  description: string;
  spec: string; // The spec that created this pattern
  files: FilePattern[];
  frequency: number; // How often this pattern is used
  successRate: number; // 0-1, how often builds using this succeed
  lastUsed: Date;
  tags: string[];
}

export interface FilePattern {
  path: string;
  template: string;
  dependencies: string[];
}

export interface UserPreferences {
  // Tech stack preferences (learned from past choices)
  preferredStack: Partial<TechStack>;
  // Coding style
  namingConvention: 'camelCase' | 'snake_case' | 'kebab-case' | 'PascalCase';
  componentStyle: 'functional' | 'class';
  stateManagement: 'hooks' | 'redux' | 'zustand' | 'jotai' | 'context';
  // File organization
  folderStructure: 'feature-based' | 'type-based' | 'hybrid';
  // Comment preferences
  commentStyle: 'minimal' | 'moderate' | 'extensive';
  includeJSDoc: boolean;
  // Testing preferences
  testingFramework: 'jest' | 'vitest' | 'playwright' | 'cypress';
  testCoverage: 'minimal' | 'moderate' | 'comprehensive';
  // Error handling
  errorHandlingStyle: 'try-catch' | 'result-type' | 'error-boundary';
}

export interface ProjectStructure {
  id: string;
  name: string;
  description: string;
  appType: string; // 'saas', 'ecommerce', 'dashboard', etc.
  directories: DirectoryNode[];
  keyFiles: KeyFile[];
  timesUsed: number;
  avgBuildTime: number;
  successRate: number;
}

export interface DirectoryNode {
  path: string;
  purpose: string;
  children?: DirectoryNode[];
}

export interface KeyFile {
  path: string;
  purpose: string;
  template?: string;
  required: boolean;
}

export interface ErrorFix {
  id: string;
  errorType: string;
  errorMessage: string;
  context: string; // Where the error occurred
  fix: string; // How it was fixed
  preventionTip: string; // How to avoid it next time
  occurrences: number;
  lastSeen: Date;
}

export interface ComponentCombo {
  id: string;
  components: string[]; // Component IDs that work well together
  description: string;
  useCase: string;
  successRate: number;
  timesUsed: number;
}

export interface SuccessMetrics {
  totalBuilds: number;
  successfulBuilds: number;
  avgBuildTime: number;
  avgCustomizationTime: number;
  mostUsedStarters: { id: string; name: string; count: number }[];
  mostUsedFeatures: { id: string; name: string; count: number }[];
  timesSaved: number; // Total minutes saved vs from-scratch
}

// ============================================
// BUILD LEARNING
// ============================================

export interface BuildOutcome {
  buildId: string;
  spec: string;
  techStack: Partial<TechStack>;
  strategy: 'clone-and-customize' | 'with-inventory' | 'from-scratch';
  starterId?: string;
  featuresUsed: string[];
  workstreams: Workstream[];
  success: boolean;
  buildTimeMinutes: number;
  errors: BuildError[];
  userFeedback?: 'positive' | 'neutral' | 'negative';
  filesCreated: string[];
  filesModified: string[];
}

export interface BuildError {
  workstreamId: string;
  agent: AgentRole;
  errorType: string;
  errorMessage: string;
  fixed: boolean;
  fixApplied?: string;
}

// ============================================
// MEMORY OPERATIONS
// ============================================

/**
 * Default user preferences (used as starting point)
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredStack: {
    frontend: 'nextjs',
    backend: 'nextjs-api',
    database: 'postgres',
    auth: 'nextauth',
    styling: 'tailwind',
    deployment: 'vercel',
  },
  namingConvention: 'camelCase',
  componentStyle: 'functional',
  stateManagement: 'hooks',
  folderStructure: 'feature-based',
  commentStyle: 'moderate',
  includeJSDoc: true,
  testingFramework: 'vitest',
  testCoverage: 'moderate',
  errorHandlingStyle: 'try-catch',
};

/**
 * Common project structures learned from successful builds
 */
export const LEARNED_STRUCTURES: ProjectStructure[] = [
  {
    id: 'nextjs-app-router',
    name: 'Next.js App Router',
    description: 'Modern Next.js 14+ with App Router structure',
    appType: 'general',
    directories: [
      {
        path: 'src/app',
        purpose: 'App router pages and layouts',
        children: [
          { path: 'src/app/(auth)', purpose: 'Auth-related pages' },
          { path: 'src/app/(dashboard)', purpose: 'Protected dashboard pages' },
          { path: 'src/app/(marketing)', purpose: 'Public marketing pages' },
          { path: 'src/app/api', purpose: 'API routes' },
        ],
      },
      { path: 'src/components', purpose: 'Reusable React components' },
      { path: 'src/lib', purpose: 'Utility functions and shared logic' },
      { path: 'src/hooks', purpose: 'Custom React hooks' },
      { path: 'src/config', purpose: 'App configuration' },
      { path: 'prisma', purpose: 'Database schema and migrations' },
    ],
    keyFiles: [
      { path: 'src/app/layout.tsx', purpose: 'Root layout with providers', required: true },
      { path: 'src/lib/prisma.ts', purpose: 'Prisma client singleton', required: true },
      { path: 'src/lib/auth.ts', purpose: 'Auth configuration', required: false },
      { path: 'prisma/schema.prisma', purpose: 'Database schema', required: true },
    ],
    timesUsed: 0,
    avgBuildTime: 45,
    successRate: 0.95,
  },
  {
    id: 'saas-multi-tenant',
    name: 'SaaS Multi-Tenant',
    description: 'SaaS app with team/org multi-tenancy',
    appType: 'saas',
    directories: [
      { path: 'src/app/(app)', purpose: 'Authenticated app routes' },
      { path: 'src/app/(marketing)', purpose: 'Public pages' },
      { path: 'src/app/api/stripe', purpose: 'Stripe webhooks and checkout' },
      { path: 'src/lib/billing', purpose: 'Billing and subscription logic' },
      { path: 'src/lib/teams', purpose: 'Team management logic' },
    ],
    keyFiles: [
      { path: 'src/lib/billing/stripe.ts', purpose: 'Stripe client', required: true },
      { path: 'src/lib/teams/permissions.ts', purpose: 'RBAC logic', required: true },
      { path: 'src/middleware.ts', purpose: 'Auth + tenant middleware', required: true },
    ],
    timesUsed: 0,
    avgBuildTime: 60,
    successRate: 0.92,
  },
];

/**
 * Common errors and their fixes (learned from past builds)
 */
export const LEARNED_ERROR_FIXES: ErrorFix[] = [
  {
    id: 'prisma-client-edge',
    errorType: 'PrismaClientInitializationError',
    errorMessage: 'PrismaClient is unable to run in Edge Runtime',
    context: 'API routes or middleware using Prisma',
    fix: 'Use @prisma/adapter-neon with edge-compatible driver, or move to Node.js runtime',
    preventionTip: 'Add "export const runtime = \'nodejs\'" to API routes using Prisma',
    occurrences: 0,
    lastSeen: new Date(),
  },
  {
    id: 'nextauth-session-undefined',
    errorType: 'TypeError',
    errorMessage: 'Cannot read properties of undefined (reading \'user\')',
    context: 'Accessing session.user in server components',
    fix: 'Use auth() instead of getServerSession(), wrap in try-catch',
    preventionTip: 'Always check if session exists before accessing user: const session = await auth(); if (!session?.user) return redirect("/login");',
    occurrences: 0,
    lastSeen: new Date(),
  },
  {
    id: 'hydration-mismatch',
    errorType: 'HydrationError',
    errorMessage: 'Hydration failed because the initial UI does not match',
    context: 'Client components with dynamic content',
    fix: 'Use useEffect for client-only content, or add suppressHydrationWarning',
    preventionTip: 'Avoid using Date.now(), Math.random(), or localStorage in initial render. Use useMounted() hook pattern.',
    occurrences: 0,
    lastSeen: new Date(),
  },
  {
    id: 'use-client-missing',
    errorType: 'Error',
    errorMessage: 'useState/useEffect can only be used in Client Components',
    context: 'Using hooks in server components',
    fix: 'Add "use client" directive at top of file',
    preventionTip: 'Any component using useState, useEffect, or event handlers needs "use client"',
    occurrences: 0,
    lastSeen: new Date(),
  },
  {
    id: 'stripe-webhook-verification',
    errorType: 'StripeSignatureVerificationError',
    errorMessage: 'Webhook signature verification failed',
    context: 'Stripe webhook handler',
    fix: 'Use raw body instead of parsed JSON: const rawBody = await request.text()',
    preventionTip: 'Never parse the webhook body before verification. Use the raw text body with stripe.webhooks.constructEvent()',
    occurrences: 0,
    lastSeen: new Date(),
  },
  {
    id: 'tailwind-class-conflict',
    errorType: 'StyleConflict',
    errorMessage: 'Conflicting Tailwind classes',
    context: 'Component styling with merged classes',
    fix: 'Use tailwind-merge or clsx to properly merge classes',
    preventionTip: 'Always use cn() helper (combining clsx + tailwind-merge) for conditional classes',
    occurrences: 0,
    lastSeen: new Date(),
  },
];

/**
 * Component combinations that work well together
 */
export const LEARNED_COMBOS: ComponentCombo[] = [
  {
    id: 'auth-flow',
    components: ['auth-nextauth-github', 'auth-protected-route', 'users-model'],
    description: 'Complete authentication flow',
    useCase: 'Any app requiring user authentication',
    successRate: 0.98,
    timesUsed: 0,
  },
  {
    id: 'saas-billing',
    components: ['payments-stripe-checkout', 'payments-stripe-subscription', 'payments-stripe-webhook'],
    description: 'Complete Stripe billing system',
    useCase: 'SaaS apps with subscriptions',
    successRate: 0.95,
    timesUsed: 0,
  },
  {
    id: 'data-grid',
    components: ['table-data-table', 'search-basic', 'api-pagination'],
    description: 'Searchable, paginated data table',
    useCase: 'Any list view with large datasets',
    successRate: 0.97,
    timesUsed: 0,
  },
  {
    id: 'form-modal',
    components: ['form-validation-hook', 'form-modal-template', 'notifications-toast'],
    description: 'Modal form with validation and feedback',
    useCase: 'CRUD operations, settings, profile editing',
    successRate: 0.96,
    timesUsed: 0,
  },
  {
    id: 'realtime-dashboard',
    components: ['realtime-sse-hook', 'dashboard-stats-cards', 'dashboard-charts'],
    description: 'Live-updating analytics dashboard',
    useCase: 'Monitoring, analytics, admin panels',
    successRate: 0.94,
    timesUsed: 0,
  },
];

// ============================================
// MEMORY FUNCTIONS
// ============================================

/**
 * Learn from a completed build
 */
export function learnFromBuild(outcome: BuildOutcome, memory: ForgeMemory): ForgeMemory {
  const updated = { ...memory, updatedAt: new Date() };

  // Update success metrics
  updated.successMetrics.totalBuilds++;
  if (outcome.success) {
    updated.successMetrics.successfulBuilds++;
  }
  updated.successMetrics.avgBuildTime =
    (updated.successMetrics.avgBuildTime * (updated.successMetrics.totalBuilds - 1) + outcome.buildTimeMinutes)
    / updated.successMetrics.totalBuilds;

  // Learn from errors
  for (const error of outcome.errors) {
    const existingFix = updated.errorFixes.find(
      f => f.errorType === error.errorType
    );
    if (existingFix) {
      existingFix.occurrences++;
      existingFix.lastSeen = new Date();
      if (error.fixed && error.fixApplied) {
        existingFix.fix = error.fixApplied;
      }
    } else if (error.fixed && error.fixApplied) {
      // New error fix learned
      updated.errorFixes.push({
        id: `error-${Date.now()}`,
        errorType: error.errorType,
        errorMessage: error.errorMessage,
        context: `Workstream: ${error.workstreamId}, Agent: ${error.agent}`,
        fix: error.fixApplied,
        preventionTip: '',
        occurrences: 1,
        lastSeen: new Date(),
      });
    }
  }

  // Update feature usage stats
  for (const featureId of outcome.featuresUsed) {
    const existing = updated.successMetrics.mostUsedFeatures.find(f => f.id === featureId);
    if (existing) {
      existing.count++;
    } else {
      updated.successMetrics.mostUsedFeatures.push({ id: featureId, name: featureId, count: 1 });
    }
  }

  // Update starter usage stats
  if (outcome.starterId) {
    const existing = updated.successMetrics.mostUsedStarters.find(s => s.id === outcome.starterId);
    if (existing) {
      existing.count++;
    } else {
      updated.successMetrics.mostUsedStarters.push({
        id: outcome.starterId,
        name: outcome.starterId,
        count: 1
      });
    }
  }

  // Calculate time saved
  const baselineMinutes = 480; // 8 hours from scratch
  const timeSaved = baselineMinutes - outcome.buildTimeMinutes;
  if (timeSaved > 0) {
    updated.successMetrics.timesSaved += timeSaved;
  }

  return updated;
}

/**
 * Get suggested tech stack based on memory
 */
export function getSuggestedStack(
  memory: ForgeMemory,
  appType: string
): Partial<TechStack> {
  // Start with user preferences
  const suggested = { ...memory.preferences.preferredStack };

  // Adjust based on app type
  if (appType.includes('ai') || appType.includes('chat')) {
    suggested.database = 'supabase'; // Better for real-time
  }
  if (appType.includes('ecommerce')) {
    suggested.database = 'postgres'; // Transactions important
  }

  return suggested;
}

/**
 * Get relevant error fixes for current build
 */
export function getRelevantFixes(
  memory: ForgeMemory,
  workstreams: Workstream[]
): ErrorFix[] {
  const relevant: ErrorFix[] = [];

  for (const ws of workstreams) {
    // Find fixes related to this agent's work
    const agentFixes = memory.errorFixes.filter(f => {
      if (ws.agent === 'auth' && f.context.includes('auth')) return true;
      if (ws.agent === 'api' && f.context.includes('API')) return true;
      if (ws.agent === 'data' && f.context.includes('Prisma')) return true;
      if (ws.agent === 'integrations' && f.context.includes('Stripe')) return true;
      if (ws.agent === 'ui' && f.context.includes('component')) return true;
      return false;
    });
    relevant.push(...agentFixes);
  }

  // Deduplicate and sort by occurrences
  const unique = [...new Map(relevant.map(f => [f.id, f])).values()];
  return unique.sort((a, b) => b.occurrences - a.occurrences);
}

/**
 * Get recommended component combinations
 */
export function getRecommendedCombos(
  memory: ForgeMemory,
  featureIds: string[]
): ComponentCombo[] {
  return memory.componentCombos
    .filter(combo =>
      combo.components.some(c => featureIds.includes(c))
    )
    .sort((a, b) => b.successRate - a.successRate);
}

/**
 * Get best project structure for app type
 */
export function getBestStructure(
  memory: ForgeMemory,
  appType: string
): ProjectStructure | undefined {
  return memory.projectStructures
    .filter(s => s.appType === appType || s.appType === 'general')
    .sort((a, b) => b.successRate - a.successRate)[0];
}

/**
 * Create initial memory for a new user
 */
export function createInitialMemory(userId: string): ForgeMemory {
  return {
    id: `memory-${userId}`,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    patterns: [],
    preferences: DEFAULT_PREFERENCES,
    projectStructures: [...LEARNED_STRUCTURES],
    errorFixes: [...LEARNED_ERROR_FIXES],
    componentCombos: [...LEARNED_COMBOS],
    successMetrics: {
      totalBuilds: 0,
      successfulBuilds: 0,
      avgBuildTime: 0,
      avgCustomizationTime: 0,
      mostUsedStarters: [],
      mostUsedFeatures: [],
      timesSaved: 0,
    },
  };
}

/**
 * Generate memory-enhanced prompt additions for a workstream
 */
export function getMemoryEnhancements(
  memory: ForgeMemory,
  workstream: Workstream
): string {
  let enhancements = '\n\n## Learned Best Practices\n';

  // Add relevant error prevention tips
  const fixes = getRelevantFixes(memory, [workstream]);
  if (fixes.length > 0) {
    enhancements += '\n### Common Pitfalls to Avoid:\n';
    fixes.slice(0, 3).forEach(fix => {
      enhancements += `- **${fix.errorType}**: ${fix.preventionTip}\n`;
    });
  }

  // Add user preferences
  enhancements += '\n### User Preferences:\n';
  enhancements += `- Naming: ${memory.preferences.namingConvention}\n`;
  enhancements += `- Comments: ${memory.preferences.commentStyle}\n`;
  enhancements += `- Error handling: ${memory.preferences.errorHandlingStyle}\n`;

  return enhancements;
}

/**
 * Get memory stats for display
 */
export function getMemoryStats(memory: ForgeMemory): {
  totalBuilds: number;
  successRate: number;
  avgBuildTime: number;
  totalTimeSaved: string;
  topFeatures: { name: string; count: number }[];
  topStarters: { name: string; count: number }[];
  errorsLearned: number;
} {
  const successRate = memory.successMetrics.totalBuilds > 0
    ? memory.successMetrics.successfulBuilds / memory.successMetrics.totalBuilds
    : 0;

  const hoursSaved = Math.round(memory.successMetrics.timesSaved / 60);

  return {
    totalBuilds: memory.successMetrics.totalBuilds,
    successRate: Math.round(successRate * 100),
    avgBuildTime: Math.round(memory.successMetrics.avgBuildTime),
    totalTimeSaved: `${hoursSaved} hours`,
    topFeatures: memory.successMetrics.mostUsedFeatures
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topStarters: memory.successMetrics.mostUsedStarters
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    errorsLearned: memory.errorFixes.length,
  };
}
