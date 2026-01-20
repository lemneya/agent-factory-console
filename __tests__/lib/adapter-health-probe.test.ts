/**
 * AFC-ADAPTER-3: Adapter Health Probe Tests
 */

import {
  probeAdapterHealth,
  truncateError,
  HEALTH_PROBE_TIMEOUT_MS,
  MAX_ERROR_LENGTH,
  type AdapterForProbe,
} from '@/lib/adapter-health-probe';

// Mock fetch globally
const originalFetch = global.fetch;

describe('Adapter Health Probe', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  describe('truncateError', () => {
    it('should return short errors unchanged', () => {
      const error = 'Short error';
      expect(truncateError(error)).toBe(error);
    });

    it('should truncate long errors with ellipsis', () => {
      const longError = 'a'.repeat(600);
      const result = truncateError(longError);
      expect(result.length).toBe(MAX_ERROR_LENGTH);
      expect(result.endsWith('...')).toBe(true);
    });

    it('should handle exactly max length', () => {
      const exactError = 'a'.repeat(MAX_ERROR_LENGTH);
      expect(truncateError(exactError)).toBe(exactError);
    });
  });

  describe('probeAdapterHealth', () => {
    const enabledAdapter: AdapterForProbe = {
      id: 'test-id',
      name: 'test-adapter',
      baseUrl: 'http://localhost:8123',
      enabled: true,
    };

    const disabledAdapter: AdapterForProbe = {
      ...enabledAdapter,
      enabled: false,
    };

    it('should return UNKNOWN for disabled adapters (skipped)', async () => {
      const result = await probeAdapterHealth(disabledAdapter);

      expect(result.status).toBe('UNKNOWN');
      expect(result.error).toBeNull();
      expect(result.latencyMs).toBe(0);
    });

    it('should return OK for HTTP 200 response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        type: 'basic',
      });

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('OK');
      expect(result.error).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8123/health',
        expect.objectContaining({
          method: 'GET',
          redirect: 'manual',
        })
      );
    });

    it('should return UNREACHABLE for non-200 HTTP response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 500,
        type: 'basic',
      });

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toBe('HTTP 500');
    });

    it('should return UNREACHABLE for HTTP 404', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 404,
        type: 'basic',
      });

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toBe('HTTP 404');
    });

    it('should return UNREACHABLE for redirect responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 302,
        type: 'opaqueredirect',
      });

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toContain('Redirect');
    });

    it('should return UNREACHABLE for timeout (AbortError)', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      global.fetch = jest.fn().mockRejectedValue(abortError);

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(HEALTH_PROBE_TIMEOUT_MS + 100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toContain('Timeout');
      expect(result.error).toContain(`${HEALTH_PROBE_TIMEOUT_MS}ms`);
    });

    it('should return UNREACHABLE for connection refused', async () => {
      const connError = new Error('connect ECONNREFUSED 127.0.0.1:8123');
      global.fetch = jest.fn().mockRejectedValue(connError);

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toBe('Connection refused');
    });

    it('should return UNREACHABLE for DNS resolution failure', async () => {
      const dnsError = new Error('getaddrinfo ENOTFOUND unknown-host.local');
      global.fetch = jest.fn().mockRejectedValue(dnsError);

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toBe('DNS resolution failed');
    });

    it('should handle baseUrl with trailing slash', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        status: 200,
        type: 'basic',
      });

      const adapterWithSlash: AdapterForProbe = {
        ...enabledAdapter,
        baseUrl: 'http://localhost:8123/',
      };

      const resultPromise = probeAdapterHealth(adapterWithSlash);
      jest.advanceTimersByTime(100);
      await resultPromise;

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:8123/health', expect.anything());
    });

    it('should handle unknown errors gracefully', async () => {
      global.fetch = jest.fn().mockRejectedValue('string error');

      const resultPromise = probeAdapterHealth(enabledAdapter);
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.status).toBe('UNREACHABLE');
      expect(result.error).toBe('Unknown error');
    });
  });
});
