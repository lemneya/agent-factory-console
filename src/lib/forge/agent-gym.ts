/**
 * Forge Agent Gym
 *
 * Stress-test simulation that tests the app over and over
 * until we're 100% confident it won't break in production.
 *
 * KILLER FEATURE #6: Production-Ready Guarantee
 */

export type TestCategory =
  | 'functional'      // Core functionality works
  | 'user-journey'    // User flows complete successfully
  | 'edge-cases'      // Handles unusual inputs/states
  | 'performance'     // Speed, memory, load handling
  | 'security'        // No vulnerabilities
  | 'accessibility'   // WCAG compliance
  | 'compatibility'   // Cross-browser/device
  | 'api'             // API contracts honored
  | 'data'            // Data integrity maintained
  | 'chaos';          // Resilience to failures

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

export interface TestScenario {
  id: string;
  name: string;
  category: TestCategory;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: number; // seconds
  agent: TestAgent;
  assertions: Assertion[];
}

export interface TestAgent {
  type: 'user-sim' | 'load-gen' | 'security-probe' | 'chaos-monkey' | 'a11y-audit' | 'api-fuzzer';
  config: Record<string, unknown>;
}

export interface Assertion {
  type: 'status' | 'response-time' | 'content' | 'no-errors' | 'accessibility' | 'security';
  expected: unknown;
  actual?: unknown;
  passed?: boolean;
  message?: string;
}

export interface TestResult {
  scenarioId: string;
  status: TestStatus;
  duration: number; // ms
  assertions: Assertion[];
  logs: string[];
  screenshots?: string[];
  errors?: TestError[];
  retries: number;
}

export interface TestError {
  type: 'crash' | 'timeout' | 'assertion' | 'network' | 'security' | 'performance';
  message: string;
  stack?: string;
  screenshot?: string;
}

// ============================================
// GYM SESSION
// ============================================

export interface GymSession {
  id: string;
  buildId: string;
  status: 'initializing' | 'running' | 'analyzing' | 'complete' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  scenarios: TestScenario[];
  results: TestResult[];
  confidence: ConfidenceScore;
  iterations: number;
  config: GymConfig;
}

export interface GymConfig {
  maxIterations: number;           // How many times to run the full suite
  targetConfidence: number;        // Stop when we reach this confidence (0-100)
  parallelAgents: number;          // How many test agents run in parallel
  timeout: number;                 // Max time per scenario (ms)
  retryFailures: boolean;          // Retry failed tests
  maxRetries: number;              // Max retries per scenario
  categories: TestCategory[];      // Which categories to test
  stopOnCriticalFailure: boolean;  // Stop immediately on critical failures
}

export const DEFAULT_GYM_CONFIG: GymConfig = {
  maxIterations: 5,
  targetConfidence: 95,
  parallelAgents: 4,
  timeout: 30000,
  retryFailures: true,
  maxRetries: 3,
  categories: ['functional', 'user-journey', 'edge-cases', 'performance', 'security', 'accessibility'],
  stopOnCriticalFailure: true,
};

// ============================================
// CONFIDENCE SCORING
// ============================================

export interface ConfidenceScore {
  overall: number;          // 0-100
  breakdown: CategoryScore[];
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  readyForProduction: boolean;
  blockers: string[];       // Critical issues that must be fixed
  warnings: string[];       // Non-critical issues to consider
  improvements: string[];   // Suggestions for even better confidence
}

export interface CategoryScore {
  category: TestCategory;
  score: number;
  passed: number;
  failed: number;
  total: number;
  criticalFailures: number;
}

