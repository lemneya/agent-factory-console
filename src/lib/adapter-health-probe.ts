/**
 * AFC-ADAPTER-3: Adapter Health Probe
 *
 * Timeout-bounded health check for registered adapters.
 * Probes GET ${baseUrl}/health with strict timeout and no redirect following.
 */

export type HealthStatus = 'UNKNOWN' | 'OK' | 'UNREACHABLE';

export interface HealthProbeResult {
  status: HealthStatus;
  error: string | null;
  latencyMs: number;
}

export interface AdapterForProbe {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
}

/** Hard timeout for health probes (ms) */
export const HEALTH_PROBE_TIMEOUT_MS = 1500;

/** Max error message length stored in DB */
export const MAX_ERROR_LENGTH = 500;

/**
 * Truncates error message to max length.
 */
export function truncateError(error: string): string {
  if (error.length <= MAX_ERROR_LENGTH) {
    return error;
  }
  return error.slice(0, MAX_ERROR_LENGTH - 3) + '...';
}

/**
 * Probes a single adapter's health endpoint.
 *
 * Rules:
 * - Request: GET ${baseUrl}/health
 * - Timeout: 1500ms hard
 * - Do not follow redirects (treat as UNREACHABLE)
 * - HTTP 200 → OK
 * - Anything else → UNREACHABLE
 */
export async function probeAdapterHealth(adapter: AdapterForProbe): Promise<HealthProbeResult> {
  // Skip disabled adapters
  if (!adapter.enabled) {
    return {
      status: 'UNKNOWN',
      error: null,
      latencyMs: 0,
    };
  }

  const startTime = Date.now();
  const healthUrl = `${adapter.baseUrl.replace(/\/$/, '')}/health`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS);

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'manual', // Don't follow redirects
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // Redirect is treated as UNREACHABLE (masks failures)
    if (response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
      return {
        status: 'UNREACHABLE',
        error: truncateError(`Redirect response (${response.status})`),
        latencyMs,
      };
    }

    // Only HTTP 200 is considered OK
    if (response.status === 200) {
      return {
        status: 'OK',
        error: null,
        latencyMs,
      };
    }

    // Any other status is UNREACHABLE
    return {
      status: 'UNREACHABLE',
      error: truncateError(`HTTP ${response.status}`),
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    let errorMessage: string;

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        errorMessage = `Timeout after ${HEALTH_PROBE_TIMEOUT_MS}ms`;
      } else if (err.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused';
      } else if (err.message.includes('ENOTFOUND') || err.message.includes('getaddrinfo')) {
        errorMessage = 'DNS resolution failed';
      } else {
        errorMessage = err.message;
      }
    } else {
      errorMessage = 'Unknown error';
    }

    return {
      status: 'UNREACHABLE',
      error: truncateError(errorMessage),
      latencyMs,
    };
  }
}

/**
 * Probes multiple adapters in parallel and returns results.
 */
export async function probeAllAdapters(
  adapters: AdapterForProbe[]
): Promise<Map<string, HealthProbeResult>> {
  const results = new Map<string, HealthProbeResult>();

  const probePromises = adapters.map(async adapter => {
    const result = await probeAdapterHealth(adapter);
    results.set(adapter.id, result);
  });

  await Promise.all(probePromises);
  return results;
}
