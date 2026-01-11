/**
 * Unit tests for GitHub webhook signature verification
 *
 * Tests the cryptographic signature verification used to
 * validate incoming GitHub webhook requests.
 */

import * as crypto from 'crypto';

/**
 * Verify webhook signature - mirrors the implementation in lib/github/client.ts
 * Defined inline to avoid ESM module issues with octokit during testing
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

describe('GitHub Webhook Signature Verification', () => {
  const secret = 'test-webhook-secret';

  // Helper to create a valid signature
  function createSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    return 'sha256=' + hmac.update(payload).digest('hex');
  }

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', () => {
      const payload = JSON.stringify({ event: 'push', data: 'test' });
      const signature = createSignature(payload, secret);

      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = JSON.stringify({ event: 'push', data: 'test' });
      const invalidSignature = 'sha256=invalid123';

      expect(verifyWebhookSignature(payload, invalidSignature, secret)).toBe(false);
    });

    it('should return false for signature with wrong secret', () => {
      const payload = JSON.stringify({ event: 'push', data: 'test' });
      const signature = createSignature(payload, 'wrong-secret');

      expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
    });

    it('should return false for tampered payload', () => {
      const originalPayload = JSON.stringify({ event: 'push', data: 'test' });
      const tamperedPayload = JSON.stringify({ event: 'push', data: 'tampered' });
      const signature = createSignature(originalPayload, secret);

      expect(verifyWebhookSignature(tamperedPayload, signature, secret)).toBe(false);
    });

    it('should handle empty payload', () => {
      const payload = '';
      const signature = createSignature(payload, secret);

      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should return false for signatures with different length (timing attack prevention)', () => {
      const payload = JSON.stringify({ event: 'push' });
      const shortSignature = 'sha256=abc';

      expect(verifyWebhookSignature(payload, shortSignature, secret)).toBe(false);
    });

    it('should handle special characters in payload', () => {
      const payload = JSON.stringify({
        message: 'Hello "World"! <script>alert("xss")</script>',
        unicode: 'emoji test',
      });
      const signature = createSignature(payload, secret);

      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should handle large payloads', () => {
      const payload = JSON.stringify({
        data: 'x'.repeat(100000),
      });
      const signature = createSignature(payload, secret);

      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('should be case-sensitive for signatures', () => {
      const payload = JSON.stringify({ event: 'push' });
      const signature = createSignature(payload, secret);
      const upperSignature = signature.toUpperCase();

      expect(verifyWebhookSignature(payload, upperSignature, secret)).toBe(false);
    });
  });
});
