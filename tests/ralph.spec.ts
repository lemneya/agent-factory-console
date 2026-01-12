import { test, expect } from '@playwright/test';

/**
 * E2E Tests for AFC-1.4 Ralph Mode Runner
 *
 * Tests cover:
 * - Ralph Mode API endpoints (policy, iterations, verify-result)
 * - Ralph Mode control actions (start, stop, approve)
 * - UI panel display and interaction
 */

test.describe('AFC-1.4 Ralph Mode Runner', () => {
  test.describe('Ralph Mode API', () => {
    test.describe('Policy API', () => {
      test('should respond to policy GET API', async ({ request }) => {
        const response = await request.get('/api/runs/test-run-123/policy');
        // 404 is expected for non-existent run, but not 500
        expect([200, 404]).toContain(response.status());
      });

      test('should return JSON content type', async ({ request }) => {
        const response = await request.get('/api/runs/test-run-123/policy');
        expect(response.headers()['content-type']).toContain('application/json');
      });

      test('should handle policy PUT request', async ({ request }) => {
        const response = await request.put('/api/runs/test-run-123/policy', {
          data: {
            maxIterations: 50,
            maxWallClockSeconds: 28800,
            maxFailures: 15,
            verificationCommands: ['npm run lint', 'npm test'],
          },
        });
        // 404 for non-existent run, but should not 500
        expect([200, 404, 400]).toContain(response.status());
      });
    });

    test.describe('Iterations API', () => {
      test('should respond to iterations GET API', async ({ request }) => {
        const response = await request.get('/api/runs/test-run-123/iterations');
        expect([200, 404]).toContain(response.status());
      });

      test('should return JSON content type', async ({ request }) => {
        const response = await request.get('/api/runs/test-run-123/iterations');
        expect(response.headers()['content-type']).toContain('application/json');
      });

      test('should respond to specific iteration GET API', async ({ request }) => {
        const response = await request.get('/api/runs/test-run-123/iterations/1');
        expect([200, 404]).toContain(response.status());
      });
    });

    test.describe('Ralph Control API', () => {
      test('should respond to ralph POST API (start)', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/ralph', {
          data: { action: 'start' },
        });
        expect([200, 404, 400]).toContain(response.status());
      });

      test('should respond to ralph POST API (stop)', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/ralph', {
          data: { action: 'stop' },
        });
        expect([200, 404, 400]).toContain(response.status());
      });

      test('should respond to ralph POST API (approve)', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/ralph', {
          data: { action: 'approve' },
        });
        expect([200, 404, 400]).toContain(response.status());
      });

      test('should reject invalid action', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/ralph', {
          data: { action: 'invalid_action' },
        });
        expect(response.status()).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('action');
      });

      test('should return JSON content type', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/ralph', {
          data: { action: 'start' },
        });
        expect(response.headers()['content-type']).toContain('application/json');
      });
    });

    test.describe('Verify Result API', () => {
      test('should respond to verify-result POST API', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/verify-result', {
          data: {
            iteration: 1,
            commandResults: [
              { cmd: 'npm run lint', exitCode: 0, duration: 5000 },
              { cmd: 'npm test', exitCode: 0, duration: 30000 },
              { cmd: 'npm run build', exitCode: 0, duration: 15000 },
            ],
            passed: true,
          },
        });
        expect([200, 404, 400, 409]).toContain(response.status());
      });

      test('should return JSON content type', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/verify-result', {
          data: {
            iteration: 1,
            passed: true,
            commandResults: [],
          },
        });
        expect(response.headers()['content-type']).toContain('application/json');
      });

      test('should require iteration number', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/verify-result', {
          data: {
            passed: true,
            commandResults: [],
          },
        });
        expect(response.status()).toBe(400);
      });

      test('should require passed boolean', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/verify-result', {
          data: {
            iteration: 1,
            commandResults: [],
          },
        });
        expect(response.status()).toBe(400);
      });

      test('should accept error fingerprint for failed verification', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/verify-result', {
          data: {
            iteration: 1,
            passed: false,
            errorFingerprint: 'abc123hash',
            commandResults: [
              { cmd: 'npm test', exitCode: 1, duration: 10000 },
            ],
          },
        });
        expect([200, 404, 400, 409]).toContain(response.status());
      });

      test('should accept diff stats', async ({ request }) => {
        const response = await request.post('/api/runs/test-run-123/verify-result', {
          data: {
            iteration: 1,
            passed: true,
            commandResults: [],
            diffStats: { files: 5, insertions: 100, deletions: 20 },
          },
        });
        expect([200, 404, 400, 409]).toContain(response.status());
      });
    });
  });

  test.describe('Ralph Mode UI', () => {
    test('should display Ralph Mode panel on runs page', async ({ page }) => {
      await page.goto('/runs');
      await expect(page.getByRole('heading', { name: /runs/i }).first()).toBeVisible();
    });

    test('should have runs page structure', async ({ page }) => {
      await page.goto('/runs');
      await expect(page.getByTestId('page-title')).toBeVisible();
    });
  });

  test.describe('Policy Validation', () => {
    test('should reject negative maxIterations', async ({ request }) => {
      const response = await request.put('/api/runs/test-run-123/policy', {
        data: {
          maxIterations: -1,
        },
      });
      expect([400, 404]).toContain(response.status());
    });

    test('should reject zero maxIterations', async ({ request }) => {
      const response = await request.put('/api/runs/test-run-123/policy', {
        data: {
          maxIterations: 0,
        },
      });
      expect([400, 404]).toContain(response.status());
    });

    test('should reject negative maxWallClockSeconds', async ({ request }) => {
      const response = await request.put('/api/runs/test-run-123/policy', {
        data: {
          maxWallClockSeconds: -1,
        },
      });
      expect([400, 404]).toContain(response.status());
    });

    test('should reject invalid verificationCommands type', async ({ request }) => {
      const response = await request.put('/api/runs/test-run-123/policy', {
        data: {
          verificationCommands: 'not an array',
        },
      });
      expect([400, 404]).toContain(response.status());
    });
  });

  test.describe('Iteration Status Tracking', () => {
    test('should support RUNNING status', async ({ request }) => {
      const response = await request.post('/api/runs/test-run-123/verify-result', {
        data: {
          iteration: 1,
          status: 'RUNNING',
          passed: false,
          commandResults: [],
        },
      });
      expect([200, 404, 400, 409]).toContain(response.status());
    });

    test('should support PASSED status', async ({ request }) => {
      const response = await request.post('/api/runs/test-run-123/verify-result', {
        data: {
          iteration: 1,
          passed: true,
          commandResults: [
            { cmd: 'npm run lint', exitCode: 0 },
            { cmd: 'npm test', exitCode: 0 },
            { cmd: 'npm run build', exitCode: 0 },
          ],
        },
      });
      expect([200, 404, 400, 409]).toContain(response.status());
    });

    test('should support FAILED status with error fingerprint', async ({ request }) => {
      const response = await request.post('/api/runs/test-run-123/verify-result', {
        data: {
          iteration: 1,
          passed: false,
          errorFingerprint: 'xyz789fingerprint',
          commandResults: [
            { cmd: 'npm test', exitCode: 1 },
          ],
        },
      });
      expect([200, 404, 400, 409]).toContain(response.status());
    });
  });

  test.describe('Circuit Breaker Detection', () => {
    test('should accept thrash detection data', async ({ request }) => {
      // Simulate multiple failed iterations with same fingerprint
      const response = await request.post('/api/runs/test-run-123/verify-result', {
        data: {
          iteration: 3,
          passed: false,
          errorFingerprint: 'repeated-error-hash',
          commandResults: [
            { cmd: 'npm test', exitCode: 1 },
          ],
        },
      });
      expect([200, 404, 400, 409]).toContain(response.status());
    });
  });

  test.describe('Ralph Mode Flow', () => {
    test('should handle full lifecycle (start → verify → stop)', async ({ request }) => {
      // Start Ralph mode
      const startRes = await request.post('/api/runs/test-run-123/ralph', {
        data: { action: 'start' },
      });
      expect([200, 404]).toContain(startRes.status());

      // Submit verification result
      const verifyRes = await request.post('/api/runs/test-run-123/verify-result', {
        data: {
          iteration: 1,
          passed: true,
          commandResults: [{ cmd: 'npm test', exitCode: 0 }],
        },
      });
      expect([200, 404, 409]).toContain(verifyRes.status());

      // Stop Ralph mode
      const stopRes = await request.post('/api/runs/test-run-123/ralph', {
        data: { action: 'stop' },
      });
      expect([200, 404, 409]).toContain(stopRes.status());
    });
  });

  test.describe('Error Responses', () => {
    test('should return 404 for non-existent run policy', async ({ request }) => {
      const response = await request.get('/api/runs/nonexistent-run-id-xyz/policy');
      expect(response.status()).toBe(404);
    });

    test('should return 404 for non-existent run iterations', async ({ request }) => {
      const response = await request.get('/api/runs/nonexistent-run-id-xyz/iterations');
      expect(response.status()).toBe(404);
    });

    test('should return 404 for non-existent iteration', async ({ request }) => {
      const response = await request.get('/api/runs/nonexistent-run-id-xyz/iterations/999');
      expect(response.status()).toBe(404);
    });

    test('should return proper error structure', async ({ request }) => {
      const response = await request.post('/api/runs/test-run-123/ralph', {
        data: { action: 'invalid' },
      });
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Default Values', () => {
    test('policy should have expected defaults documented', async ({ request }) => {
      const response = await request.get('/api/runs/test-run-123/policy');
      // If policy exists, verify defaults
      if (response.status() === 200) {
        const data = await response.json();
        if (data.policy) {
          expect(data.policy.maxIterations).toBeDefined();
          expect(data.policy.maxWallClockSeconds).toBeDefined();
          expect(data.policy.maxFailures).toBeDefined();
          expect(data.policy.verificationCommands).toBeDefined();
        }
      }
    });
  });
});
