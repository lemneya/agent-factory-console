import crypto from 'crypto';

/**
 * AFC-PROOFPACK-EMIT-1: ID Generation Utilities
 *
 * Non-deterministic IDs for identification purposes.
 * (Decision hashes remain deterministic for verification.)
 */

/**
 * Generate a random ID with a given prefix.
 * Format: <prefix>_<24 hex characters>
 */
export function randomId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}
