/**
 * AFC-QUOTE-0: Baseline Estimation Engine
 *
 * Produces professional, market-standard quotes as if an application
 * were built from scratch by a traditional dev team.
 *
 * BUSINESS RULE:
 * - Inventory reuse, OSS reuse, automation, and Kimi shortcuts MUST NOT influence pricing.
 * - Pricing is based on standard developer effort + rate cards.
 * - Internal shortcuts are margin, not part of the quote.
 */

// ============================================================================
// Types
// ============================================================================

export type AppType = 'web' | 'mobile' | 'backend';
export type Complexity = 'low' | 'medium' | 'high';
export type Timeline = 'normal' | 'rush';

export interface EstimateScope {
  appType: AppType;
  features: string[];
  integrations: string[];
  complexity: Complexity;
  timeline: Timeline;
}

export interface EstimateResult {
  effortHours: number;
  minCost: number;
  maxCost: number;
  currency: string;
  assumptions: string[];
  risks: string[];
  breakdown: EstimateBreakdown;
}

export interface EstimateBreakdown {
  baseHours: number;
  featureHours: number;
  integrationHours: number;
  complexityMultiplier: number;
  rushMultiplier: number;
  totalBeforeMultipliers: number;
  rate: number;
}

// ============================================================================
// Constants (deterministic)
// ============================================================================

/** Base hours by app type */
const BASE_HOURS: Record<AppType, number> = {
  web: 300,
  mobile: 400,
  backend: 250,
};

/** Feature hours (additive) */
const FEATURE_HOURS: Record<string, number> = {
  auth: 40,
  dashboard: 60,
  billing: 50,
  notifications: 30,
  search: 35,
  analytics: 45,
  admin: 55,
  api: 40,
  chat: 50,
  upload: 25,
  export: 20,
  settings: 15,
};

/** Hours per integration */
const INTEGRATION_HOURS = 25;

/** Complexity multipliers */
const COMPLEXITY_MULTIPLIER: Record<Complexity, number> = {
  low: 1.0,
  medium: 1.25,
  high: 1.5,
};

/** Timeline multiplier (rush adds 20%) */
const RUSH_MULTIPLIER = 1.2;
const NORMAL_MULTIPLIER = 1.0;

/** Default rate (USD/hour) */
const DEFAULT_RATE = 90;

/** Cost range buffer (±10%) */
const MIN_COST_FACTOR = 0.9;
const MAX_COST_FACTOR = 1.1;

// ============================================================================
// Standard Assumptions & Risks
// ============================================================================

const STANDARD_ASSUMPTIONS = [
  'Requirements are well-defined and documented',
  'Stakeholders are available for regular feedback',
  'No major scope changes after kickoff',
  'Standard security and compliance requirements',
  'Development environment is pre-configured',
];

const STANDARD_RISKS = [
  'Requirements clarity may require additional discovery',
  'Third-party API changes may impact integration timeline',
  'Performance optimization may require additional effort',
  'Cross-browser/device testing may uncover edge cases',
];

// ============================================================================
// Estimation Logic (deterministic)
// ============================================================================

/**
 * Calculate effort hours from scope
 */
export function calculateEffortHours(scope: EstimateScope): {
  hours: number;
  breakdown: EstimateBreakdown;
} {
  // 1. Base hours by app type
  const baseHours = BASE_HOURS[scope.appType];

  // 2. Feature hours (sum of known features)
  let featureHours = 0;
  for (const feature of scope.features) {
    const featureLower = feature.toLowerCase();
    featureHours += FEATURE_HOURS[featureLower] || 30; // Default 30h for unknown
  }

  // 3. Integration hours
  const integrationHours = scope.integrations.length * INTEGRATION_HOURS;

  // 4. Total before multipliers
  const totalBeforeMultipliers = baseHours + featureHours + integrationHours;

  // 5. Complexity multiplier
  const complexityMultiplier = COMPLEXITY_MULTIPLIER[scope.complexity];

  // 6. Rush multiplier
  const rushMultiplier = scope.timeline === 'rush' ? RUSH_MULTIPLIER : NORMAL_MULTIPLIER;

  // 7. Final hours (rounded to nearest 10)
  const rawHours = totalBeforeMultipliers * complexityMultiplier * rushMultiplier;
  const hours = Math.round(rawHours / 10) * 10;

  return {
    hours,
    breakdown: {
      baseHours,
      featureHours,
      integrationHours,
      complexityMultiplier,
      rushMultiplier,
      totalBeforeMultipliers,
      rate: DEFAULT_RATE,
    },
  };
}

/**
 * Generate a complete estimate from scope
 */