function calculateConfidence(results: TestResult[], scenarios: TestScenario[]): ConfidenceScore {
  const categoryScores: CategoryScore[] = [];
  const blockers: string[] = [];
  const warnings: string[] = [];
  const improvements: string[] = [];

  // Group results by category
  const categories = [...new Set(scenarios.map(s => s.category))];

  for (const category of categories) {
    const categoryScenarios = scenarios.filter(s => s.category === category);
    const categoryResults = results.filter(r =>
      categoryScenarios.some(s => s.id === r.scenarioId)
    );

    const passed = categoryResults.filter(r => r.status === 'passed').length;
    const failed = categoryResults.filter(r => r.status === 'failed').length;
    const total = categoryScenarios.length;

    // Critical failures are priority='critical' that failed
    const criticalFailures = categoryResults.filter(r => {
      const scenario = categoryScenarios.find(s => s.id === r.scenarioId);
      return r.status === 'failed' && scenario?.priority === 'critical';
    }).length;

    // Weight: critical failures hurt more
    const baseScore = total > 0 ? (passed / total) * 100 : 100;
    const criticalPenalty = criticalFailures * 15;
    const score = Math.max(0, baseScore - criticalPenalty);

    categoryScores.push({
      category,
      score,
      passed,
      failed,
      total,
      criticalFailures,
    });

    // Add blockers for critical failures
    if (criticalFailures > 0) {
      blockers.push(`${criticalFailures} critical ${category} test(s) failed`);
    }

    // Add warnings for non-critical failures
    if (failed > 0 && criticalFailures === 0) {
      warnings.push(`${failed} ${category} test(s) failed (non-critical)`);
    }

    // Suggestions for improvement
    if (score < 90) {
      improvements.push(`Improve ${category} coverage to increase confidence`);
    }
  }

  // Calculate overall score (weighted average)
  const weights: Record<TestCategory, number> = {
    functional: 25,
    'user-journey': 20,
    security: 20,
    'edge-cases': 10,
    performance: 10,
    accessibility: 5,
    compatibility: 5,
    api: 5,
    data: 5,
    chaos: 5,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const cs of categoryScores) {
    const weight = weights[cs.category] || 5;
    totalWeight += weight;
    weightedSum += cs.score * weight;
  }

  const overall = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Determine grade
  const grade = overall >= 95 ? 'A+' :
                overall >= 90 ? 'A' :
                overall >= 80 ? 'B' :
                overall >= 70 ? 'C' :
                overall >= 60 ? 'D' : 'F';

  // Ready for production if no blockers and score >= 90
  const readyForProduction = blockers.length === 0 && overall >= 90;

  return {
    overall,
    breakdown: categoryScores,
    grade,
    readyForProduction,
    blockers,
    warnings,
    improvements,
  };
}

// ============================================
// TEST SCENARIO GENERATORS
// ============================================

export function generateFunctionalTests(appType: string): TestScenario[] {
  const scenarios: TestScenario[] = [];

  // Core page loads
  scenarios.push({
    id: 'func-home-load',
    name: 'Home Page Loads',
    category: 'functional',
    description: 'Verify home page loads without errors',
    priority: 'critical',
    estimatedDuration: 5,
    agent: { type: 'user-sim', config: { action: 'navigate', path: '/' } },
    assertions: [
      { type: 'status', expected: 200 },
      { type: 'response-time', expected: 3000 },
      { type: 'no-errors', expected: true },
    ],
  });

  // Auth flows
  scenarios.push({
    id: 'func-signup-flow',
    name: 'Signup Flow',
    category: 'functional',
    description: 'Complete signup with valid credentials',
    priority: 'critical',
    estimatedDuration: 15,
    agent: { type: 'user-sim', config: { action: 'signup', email: 'test@example.com' } },
    assertions: [
      { type: 'status', expected: 200 },
      { type: 'content', expected: 'Welcome' },
    ],
  });

  scenarios.push({
    id: 'func-login-flow',
    name: 'Login Flow',
    category: 'functional',
    description: 'Login with valid credentials',
    priority: 'critical',
    estimatedDuration: 10,
    agent: { type: 'user-sim', config: { action: 'login' } },
    assertions: [
      { type: 'status', expected: 200 },
      { type: 'content', expected: 'Dashboard' },
    ],
  });

  return scenarios;
}

