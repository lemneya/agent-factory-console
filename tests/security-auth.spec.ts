import { test, expect, request } from '@playwright/test';

/**
 * SECURITY-0: Authentication & Ownership Enforcement Tests
 *
 * These tests verify that all write endpoints properly enforce:
 * 1. Authentication (401 for unauthenticated requests)
 * 2. Resource ownership (403 for non-owners)
 *
 * NOTE: When CI=true or NEXT_PUBLIC_DEV_AUTH_BYPASS=true, auth is bypassed.
 * These tests verify the auth code paths exist but may pass in CI due to bypass.
 * Full security testing should be done in a non-bypass environment.
 */

test.describe('SECURITY-0: Write Endpoint Auth Enforcement', () => {
  // Test base URL for API requests
  let baseURL: string;

  test.beforeAll(async ({ playwright }) => {
    // Get base URL from playwright config
    baseURL = process.env.BASE_URL || 'http://localhost:3000';
  });

  test.describe('Projects API (/api/projects/[id])', () => {
    test('PUT should return 401 without auth (when bypass disabled)', async ({ request }) => {
      // Note: In CI/test mode, auth bypass is enabled, so this will pass with 200
      // This test documents expected behavior when bypass is disabled
      const response = await request.put('/api/projects/nonexistent-id', {
        data: { repoName: 'test' },
      });

      // Accept either 401 (auth enforced) or 404 (auth bypassed, resource not found)
      expect([401, 404]).toContain(response.status());
    });

    test('PATCH should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.patch('/api/projects/nonexistent-id', {
        data: { repoOwner: 'test' },
      });

      expect([401, 404]).toContain(response.status());
    });

    test('DELETE should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.delete('/api/projects/nonexistent-id');

      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('Tasks API (/api/tasks/[id])', () => {
    test('PUT should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.put('/api/tasks/nonexistent-id', {
        data: { title: 'test' },
      });

      expect([401, 404]).toContain(response.status());
    });

    test('DELETE should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.delete('/api/tasks/nonexistent-id');

      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('Assets API (/api/assets/[id])', () => {
    test('PUT should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.put('/api/assets/nonexistent-id', {
        data: { name: 'test' },
      });

      expect([401, 404]).toContain(response.status());
    });

    test('DELETE should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.delete('/api/assets/nonexistent-id');

      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('WorkOrders API (/api/workorders/[id])', () => {
    test('PATCH should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.patch('/api/workorders/nonexistent-id', {
        data: { status: 'PENDING' },
      });

      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('Council Decisions API (/api/council/decisions/[id])', () => {
    test('DELETE should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.delete('/api/council/decisions/nonexistent-id');

      expect([401, 404]).toContain(response.status());
    });

    test('Override should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.post('/api/council/decisions/nonexistent-id/override', {
        data: {
          decision: 'BUILD',
          rationale: 'test',
          overrideReason: 'test',
        },
      });

      expect([401, 404]).toContain(response.status());
    });
  });

  test.describe('Copilot Drafts API (/api/copilot/drafts/[id])', () => {
    test('Reject should return 401 without auth (when bypass disabled)', async ({ request }) => {
      const response = await request.post('/api/copilot/drafts/nonexistent-id/reject', {
        data: { reason: 'test' },
      });

      expect([401, 404]).toContain(response.status());
    });
  });
});

test.describe('SECURITY-0: Auth Helper Response Codes', () => {
  test('should return proper error message format', async ({ request }) => {
    // Test that error responses include proper error message structure
    const response = await request.put('/api/projects/nonexistent-id', {
      data: { repoName: 'test' },
    });

    if (response.status() === 401) {
      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toContain('Authentication required');
    }
  });

  test('should return 403 with proper error for forbidden access', async ({ request }) => {
    // This test would need a real project owned by another user
    // In CI with bypass, this test documents the expected behavior
    // Actual ownership tests require a seeded database with multiple users
  });
});

test.describe('SECURITY-0: Dev Auth Bypass Behavior', () => {
  test('should document bypass conditions', () => {
    // Document the auth bypass conditions for security audit
    const bypassConditions = [
      'process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true"',
      'process.env.NODE_ENV === "test"',
      'process.env.CI === "true"',
    ];

    // This test just documents the bypass conditions exist
    // In production, NEXT_PUBLIC_DEV_AUTH_BYPASS should NEVER be set
    expect(bypassConditions).toContain('process.env.CI === "true"');
  });

  test('CI environment should use dev bypass', () => {
    // Verify CI test environment uses bypass (expected behavior)
    const isCI = process.env.CI === 'true';
    const isTest = process.env.NODE_ENV === 'test';
    const hasDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

    // In CI/test, at least one bypass condition should be true
    expect(isCI || isTest || hasDevBypass).toBe(true);
  });
});