export function generateEstimate(
  scope: EstimateScope,
  rateOverride?: number
): EstimateResult {
  const rate = rateOverride ?? DEFAULT_RATE;
  const { hours, breakdown } = calculateEffortHours(scope);

  // Cost range (±10%)
  const baseCost = hours * rate;
  const minCost = Math.round(baseCost * MIN_COST_FACTOR);
  const maxCost = Math.round(baseCost * MAX_COST_FACTOR);

  // Build assumptions based on scope
  const assumptions = [...STANDARD_ASSUMPTIONS];
  if (scope.complexity === 'high') {
    assumptions.push('High complexity requires senior developer involvement');
  }
  if (scope.timeline === 'rush') {
    assumptions.push('Rush timeline requires dedicated team allocation');
  }

  // Build risks based on scope
  const risks = [...STANDARD_RISKS];
  if (scope.integrations.length > 2) {
    risks.push('Multiple integrations increase coordination complexity');
  }
  if (scope.features.length > 5) {
    risks.push('Large feature set may require phased delivery');
  }
  if (scope.appType === 'mobile') {
    risks.push('App store approval process may affect launch timeline');
  }

  return {
    effortHours: hours,
    minCost,
    maxCost,
    currency: 'USD',
    assumptions,
    risks,
    breakdown: { ...breakdown, rate },
  };
}

/**
 * Format estimate as evidence JSON for audit trail
 */
export function formatEstimateEvidence(
  estimate: EstimateResult,
  scope: EstimateScope
): Record<string, unknown> {
  return {
    basis: 'build-from-scratch',
    methodology: 'standard-effort-estimation',
    scope: {
      appType: scope.appType,
      featureCount: scope.features.length,
      integrationCount: scope.integrations.length,
      complexity: scope.complexity,
      timeline: scope.timeline,
    },
    effortHours: estimate.effortHours,
    rate: estimate.breakdown.rate,
    minCost: estimate.minCost,
    maxCost: estimate.maxCost,
    currency: estimate.currency,
    breakdown: estimate.breakdown,
    assumptions: estimate.assumptions,
    risks: estimate.risks,
    disclaimer: 'Estimate based on standard build-from-scratch methodology. Internal efficiencies are not reflected in pricing.',
  };
}

// ============================================================================
// Validation
// ============================================================================

const VALID_APP_TYPES: AppType[] = ['web', 'mobile', 'backend'];
const VALID_COMPLEXITIES: Complexity[] = ['low', 'medium', 'high'];
const VALID_TIMELINES: Timeline[] = ['normal', 'rush'];

export type ValidationResult =
  | { valid: true; scope: EstimateScope }
  | { valid: false; error: string };

/**
 * Validate and parse scope input (strict, no extra fields)
 */
export function validateScope(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const obj = body as Record<string, unknown>;

  // Check for required 'scope' field
  if (!obj.scope || typeof obj.scope !== 'object') {
    return { valid: false, error: 'Missing required field: scope' };
  }

  // Check for extra top-level fields
  const allowedTopLevel = ['scope', 'sessionId'];
  const extraTopLevel = Object.keys(obj).filter((k) => !allowedTopLevel.includes(k));
  if (extraTopLevel.length > 0) {
    return { valid: false, error: `Extra fields not allowed: ${extraTopLevel.join(', ')}` };
  }

  const scope = obj.scope as Record<string, unknown>;

  // Check for extra scope fields
  const allowedScopeFields = ['appType', 'features', 'integrations', 'complexity', 'timeline'];
  const extraScopeFields = Object.keys(scope).filter((k) => !allowedScopeFields.includes(k));
  if (extraScopeFields.length > 0) {
    return { valid: false, error: `Extra fields in scope not allowed: ${extraScopeFields.join(', ')}` };
  }

  // Validate appType
  if (typeof scope.appType !== 'string') {
    return { valid: false, error: 'scope.appType must be a string' };
  }
  if (!VALID_APP_TYPES.includes(scope.appType as AppType)) {
    return { valid: false, error: `Invalid scope.appType. Must be one of: ${VALID_APP_TYPES.join(', ')}` };
  }

  // Validate features
  if (!Array.isArray(scope.features)) {
    return { valid: false, error: 'scope.features must be an array' };
  }
  for (const f of scope.features) {
    if (typeof f !== 'string') {
      return { valid: false, error: 'scope.features must contain only strings' };
    }
  }

  // Validate integrations
  if (!Array.isArray(scope.integrations)) {
    return { valid: false, error: 'scope.integrations must be an array' };
  }
  for (const i of scope.integrations) {
    if (typeof i !== 'string') {
      return { valid: false, error: 'scope.integrations must contain only strings' };
    }
  }

  // Validate complexity
  if (typeof scope.complexity !== 'string') {
    return { valid: false, error: 'scope.complexity must be a string' };
  }
  if (!VALID_COMPLEXITIES.includes(scope.complexity as Complexity)) {
    return { valid: false, error: `Invalid scope.complexity. Must be one of: ${VALID_COMPLEXITIES.join(', ')}` };
  }

  // Validate timeline
  if (typeof scope.timeline !== 'string') {
    return { valid: false, error: 'scope.timeline must be a string' };
  }
  if (!VALID_TIMELINES.includes(scope.timeline as Timeline)) {
    return { valid: false, error: `Invalid scope.timeline. Must be one of: ${VALID_TIMELINES.join(', ')}` };
  }

  return {
    valid: true,
    scope: {
      appType: scope.appType as AppType,
      features: scope.features as string[],
      integrations: scope.integrations as string[],
      complexity: scope.complexity as Complexity,
      timeline: scope.timeline as Timeline,
    },
  };
}
