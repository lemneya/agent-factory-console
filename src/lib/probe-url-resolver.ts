/**
 * Probe URL Resolver
 * ROUTE-HEALTH-NET-0: Same-origin Route Health probes + localhost mismatch warning
 *
 * Provides utilities for resolving probe base URLs and detecting localhost mismatches.
 */

export interface ProbeUrlOptions {
  baseUrl?: string;
}

export interface ProbeUrlResult {
  resolvedUrl: string;
  isLocalhostMismatch: boolean;
  mismatchWarning: string | null;
}

/**
 * Checks if a hostname is a localhost variant.
 */
export function isLocalhostHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized.startsWith('localhost:')
  );
}

/**
 * Extracts hostname from a URL string.
 * Returns null if the URL is invalid.
 */
export function extractHostname(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Resolves the probe base URL.
 *
 * Rules:
 * - If baseUrl is provided and non-empty → use it
 * - Else → use window.location.origin (same-origin)
 */
export function resolveProbeBaseUrl(options: ProbeUrlOptions): string {
  if (options.baseUrl && options.baseUrl.trim()) {
    return options.baseUrl.trim();
  }

  // Default to same-origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for SSR (shouldn't happen for this client component)
  return 'http://localhost:3000';
}

/**
 * Detects if there's a localhost mismatch between the probe target and current origin.
 *
 * A mismatch occurs when:
 * - The resolved baseUrl hostname is localhost/127.0.0.1
 * - AND the current window.location.hostname is NOT localhost/127.0.0.1
 *
 * This typically happens when accessing the UI from ngrok/remote host while
 * the probe is configured to hit localhost.
 */
export function detectLocalhostMismatch(resolvedBaseUrl: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const probeHostname = extractHostname(resolvedBaseUrl);
  const currentHostname = window.location.hostname;

  if (!probeHostname) {
    return false;
  }

  const probeIsLocalhost = isLocalhostHostname(probeHostname);
  const currentIsLocalhost = isLocalhostHostname(currentHostname);

  // Mismatch: probing localhost from non-localhost origin
  return probeIsLocalhost && !currentIsLocalhost;
}

/**
 * Gets the full probe URL result including mismatch detection.
 */
export function getProbeUrlResult(options: ProbeUrlOptions): ProbeUrlResult {
  const resolvedUrl = resolveProbeBaseUrl(options);
  const isLocalhostMismatch = detectLocalhostMismatch(resolvedUrl);

  let mismatchWarning: string | null = null;
  if (isLocalhostMismatch) {
    mismatchWarning =
      'Route health is probing localhost from a non-local origin. Use same-origin or update base URL preset.';
  }

  return {
    resolvedUrl,
    isLocalhostMismatch,
    mismatchWarning,
  };
}

/**
 * Gets the network error hint text.
 * Used when probe fails with status 0 or fetch throws.
 */
export function getNetworkErrorHint(resolvedBaseUrl: string): string {
  const isLocalhostMismatch = detectLocalhostMismatch(resolvedBaseUrl);

  if (isLocalhostMismatch) {
    return 'Network error (baseUrl mismatch: probing localhost from non-local origin)';
  }

  return 'Network error (possible baseUrl mismatch)';
}