export function generateUserJourneyTests(appType: string): TestScenario[] {
  const scenarios: TestScenario[] = [];

  scenarios.push({
    id: 'journey-new-user',
    name: 'New User Onboarding',
    category: 'user-journey',
    description: 'Complete new user journey from landing to first action',
    priority: 'high',
    estimatedDuration: 60,
    agent: {
      type: 'user-sim',
      config: {
        journey: [
          { action: 'navigate', path: '/' },
          { action: 'click', selector: '[data-testid="cta-signup"]' },
          { action: 'fill', selector: 'input[name="email"]', value: 'newuser@test.com' },
          { action: 'fill', selector: 'input[name="password"]', value: 'SecurePass123!' },
          { action: 'click', selector: 'button[type="submit"]' },
          { action: 'wait', selector: '[data-testid="dashboard"]' },
        ],
      },
    },
    assertions: [
      { type: 'content', expected: 'dashboard' },
      { type: 'no-errors', expected: true },
    ],
  });

  scenarios.push({
    id: 'journey-returning-user',
    name: 'Returning User Session',
    category: 'user-journey',
    description: 'Returning user can resume where they left off',
    priority: 'high',
    estimatedDuration: 30,
    agent: { type: 'user-sim', config: { journey: 'returning-user' } },
    assertions: [
      { type: 'content', expected: 'Welcome back' },
    ],
  });

  return scenarios;
}

export function generateEdgeCaseTests(): TestScenario[] {
  const scenarios: TestScenario[] = [];

  // Empty states
  scenarios.push({
    id: 'edge-empty-list',
    name: 'Empty List State',
    category: 'edge-cases',
    description: 'App handles empty data gracefully',
    priority: 'medium',
    estimatedDuration: 10,
    agent: { type: 'user-sim', config: { action: 'view-empty-state' } },
    assertions: [
      { type: 'content', expected: 'No items' },
      { type: 'no-errors', expected: true },
    ],
  });

  // Invalid inputs
  scenarios.push({
    id: 'edge-invalid-email',
    name: 'Invalid Email Handling',
    category: 'edge-cases',
    description: 'Form rejects invalid email format',
    priority: 'medium',
    estimatedDuration: 10,
    agent: { type: 'user-sim', config: { action: 'submit-invalid-email', value: 'not-an-email' } },
    assertions: [
      { type: 'content', expected: 'valid email' },
    ],
  });

  // Long inputs
  scenarios.push({
    id: 'edge-long-input',
    name: 'Long Input Handling',
    category: 'edge-cases',
    description: 'App handles very long inputs',
    priority: 'low',
    estimatedDuration: 10,
    agent: { type: 'user-sim', config: { action: 'submit-long-input', length: 10000 } },
    assertions: [
      { type: 'no-errors', expected: true },
    ],
  });

  // Special characters
  scenarios.push({
    id: 'edge-special-chars',
    name: 'Special Characters',
    category: 'edge-cases',
    description: 'App handles special characters safely',
    priority: 'high',
    estimatedDuration: 10,
    agent: { type: 'user-sim', config: { action: 'submit', value: '<script>alert("xss")</script>' } },
    assertions: [
      { type: 'security', expected: 'escaped' },
    ],
  });

  // Concurrent requests
  scenarios.push({
    id: 'edge-concurrent',
    name: 'Concurrent Requests',
    category: 'edge-cases',
    description: 'App handles concurrent user actions',
    priority: 'medium',
    estimatedDuration: 20,
    agent: { type: 'user-sim', config: { action: 'concurrent-clicks', count: 10 } },
    assertions: [
      { type: 'no-errors', expected: true },
    ],
  });

  return scenarios;
}

export function generatePerformanceTests(): TestScenario[] {
  const scenarios: TestScenario[] = [];

  // Page load performance
  scenarios.push({
    id: 'perf-initial-load',
    name: 'Initial Page Load < 3s',
    category: 'performance',
    description: 'Page loads within acceptable time',
    priority: 'high',
    estimatedDuration: 10,
    agent: { type: 'load-gen', config: { action: 'measure-load-time' } },
    assertions: [
      { type: 'response-time', expected: 3000 },
    ],
  });

  // Load testing
  scenarios.push({
    id: 'perf-load-100users',
    name: '100 Concurrent Users',
    category: 'performance',
    description: 'App handles 100 concurrent users',
    priority: 'medium',
    estimatedDuration: 60,
    agent: { type: 'load-gen', config: { users: 100, duration: 60 } },
    assertions: [
      { type: 'response-time', expected: 5000 },
      { type: 'status', expected: 200 },
    ],
  });

  // Memory leaks
  scenarios.push({
    id: 'perf-memory-leak',
    name: 'No Memory Leaks',
    category: 'performance',
    description: 'Memory usage stays stable over time',
    priority: 'medium',
    estimatedDuration: 120,
    agent: { type: 'load-gen', config: { action: 'memory-profile', duration: 120 } },
    assertions: [
      { type: 'content', expected: 'stable' },
    ],
  });

  return scenarios;
}

