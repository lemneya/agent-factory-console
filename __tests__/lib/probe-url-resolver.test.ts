/**
 * Probe URL Resolver Tests
 * ROUTE-HEALTH-NET-0: Same-origin Route Health probes + localhost mismatch warning
 */

import {
  isLocalhostHostname,
  extractHostname,
  resolveProbeBaseUrl,
  detectLocalhostMismatch,
  getProbeUrlResult,
  getNetworkErrorHint,
} from '@/lib/probe-url-resolver';

describe('Probe URL Resolver', () => {
  // Save original window.location
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset window mock before each test
    // @ts-expect-error - mocking window
    delete global.window;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  describe('isLocalhostHostname', () => {
    it('should return true for "localhost"', () => {
      expect(isLocalhostHostname('localhost')).toBe(true);
    });

    it('should return true for "127.0.0.1"', () => {
      expect(isLocalhostHostname('127.0.0.1')).toBe(true);
    });

    it('should return true for "0.0.0.0"', () => {
      expect(isLocalhostHostname('0.0.0.0')).toBe(true);
    });

    it('should return true for "::1" (IPv6 localhost)', () => {
      expect(isLocalhostHostname('::1')).toBe(true);
    });

    it('should return true for "LOCALHOST" (case insensitive)', () => {
      expect(isLocalhostHostname('LOCALHOST')).toBe(true);
    });

    it('should return false for external hostname', () => {
      expect(isLocalhostHostname('example.com')).toBe(false);
    });

    it('should return false for ngrok hostname', () => {
      expect(isLocalhostHostname('abc123.ngrok.io')).toBe(false);
    });

    it('should return false for IP address that is not localhost', () => {
      expect(isLocalhostHostname('192.168.1.1')).toBe(false);
    });
  });

  describe('extractHostname', () => {
    it('should extract hostname from valid URL', () => {
      expect(extractHostname('http://localhost:3000/path')).toBe('localhost');
    });

    it('should extract hostname from HTTPS URL', () => {
      expect(extractHostname('https://example.com/api')).toBe('example.com');
    });

    it('should extract hostname from URL with port', () => {
      expect(extractHostname('http://127.0.0.1:8080')).toBe('127.0.0.1');
    });

    it('should return null for invalid URL', () => {
      expect(extractHostname('not-a-url')).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(extractHostname('')).toBe(null);
    });
  });

  describe('resolveProbeBaseUrl', () => {
    it('should return provided baseUrl when non-empty', () => {
      expect(resolveProbeBaseUrl({ baseUrl: 'http://custom.com' })).toBe('http://custom.com');
    });

    it('should trim whitespace from provided baseUrl', () => {
      expect(resolveProbeBaseUrl({ baseUrl: '  http://custom.com  ' })).toBe('http://custom.com');
    });

    it('should return window.location.origin when baseUrl is empty', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { origin: 'http://test-origin.com' } };
      expect(resolveProbeBaseUrl({ baseUrl: '' })).toBe('http://test-origin.com');
    });

    it('should return window.location.origin when baseUrl is undefined', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { origin: 'http://test-origin.com' } };
      expect(resolveProbeBaseUrl({})).toBe('http://test-origin.com');
    });

    it('should return fallback when window is undefined (SSR)', () => {
      expect(resolveProbeBaseUrl({})).toBe('http://localhost:3000');
    });

    it('should prefer provided baseUrl over window.location.origin', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { origin: 'http://window-origin.com' } };
      expect(resolveProbeBaseUrl({ baseUrl: 'http://custom.com' })).toBe('http://custom.com');
    });
  });

  describe('detectLocalhostMismatch', () => {
    it('should return true when probing localhost from non-localhost origin', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'abc123.ngrok.io' } };
      expect(detectLocalhostMismatch('http://localhost:3000')).toBe(true);
    });

    it('should return true when probing 127.0.0.1 from non-localhost origin', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'example.com' } };
      expect(detectLocalhostMismatch('http://127.0.0.1:3000')).toBe(true);
    });

    it('should return false when probing localhost from localhost', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'localhost' } };
      expect(detectLocalhostMismatch('http://localhost:3000')).toBe(false);
    });

    it('should return false when probing 127.0.0.1 from 127.0.0.1', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: '127.0.0.1' } };
      expect(detectLocalhostMismatch('http://127.0.0.1:3000')).toBe(false);
    });

    it('should return false when probing external URL from non-localhost', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'abc123.ngrok.io' } };
      expect(detectLocalhostMismatch('https://abc123.ngrok.io')).toBe(false);
    });

    it('should return false when probing external URL from localhost', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'localhost' } };
      expect(detectLocalhostMismatch('https://example.com')).toBe(false);
    });

    it('should return false when window is undefined (SSR)', () => {
      expect(detectLocalhostMismatch('http://localhost:3000')).toBe(false);
    });

    it('should return false for invalid URL', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'example.com' } };
      expect(detectLocalhostMismatch('not-a-valid-url')).toBe(false);
    });
  });

  describe('getProbeUrlResult', () => {
    it('should return mismatch warning when localhost mismatch detected', () => {
      // @ts-expect-error - mocking window
      global.window = {
        location: { origin: 'https://abc123.ngrok.io', hostname: 'abc123.ngrok.io' },
      };
      const result = getProbeUrlResult({ baseUrl: 'http://localhost:3000' });

      expect(result.resolvedUrl).toBe('http://localhost:3000');
      expect(result.isLocalhostMismatch).toBe(true);
      expect(result.mismatchWarning).toContain('probing localhost from a non-local origin');
    });

    it('should return no warning when same-origin is used', () => {
      // @ts-expect-error - mocking window
      global.window = {
        location: { origin: 'https://abc123.ngrok.io', hostname: 'abc123.ngrok.io' },
      };
      const result = getProbeUrlResult({});

      expect(result.resolvedUrl).toBe('https://abc123.ngrok.io');
      expect(result.isLocalhostMismatch).toBe(false);
      expect(result.mismatchWarning).toBe(null);
    });

    it('should return no warning when on localhost probing localhost', () => {
      // @ts-expect-error - mocking window
      global.window = {
        location: { origin: 'http://localhost:3000', hostname: 'localhost' },
      };
      const result = getProbeUrlResult({ baseUrl: 'http://localhost:3000' });

      expect(result.resolvedUrl).toBe('http://localhost:3000');
      expect(result.isLocalhostMismatch).toBe(false);
      expect(result.mismatchWarning).toBe(null);
    });
  });

  describe('getNetworkErrorHint', () => {
    it('should return specific hint when localhost mismatch detected', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'abc123.ngrok.io' } };
      const hint = getNetworkErrorHint('http://localhost:3000');

      expect(hint).toContain('baseUrl mismatch');
      expect(hint).toContain('probing localhost from non-local origin');
    });

    it('should return generic hint when no mismatch', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'localhost' } };
      const hint = getNetworkErrorHint('http://localhost:3000');

      expect(hint).toBe('Network error (possible baseUrl mismatch)');
    });

    it('should return generic hint for external URL from non-localhost', () => {
      // @ts-expect-error - mocking window
      global.window = { location: { hostname: 'abc123.ngrok.io' } };
      const hint = getNetworkErrorHint('https://api.example.com');

      expect(hint).toBe('Network error (possible baseUrl mismatch)');
    });
  });
});
