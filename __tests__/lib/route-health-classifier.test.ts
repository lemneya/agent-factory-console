/**
 * Route Health Classifier Tests
 * AFC-AUTH-UI-1: Auth-aware Route Health (401/403 → Lock)
 *
 * Tests the classifier function that categorizes route health probe results.
 */

import {
  classifyRouteHealth,
  getStatusIcon,
  getStatusLabel,
  getStatusColorClass,
  getStatusTooltip,
  type RouteHealthData,
} from '@/lib/route-health-classifier';

describe('Route Health Classifier', () => {
  describe('classifyRouteHealth', () => {
    it('should return LOADING for null health data', () => {
      expect(classifyRouteHealth(null)).toBe('LOADING');
    });

    it('should return HEALTHY for status 200', () => {
      const health: RouteHealthData = { status: 200, ok: true };
      expect(classifyRouteHealth(health)).toBe('HEALTHY');
    });

    it('should return AUTH_REQUIRED for status 401', () => {
      const health: RouteHealthData = { status: 401, ok: false };
      expect(classifyRouteHealth(health)).toBe('AUTH_REQUIRED');
    });

    it('should return AUTH_REQUIRED for status 403', () => {
      const health: RouteHealthData = { status: 403, ok: false };
      expect(classifyRouteHealth(health)).toBe('AUTH_REQUIRED');
    });

    it('should return ERROR for status 404', () => {
      const health: RouteHealthData = { status: 404, ok: false };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return ERROR for status 500', () => {
      const health: RouteHealthData = { status: 500, ok: false };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return ERROR for status 502', () => {
      const health: RouteHealthData = { status: 502, ok: false };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return ERROR for status 503', () => {
      const health: RouteHealthData = { status: 503, ok: false };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return ERROR for network error (status 0)', () => {
      const health: RouteHealthData = { status: 0, ok: false, error: 'Network error' };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return ERROR for timeout (status 0 with error)', () => {
      const health: RouteHealthData = { status: 0, ok: false, error: 'Request timeout (5s)' };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return ERROR when error string is present regardless of status', () => {
      const health: RouteHealthData = { status: 200, ok: false, error: 'Some error occurred' };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });

    it('should return AUTH_REQUIRED for redirect to /login', () => {
      const health: RouteHealthData = {
        status: 302,
        ok: false,
        redirected: true,
        redirectUrl: 'https://example.com/login?callback=/protected',
      };
      expect(classifyRouteHealth(health)).toBe('AUTH_REQUIRED');
    });

    it('should return AUTH_REQUIRED for redirect to /signin', () => {
      const health: RouteHealthData = {
        status: 307,
        ok: false,
        redirected: true,
        redirectUrl: 'https://example.com/signin',
      };
      expect(classifyRouteHealth(health)).toBe('AUTH_REQUIRED');
    });

    it('should return AUTH_REQUIRED for redirect to /auth', () => {
      const health: RouteHealthData = {
        status: 302,
        ok: false,
        redirected: true,
        redirectUrl: 'https://example.com/auth/github',
      };
      expect(classifyRouteHealth(health)).toBe('AUTH_REQUIRED');
    });

    it('should return AUTH_REQUIRED for redirect to /api/auth', () => {
      const health: RouteHealthData = {
        status: 302,
        ok: false,
        redirected: true,
        redirectUrl: 'https://example.com/api/auth/signin',
      };
      expect(classifyRouteHealth(health)).toBe('AUTH_REQUIRED');
    });

    it('should return HEALTHY for non-auth redirect (e.g., to dashboard)', () => {
      const health: RouteHealthData = {
        status: 302,
        ok: true,
        redirected: true,
        redirectUrl: 'https://example.com/dashboard',
      };
      expect(classifyRouteHealth(health)).toBe('HEALTHY');
    });

    it('should return HEALTHY for status 201 (created)', () => {
      const health: RouteHealthData = { status: 201, ok: true };
      expect(classifyRouteHealth(health)).toBe('HEALTHY');
    });

    it('should return HEALTHY for status 204 (no content)', () => {
      const health: RouteHealthData = { status: 204, ok: true };
      expect(classifyRouteHealth(health)).toBe('HEALTHY');
    });

    it('should return ERROR for status 400 (bad request)', () => {
      const health: RouteHealthData = { status: 400, ok: false };
      expect(classifyRouteHealth(health)).toBe('ERROR');
    });
  });

  describe('getStatusIcon', () => {
    it('should return ✅ for HEALTHY', () => {
      expect(getStatusIcon('HEALTHY')).toBe('✅');
    });

    it('should return 🔒 for AUTH_REQUIRED', () => {
      expect(getStatusIcon('AUTH_REQUIRED')).toBe('🔒');
    });

    it('should return ❌ for ERROR', () => {
      expect(getStatusIcon('ERROR')).toBe('❌');
    });

    it('should return ⏳ for LOADING', () => {
      expect(getStatusIcon('LOADING')).toBe('⏳');
    });
  });

  describe('getStatusLabel', () => {
    it('should return "Healthy" for HEALTHY', () => {
      expect(getStatusLabel('HEALTHY')).toBe('Healthy');
    });

    it('should return "Auth required" for AUTH_REQUIRED', () => {
      expect(getStatusLabel('AUTH_REQUIRED')).toBe('Auth required');
    });

    it('should return "Error" for ERROR', () => {
      expect(getStatusLabel('ERROR')).toBe('Error');
    });

    it('should return "..." for LOADING', () => {
      expect(getStatusLabel('LOADING')).toBe('...');
    });
  });

  describe('getStatusColorClass', () => {
    it('should return green for HEALTHY', () => {
      expect(getStatusColorClass('HEALTHY')).toBe('text-green-600');
    });

    it('should return yellow for AUTH_REQUIRED', () => {
      expect(getStatusColorClass('AUTH_REQUIRED')).toBe('text-yellow-600');
    });

    it('should return red for ERROR', () => {
      expect(getStatusColorClass('ERROR')).toBe('text-red-600');
    });

    it('should return gray for LOADING', () => {
      expect(getStatusColorClass('LOADING')).toBe('text-gray-400');
    });
  });

  describe('getStatusTooltip', () => {
    it('should return tooltip for AUTH_REQUIRED', () => {
      expect(getStatusTooltip('AUTH_REQUIRED')).toBe('Sign in to check this route.');
    });

    it('should return null for HEALTHY', () => {
      expect(getStatusTooltip('HEALTHY')).toBeNull();
    });

    it('should return null for ERROR', () => {
      expect(getStatusTooltip('ERROR')).toBeNull();
    });

    it('should return null for LOADING', () => {
      expect(getStatusTooltip('LOADING')).toBeNull();
    });
  });
});