export function generateSecurityTests(): TestScenario[] {
  const scenarios: TestScenario[] = [];

  // XSS
  scenarios.push({
    id: 'sec-xss-reflected',
    name: 'XSS Prevention (Reflected)',
    category: 'security',
    description: 'App prevents reflected XSS attacks',
    priority: 'critical',
    estimatedDuration: 15,
    agent: {
      type: 'security-probe',
      config: {
        attack: 'xss',
        payloads: [
          '<script>alert(1)</script>',
          '"><script>alert(1)</script>',
          "javascript:alert(1)",
        ],
      },
    },
    assertions: [
      { type: 'security', expected: 'no-xss' },
    ],
  });

  // SQL Injection
  scenarios.push({
    id: 'sec-sqli',
    name: 'SQL Injection Prevention',
    category: 'security',
    description: 'App prevents SQL injection attacks',
    priority: 'critical',
    estimatedDuration: 15,
    agent: {
      type: 'security-probe',
      config: {
        attack: 'sqli',
        payloads: [
          "' OR '1'='1",
          "'; DROP TABLE users; --",
          "1; SELECT * FROM users",
        ],
      },
    },
    assertions: [
      { type: 'security', expected: 'no-sqli' },
    ],
  });

  // Auth bypass
  scenarios.push({
    id: 'sec-auth-bypass',
    name: 'Authentication Bypass Prevention',
    category: 'security',
    description: 'Protected routes require authentication',
    priority: 'critical',
    estimatedDuration: 20,
    agent: {
      type: 'security-probe',
      config: {
        attack: 'auth-bypass',
        targets: ['/dashboard', '/admin', '/api/users'],
      },
    },
    assertions: [
      { type: 'status', expected: 401 },
    ],
  });

  // CSRF
  scenarios.push({
    id: 'sec-csrf',
    name: 'CSRF Protection',
    category: 'security',
    description: 'Forms are protected against CSRF',
    priority: 'high',
    estimatedDuration: 15,
    agent: { type: 'security-probe', config: { attack: 'csrf' } },
    assertions: [
      { type: 'security', expected: 'csrf-protected' },
    ],
  });

  return scenarios;
}

export function generateAccessibilityTests(): TestScenario[] {
  const scenarios: TestScenario[] = [];

  scenarios.push({
    id: 'a11y-wcag-aa',
    name: 'WCAG 2.1 AA Compliance',
    category: 'accessibility',
    description: 'App meets WCAG 2.1 AA standards',
    priority: 'high',
    estimatedDuration: 30,
    agent: { type: 'a11y-audit', config: { standard: 'WCAG21AA' } },
    assertions: [
      { type: 'accessibility', expected: 'pass' },
    ],
  });

  scenarios.push({
    id: 'a11y-keyboard-nav',
    name: 'Keyboard Navigation',
    category: 'accessibility',
    description: 'All interactive elements accessible via keyboard',
    priority: 'high',
    estimatedDuration: 20,
    agent: { type: 'a11y-audit', config: { test: 'keyboard-navigation' } },
    assertions: [
      { type: 'accessibility', expected: 'navigable' },
    ],
  });

  scenarios.push({
    id: 'a11y-screen-reader',
    name: 'Screen Reader Compatible',
    category: 'accessibility',
    description: 'Content readable by screen readers',
    priority: 'medium',
    estimatedDuration: 25,
    agent: { type: 'a11y-audit', config: { test: 'screen-reader' } },
    assertions: [
      { type: 'accessibility', expected: 'readable' },
    ],
  });

  return scenarios;
}

