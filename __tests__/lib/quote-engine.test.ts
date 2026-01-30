/**
 * AFC-QUOTE-0: Quote Engine Unit Tests
 *
 * Tests the deterministic estimation logic.
 */

import {
  calculateEffortHours,
  generateEstimate,
  validateScope,
  formatEstimateEvidence,
  EstimateScope,
} from '@/lib/quote-engine';

describe('Quote Engine', () => {
  describe('calculateEffortHours', () => {
    it('calculates base hours for web app', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const { hours, breakdown } = calculateEffortHours(scope);
      expect(breakdown.baseHours).toBe(300);
      expect(hours).toBe(300);
    });

    it('calculates base hours for mobile app', () => {
      const scope: EstimateScope = {
        appType: 'mobile',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const { hours, breakdown } = calculateEffortHours(scope);
      expect(breakdown.baseHours).toBe(400);
      expect(hours).toBe(400);
    });

    it('calculates base hours for backend app', () => {
      const scope: EstimateScope = {
        appType: 'backend',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const { hours, breakdown } = calculateEffortHours(scope);
      expect(breakdown.baseHours).toBe(250);
      expect(hours).toBe(250);
    });

    it('adds feature hours for known features', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'dashboard'],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const { breakdown } = calculateEffortHours(scope);
      expect(breakdown.featureHours).toBe(100); // auth(40) + dashboard(60)
    });

    it('uses default 30h for unknown features', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['custom-feature'],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const { breakdown } = calculateEffortHours(scope);
      expect(breakdown.featureHours).toBe(30);
    });

    it('adds 25h per integration', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: ['stripe', 'sendgrid', 'twilio'],
        complexity: 'low',
        timeline: 'normal',
      };
      const { breakdown } = calculateEffortHours(scope);
      expect(breakdown.integrationHours).toBe(75); // 3 * 25
    });

    it('applies complexity multiplier for medium', () => {
      const scope: EstimateScope = {
        appType: 'backend',
        features: [],
        integrations: [],
        complexity: 'medium',
        timeline: 'normal',
      };
      const { hours, breakdown } = calculateEffortHours(scope);
      expect(breakdown.complexityMultiplier).toBe(1.25);
      // 250 * 1.25 = 312.5, rounded to nearest 10 = 310
      expect(hours).toBe(310);
    });

    it('applies complexity multiplier for high', () => {
      const scope: EstimateScope = {
        appType: 'backend',
        features: [],
        integrations: [],
        complexity: 'high',
        timeline: 'normal',
      };
      const { hours, breakdown } = calculateEffortHours(scope);
      expect(breakdown.complexityMultiplier).toBe(1.5);
      // 250 * 1.5 = 375, rounded to nearest 10 = 380
      expect(hours).toBe(380);
    });

    it('applies rush multiplier', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'rush',
      };
      const { hours, breakdown } = calculateEffortHours(scope);
      expect(breakdown.rushMultiplier).toBe(1.2);
      // 300 * 1.2 = 360
      expect(hours).toBe(360);
    });

    it('combines all multipliers correctly', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'dashboard', 'billing'],
        integrations: ['stripe', 'sendgrid'],
        complexity: 'high',
        timeline: 'rush',
      };
      const { hours, breakdown } = calculateEffortHours(scope);

      // Base: 300
      // Features: 40 + 60 + 50 = 150
      // Integrations: 2 * 25 = 50
      // Total before: 500
      // * 1.5 (high) * 1.2 (rush) = 900
      expect(breakdown.baseHours).toBe(300);
      expect(breakdown.featureHours).toBe(150);
      expect(breakdown.integrationHours).toBe(50);
      expect(breakdown.totalBeforeMultipliers).toBe(500);
      expect(hours).toBe(900);
    });
  });

  describe('generateEstimate', () => {
    it('generates estimate with default rate', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.effortHours).toBe(300);
      expect(estimate.breakdown.rate).toBe(90);
      // 300 * 90 = 27000, min = 24300, max = 29700
      expect(estimate.minCost).toBe(24300);
      expect(estimate.maxCost).toBe(29700);
      expect(estimate.currency).toBe('USD');
    });

    it('accepts rate override', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope, 150);

      expect(estimate.breakdown.rate).toBe(150);
      // 300 * 150 = 45000, min = 40500, max = 49500
      expect(estimate.minCost).toBe(40500);
      expect(estimate.maxCost).toBe(49500);
    });

    it('includes standard assumptions', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.assumptions).toContain('Requirements are well-defined and documented');
      expect(estimate.assumptions).toContain('Stakeholders are available for regular feedback');
    });

    it('adds high complexity assumption', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'high',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.assumptions).toContain('High complexity requires senior developer involvement');
    });

    it('adds rush timeline assumption', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'rush',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.assumptions).toContain('Rush timeline requires dedicated team allocation');
    });

    it('includes standard risks', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.risks).toContain('Requirements clarity may require additional discovery');
      expect(estimate.risks).toContain('Third-party API changes may impact integration timeline');
    });

    it('adds risk for multiple integrations', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: ['a', 'b', 'c'],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.risks).toContain('Multiple integrations increase coordination complexity');
    });

    it('adds risk for large feature set', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['a', 'b', 'c', 'd', 'e', 'f'],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.risks).toContain('Large feature set may require phased delivery');
    });

    it('adds app store risk for mobile', () => {
      const scope: EstimateScope = {
        appType: 'mobile',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);

      expect(estimate.risks).toContain('App store approval process may affect launch timeline');
    });
  });

  describe('validateScope', () => {
    it('rejects non-object body', () => {
      const result = validateScope('not an object');
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('Request body must be a JSON object');
      }
    });

    it('rejects missing scope field', () => {
      const result = validateScope({});
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('Missing required field: scope');
      }
    });

    it('rejects extra top-level fields', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: [],
          integrations: [],
          complexity: 'low',
          timeline: 'normal',
        },
        extraField: 'not allowed',
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('Extra fields not allowed: extraField');
      }
    });

    it('allows sessionId as top-level field', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: [],
          integrations: [],
          complexity: 'low',
          timeline: 'normal',
        },
        sessionId: 'abc123',
      });
      expect(result.valid).toBe(true);
    });

    it('rejects extra scope fields', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: [],
          integrations: [],
          complexity: 'low',
          timeline: 'normal',
          budget: 50000,
        },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('Extra fields in scope not allowed: budget');
      }
    });

    it('rejects invalid appType', () => {
      const result = validateScope({
        scope: {
          appType: 'desktop',
          features: [],
          integrations: [],
          complexity: 'low',
          timeline: 'normal',
        },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Invalid scope.appType');
      }
    });

    it('rejects non-array features', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: 'auth',
          integrations: [],
          complexity: 'low',
          timeline: 'normal',
        },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('scope.features must be an array');
      }
    });

    it('rejects non-string feature items', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: [123],
          integrations: [],
          complexity: 'low',
          timeline: 'normal',
        },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('scope.features must contain only strings');
      }
    });

    it('rejects invalid complexity', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: [],
          integrations: [],
          complexity: 'extreme',
          timeline: 'normal',
        },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Invalid scope.complexity');
      }
    });

    it('rejects invalid timeline', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: [],
          integrations: [],
          complexity: 'low',
          timeline: 'asap',
        },
      });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toContain('Invalid scope.timeline');
      }
    });

    it('accepts valid scope', () => {
      const result = validateScope({
        scope: {
          appType: 'web',
          features: ['auth', 'dashboard'],
          integrations: ['stripe'],
          complexity: 'medium',
          timeline: 'rush',
        },
      });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.scope.appType).toBe('web');
        expect(result.scope.features).toEqual(['auth', 'dashboard']);
        expect(result.scope.integrations).toEqual(['stripe']);
        expect(result.scope.complexity).toBe('medium');
        expect(result.scope.timeline).toBe('rush');
      }
    });
  });

  describe('formatEstimateEvidence', () => {
    it('formats evidence for audit trail', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'dashboard'],
        integrations: ['stripe'],
        complexity: 'medium',
        timeline: 'normal',
      };
      const estimate = generateEstimate(scope);
      const evidence = formatEstimateEvidence(estimate, scope);

      expect(evidence.basis).toBe('build-from-scratch');
      expect(evidence.methodology).toBe('standard-effort-estimation');
      expect(evidence.scope).toEqual({
        appType: 'web',
        featureCount: 2,
        integrationCount: 1,
        complexity: 'medium',
        timeline: 'normal',
      });
      expect(evidence.effortHours).toBe(estimate.effortHours);
      expect(evidence.rate).toBe(90);
      expect(evidence.minCost).toBe(estimate.minCost);
      expect(evidence.maxCost).toBe(estimate.maxCost);
      expect(evidence.disclaimer).toContain('build-from-scratch');
    });
  });

  describe('determinism', () => {
    it('produces identical results for identical inputs', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'dashboard', 'billing'],
        integrations: ['stripe', 'sendgrid'],
        complexity: 'high',
        timeline: 'rush',
      };

      const estimate1 = generateEstimate(scope);
      const estimate2 = generateEstimate(scope);

      expect(estimate1.effortHours).toBe(estimate2.effortHours);
      expect(estimate1.minCost).toBe(estimate2.minCost);
      expect(estimate1.maxCost).toBe(estimate2.maxCost);
      expect(estimate1.breakdown).toEqual(estimate2.breakdown);
    });
  });
});
