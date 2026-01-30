import crypto from 'crypto';

/**
 * AFC-PROOFPACK-0: Deterministic Hashing Utility
 *
 * Provides stable, reproducible hashes for proof pack verification.
 * Same input always produces same hash, regardless of key ordering.
 */

/**
 * Canonicalize an object for deterministic hashing.
 * Sorts object keys alphabetically at all nesting levels.
 */
export function canonicalize(obj: unknown): string {
  const sort = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      return Object.keys(v as Record<string, unknown>)
        .sort()
        .reduce((acc: Record<string, unknown>, k) => {
          acc[k] = sort((v as Record<string, unknown>)[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return JSON.stringify(sort(obj));
}

/**
 * Generate SHA-256 hash of canonicalized input.
 * Returns format: "sha256:<hex>"
 */
export function sha256(input: unknown): string {
  return 'sha256:' + crypto.createHash('sha256').update(canonicalize(input)).digest('hex');
}

/**
 * Verify a hash matches expected input.
 */
export function verifyHash(input: unknown, expectedHash: string): boolean {
  return sha256(input) === expectedHash;
}