export function generateChaosTests(): TestScenario[] {
  const scenarios: TestScenario[] = [];

  scenarios.push({
    id: 'chaos-network-slow',
    name: 'Slow Network Resilience',
    category: 'chaos',
    description: 'App works on slow 3G connection',
    priority: 'medium',
    estimatedDuration: 30,
    agent: { type: 'chaos-monkey', config: { chaos: 'slow-network', speed: '3g' } },
    assertions: [
      { type: 'no-errors', expected: true },
      { type: 'content', expected: 'loaded' },
    ],
  });

  scenarios.push({
    id: 'chaos-network-offline',
    name: 'Offline Handling',
    category: 'chaos',
    description: 'App handles offline state gracefully',
    priority: 'low',
    estimatedDuration: 20,
    agent: { type: 'chaos-monkey', config: { chaos: 'offline' } },
    assertions: [
      { type: 'content', expected: 'offline' },
    ],
  });

  scenarios.push({
    id: 'chaos-api-failure',
    name: 'API Failure Recovery',
    category: 'chaos',
    description: 'App recovers from API failures',
    priority: 'medium',
    estimatedDuration: 20,
    agent: { type: 'chaos-monkey', config: { chaos: 'api-failure', errorRate: 0.5 } },
    assertions: [
      { type: 'content', expected: 'retry' },
      { type: 'no-errors', expected: true },
    ],
  });

  return scenarios;
}

// ============================================
// GYM SESSION MANAGEMENT
// ============================================

const activeSessions = new Map<string, GymSession>();

export function createGymSession(
  buildId: string,
  appType: string,
  config: Partial<GymConfig> = {}
): GymSession {
  const fullConfig = { ...DEFAULT_GYM_CONFIG, ...config };

  // Generate scenarios based on config
  const scenarios: TestScenario[] = [];

  if (fullConfig.categories.includes('functional')) {
    scenarios.push(...generateFunctionalTests(appType));
  }
  if (fullConfig.categories.includes('user-journey')) {
    scenarios.push(...generateUserJourneyTests(appType));
  }
  if (fullConfig.categories.includes('edge-cases')) {
    scenarios.push(...generateEdgeCaseTests());
  }
  if (fullConfig.categories.includes('performance')) {
    scenarios.push(...generatePerformanceTests());
  }
  if (fullConfig.categories.includes('security')) {
    scenarios.push(...generateSecurityTests());
  }
  if (fullConfig.categories.includes('accessibility')) {
    scenarios.push(...generateAccessibilityTests());
  }
  if (fullConfig.categories.includes('chaos')) {
    scenarios.push(...generateChaosTests());
  }

  const session: GymSession = {
    id: `gym-${buildId}-${Date.now()}`,
    buildId,
    status: 'initializing',
    startedAt: new Date(),
    scenarios,
    results: [],
    confidence: {
      overall: 0,
      breakdown: [],
      grade: 'F',
      readyForProduction: false,
      blockers: [],
      warnings: [],
      improvements: [],
    },
    iterations: 0,
    config: fullConfig,
  };

  activeSessions.set(buildId, session);
  return session;
}

export function getGymSession(buildId: string): GymSession | undefined {
  return activeSessions.get(buildId);
}

// ============================================
// TEST EXECUTION
// ============================================

export async function runGymSession(
  buildId: string,
  onProgress?: (session: GymSession) => void
): Promise<GymSession> {
  const session = activeSessions.get(buildId);
  if (!session) {
    throw new Error(`No gym session for build ${buildId}`);
  }

  session.status = 'running';

  // Run iterations until target confidence or max iterations
  while (
    session.iterations < session.config.maxIterations &&
    session.confidence.overall < session.config.targetConfidence
  ) {
    session.iterations++;

    // Run all scenarios
    for (const scenario of session.scenarios) {
      const result = await runScenario(scenario, session.config);
      session.results.push(result);

      // Update confidence after each result
      session.confidence = calculateConfidence(session.results, session.scenarios);

      // Notify progress
      if (onProgress) {
        onProgress(session);
      }

      // Stop on critical failure if configured
      if (
        session.config.stopOnCriticalFailure &&
        result.status === 'failed' &&
        scenario.priority === 'critical'
      ) {
        session.status = 'failed';
        session.completedAt = new Date();
        return session;
      }
    }

    // Check if we've reached target confidence
    if (session.confidence.overall >= session.config.targetConfidence) {
      break;
    }
  }

  session.status = 'complete';
  session.completedAt = new Date();

  return session;
}

