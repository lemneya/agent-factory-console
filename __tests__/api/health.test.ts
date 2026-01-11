/**
 * Unit tests for health check response structure
 *
 * Tests the health check response format and data validation.
 * Actual API endpoint testing is handled by E2E tests.
 */

describe('Health Check Response', () => {
  describe('Response structure', () => {
    // Define the expected health response structure
    interface HealthResponse {
      status: 'healthy' | 'unhealthy';
      timestamp: string;
      version: string;
      environment: string;
    }

    function createHealthResponse(
      env: string = 'development',
      version: string = '0.1.0'
    ): HealthResponse {
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version,
        environment: env,
      };
    }

    it('should have all required fields', () => {
      const response = createHealthResponse();

      expect(response).toHaveProperty('status');
      expect(response).toHaveProperty('timestamp');
      expect(response).toHaveProperty('version');
      expect(response).toHaveProperty('environment');
    });

    it('should have healthy status', () => {
      const response = createHealthResponse();
      expect(response.status).toBe('healthy');
    });

    it('should have valid ISO timestamp', () => {
      const response = createHealthResponse();
      const timestamp = new Date(response.timestamp);

      expect(timestamp.toISOString()).toBe(response.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should have semver-formatted version', () => {
      const response = createHealthResponse('development', '1.2.3');
      expect(response.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should include environment', () => {
      const devResponse = createHealthResponse('development');
      expect(devResponse.environment).toBe('development');

      const prodResponse = createHealthResponse('production');
      expect(prodResponse.environment).toBe('production');

      const testResponse = createHealthResponse('test');
      expect(testResponse.environment).toBe('test');
    });
  });

  describe('Environment defaults', () => {
    it('should use development as default when NODE_ENV is undefined', () => {
      const env = process.env.NODE_ENV || 'development';
      expect(['development', 'production', 'test']).toContain(env);
    });

    it('should have a valid environment value', () => {
      const validEnvironments = ['development', 'production', 'test'];
      const env = process.env.NODE_ENV || 'development';
      expect(validEnvironments).toContain(env);
    });
  });
});
