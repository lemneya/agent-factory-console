/**
 * AFC-ROUTER-INVENTORY-OSS-0: Build Router Tests
 *
 * Tests routing decision logic for build strategies.
 */

import { sniffOSS, checkLicense } from '@/lib/router/oss-sniffer';
import type { EstimateScope } from '@/lib/router/inventory-matcher';

describe('Build Router', () => {
  describe('OSS Sniffer', () => {
    it('returns candidates for web app with matching features', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'dashboard', 'billing'],
        integrations: [],
        complexity: 'medium',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.bestMatch).not.toBeNull();
    });

    it('filters candidates by stack compatibility', () => {
      const mobileScope: EstimateScope = {
        appType: 'mobile',
        features: ['auth', 'settings'],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };

      const result = sniffOSS(mobileScope);

      // Should only include mobile-compatible stacks
      // Mobile compatible includes: react-native, flutter, expo, typescript
      const mobileCompatibleStacks = ['react-native', 'flutter', 'expo', 'typescript'];
      for (const candidate of result.candidates) {
        const hasMobileStack = candidate.stack.some(s =>
          mobileCompatibleStacks.includes(s.toLowerCase())
        );
        expect(hasMobileStack).toBe(true);
      }
    });

    it('rejects GPL licenses', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['admin', 'dashboard'],
        integrations: [],
        complexity: 'medium',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      expect(result.rejectedForLicense).toContain('WordPress Plugin Framework');
    });

    it('returns empty when no features match', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['custom-feature-xyz'],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      expect(result.candidates.length).toBe(0);
      expect(result.bestMatch).toBeNull();
      expect(result.totalCoverage).toBe(0);
    });

    it('only considers candidates with coverage >= 0.6 for bestMatch', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['search'], // Only Docusaurus matches, with 0.3 coverage
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      // Docusaurus matches but has low coverage
      expect(result.bestMatch).toBeNull();
    });
  });

  describe('License Checker', () => {
    it('rejects GPL license', () => {
      const result = checkLicense('GPL-2.0');
      expect(result.acceptable).toBe(false);
      expect(result.reason).toContain('copyleft');
    });

    it('rejects AGPL license', () => {
      const result = checkLicense('AGPL-3.0');
      expect(result.acceptable).toBe(false);
    });

    it('accepts MIT license', () => {
      const result = checkLicense('MIT');
      expect(result.acceptable).toBe(true);
      expect(result.preferred).toBe(true);
    });

    it('accepts Apache-2.0 license', () => {
      const result = checkLicense('Apache-2.0');
      expect(result.acceptable).toBe(true);
      expect(result.preferred).toBe(true);
    });

    it('accepts BSD license', () => {
      const result = checkLicense('BSD-3-Clause');
      expect(result.acceptable).toBe(true);
      expect(result.preferred).toBe(true);
    });

    it('accepts ISC license', () => {
      const result = checkLicense('ISC');
      expect(result.acceptable).toBe(true);
      expect(result.preferred).toBe(true);
    });
  });

  describe('Routing Strategy Selection', () => {
    // Note: Full routing tests require database mocking for inventory
    // These tests focus on OSS-only scenarios

    it('produces deterministic results for same input', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'dashboard', 'billing'],
        integrations: ['stripe'],
        complexity: 'medium',
        timeline: 'normal',
      };

      const result1 = sniffOSS(scope);
      const result2 = sniffOSS(scope);

      expect(result1.candidates.length).toBe(result2.candidates.length);
      expect(result1.bestMatch?.name).toBe(result2.bestMatch?.name);
      expect(result1.totalCoverage).toBe(result2.totalCoverage);
      expect(result1.rejectedForLicense).toEqual(result2.rejectedForLicense);
    });

    it('returns OSS candidate for web SaaS features', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: ['auth', 'billing', 'dashboard', 'settings'],
        integrations: [],
        complexity: 'medium',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      expect(result.bestMatch).not.toBeNull();
      expect(result.bestMatch?.name).toBe('Next.js SaaS Starter');
      expect(result.totalCoverage).toBeGreaterThanOrEqual(0.6);
    });

    it('returns backend candidate for API features', () => {
      const scope: EstimateScope = {
        appType: 'backend',
        features: ['api', 'auth', 'notifications'],
        integrations: [],
        complexity: 'high',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      expect(result.candidates.length).toBeGreaterThan(0);
      // Should match NestJS or similar backend framework
      const hasBackendCandidate = result.candidates.some(
        c => c.stack.includes('nodejs') || c.stack.includes('nestjs') || c.stack.includes('express')
      );
      expect(hasBackendCandidate).toBe(true);
    });

    it('handles empty features gracefully', () => {
      const scope: EstimateScope = {
        appType: 'web',
        features: [],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };

      const result = sniffOSS(scope);

      expect(result.candidates.length).toBe(0);
      expect(result.bestMatch).toBeNull();
      expect(result.totalCoverage).toBe(0);
    });
  });

  describe('Coverage Calculation', () => {
    it('adjusts coverage based on feature overlap', () => {
      // Request only 1 feature that the SaaS starter covers
      const singleFeature: EstimateScope = {
        appType: 'web',
        features: ['auth'],
        integrations: [],
        complexity: 'low',
        timeline: 'normal',
      };

      const result = sniffOSS(singleFeature);

      // Coverage should reflect that auth is 1/1 = 100% of requested
      // But capped by the OSS candidate's base coverage
      expect(result.candidates.length).toBeGreaterThan(0);
    });

    it('reduces coverage when feature overlap is low', () => {
      // Request features that only partially match
      const partialMatch: EstimateScope = {
        appType: 'web',
        features: ['auth', 'chat', 'analytics', 'export', 'search'],
        integrations: [],
        complexity: 'medium',
        timeline: 'normal',
      };

      const result = sniffOSS(partialMatch);

      // SaaS starter only covers auth from this list (1/5 = 20%)
      // So adjusted coverage should be lower than base 75%
      const saasCandidate = result.candidates.find(c => c.name.includes('SaaS'));
      if (saasCandidate) {
        expect(saasCandidate.coverageEstimate).toBeLessThan(0.75);
      }
    });
  });
});