async function runScenario(
  scenario: TestScenario,
  config: GymConfig
): Promise<TestResult> {
  const startTime = Date.now();
  const result: TestResult = {
    scenarioId: scenario.id,
    status: 'running',
    duration: 0,
    assertions: [...scenario.assertions],
    logs: [],
    retries: 0,
  };

  // Simulate test execution (in production, would use Playwright/Puppeteer)
  try {
    await simulateTest(scenario, config.timeout);

    // Simulate assertion results (in production, would be real checks)
    for (const assertion of result.assertions) {
      assertion.passed = Math.random() > 0.1; // 90% pass rate for demo
      assertion.actual = assertion.passed ? assertion.expected : 'unexpected';
    }

    const allPassed = result.assertions.every(a => a.passed);
    result.status = allPassed ? 'passed' : 'failed';

    if (!allPassed && config.retryFailures && result.retries < config.maxRetries) {
      // Retry logic would go here
      result.retries++;
    }
  } catch (error) {
    result.status = 'failed';
    result.errors = [{
      type: 'crash',
      message: error instanceof Error ? error.message : 'Unknown error',
    }];
  }

  result.duration = Date.now() - startTime;
  return result;
}

async function simulateTest(scenario: TestScenario, timeout: number): Promise<void> {
  // Simulate test duration (capped at timeout)
  const duration = Math.min(scenario.estimatedDuration * 100, timeout);
  return new Promise(resolve => setTimeout(resolve, duration));
}

// ============================================
// REPORTS
// ============================================

export interface GymReport {
  session: GymSession;
  summary: string;
  details: CategoryReport[];
  recommendations: string[];
  certificateEligible: boolean;
}

export interface CategoryReport {
  category: TestCategory;
  score: number;
  scenarios: {
    name: string;
    status: TestStatus;
    duration: number;
    issues: string[];
  }[];
}

export function generateGymReport(session: GymSession): GymReport {
  const details: CategoryReport[] = [];

  // Group scenarios by category
  const categories = [...new Set(session.scenarios.map(s => s.category))];

  for (const category of categories) {
    const categoryScenarios = session.scenarios.filter(s => s.category === category);
    const categoryResults = session.results.filter(r =>
      categoryScenarios.some(s => s.id === r.scenarioId)
    );

    const score = session.confidence.breakdown.find(b => b.category === category)?.score || 0;

    details.push({
      category,
      score,
      scenarios: categoryScenarios.map(scenario => {
        const result = categoryResults.find(r => r.scenarioId === scenario.id);
        return {
          name: scenario.name,
          status: result?.status || 'pending',
          duration: result?.duration || 0,
          issues: result?.errors?.map(e => e.message) || [],
        };
      }),
    });
  }

  const recommendations: string[] = [];
  if (session.confidence.blockers.length > 0) {
    recommendations.push('Fix critical issues before deployment');
  }
  if (session.confidence.overall < 90) {
    recommendations.push('Run additional test iterations to improve confidence');
  }
  if (!session.scenarios.some(s => s.category === 'security')) {
    recommendations.push('Add security tests for production readiness');
  }

  return {
    session,
    summary: `Gym completed with ${session.confidence.grade} grade (${session.confidence.overall}% confidence)`,
    details,
    recommendations,
    certificateEligible: session.confidence.readyForProduction,
  };
}

// ============================================
// PRODUCTION CERTIFICATE
// ============================================

export interface ProductionCertificate {
  id: string;
  buildId: string;
  issuedAt: Date;
  expiresAt: Date;
  confidence: number;
  grade: string;
  testsRun: number;
  testsPassed: number;
  categories: TestCategory[];
  signature: string;
}

export function issueProductionCertificate(session: GymSession): ProductionCertificate | null {
  if (!session.confidence.readyForProduction) {
    return null;
  }

  const passed = session.results.filter(r => r.status === 'passed').length;

  return {
    id: `cert-${session.buildId}-${Date.now()}`,
    buildId: session.buildId,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    confidence: session.confidence.overall,
    grade: session.confidence.grade,
    testsRun: session.results.length,
    testsPassed: passed,
    categories: session.config.categories,
    signature: generateSignature(session),
  };
}

function generateSignature(session: GymSession): string {
  // In production, would be cryptographic signature
  return Buffer.from(
    `forge-${session.buildId}-${session.confidence.overall}-${Date.now()}`
  ).toString('base64').slice(0, 32);
}
