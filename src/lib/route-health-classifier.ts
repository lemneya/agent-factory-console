/**
 * Route Health Status Classifier
 * AFC-AUTH-UI-1: Auth-aware Route Health (401/403 → Lock)
 *
 * Classifies route health probe outcomes into meaningful statuses.
 */

export type RouteHealthStatus = 'HEALTHY' | 'AUTH_REQUIRED' | 'ERROR' | 'LOADING';

export interface RouteHealthData {
  status: number;
  ok: boolean;
  error?: string;
  redirected?: boolean;
  redirectUrl?: string;
}

/**
 * Classifies a route health probe result into a status category.
 *
 * Classification logic:
 * - status === 200 → HEALTHY
 * - status === 401 || status === 403 → AUTH_REQUIRED
 * - status === 404 → ERROR
 * - status >= 500 → ERROR
 * - fetch/network/timeout (status === 0 or error present) → ERROR
 * - Redirect to auth URL → AUTH_REQUIRED
 */
export function classifyRouteHealth(health: RouteHealthData | null): RouteHealthStatus {
  if (!health) {
    return 'LOADING';
  }

  // Network error, timeout, or fetch failure
  if (health.status === 0 || health.error) {
    return 'ERROR';
  }

  // Success
  if (health.status === 200) {
    return 'HEALTHY';
  }

  // Auth required (401 Unauthorized, 403 Forbidden)
  if (health.status === 401 || health.status === 403) {
    return 'AUTH_REQUIRED';
  }

  // Redirect to auth URL
  if (health.redirected && health.redirectUrl) {
    const url = health.redirectUrl.toLowerCase();
    if (
      url.includes('/login') ||
      url.includes('/signin') ||
      url.includes('/auth') ||
      url.includes('/api/auth')
    ) {
      return 'AUTH_REQUIRED';
    }
  }

  // Not Found
  if (health.status === 404) {
    return 'ERROR';
  }

  // Server errors
  if (health.status >= 500) {
    return 'ERROR';
  }

  // Other 2xx/3xx statuses are considered healthy
  if (health.status >= 200 && health.status < 400) {
    return 'HEALTHY';
  }

  // Any other 4xx is an error
  return 'ERROR';
}

/**
 * Returns the icon for a route health status.
 */
export function getStatusIcon(status: RouteHealthStatus): string {
  switch (status) {
    case 'HEALTHY':
      return '✅';
    case 'AUTH_REQUIRED':
      return '🔒';
    case 'ERROR':
      return '❌';
    case 'LOADING':
      return '⏳';
  }
}

/**
 * Returns the display label for a route health status.
 */
export function getStatusLabel(status: RouteHealthStatus): string {
  switch (status) {
    case 'HEALTHY':
      return 'Healthy';
    case 'AUTH_REQUIRED':
      return 'Auth required';
    case 'ERROR':
      return 'Error';
    case 'LOADING':
      return '...';
  }
}

/**
 * Returns the CSS color class for a route health status.
 */
export function getStatusColorClass(status: RouteHealthStatus): string {
  switch (status) {
    case 'HEALTHY':
      return 'text-green-600';
    case 'AUTH_REQUIRED':
      return 'text-yellow-600';
    case 'ERROR':
      return 'text-red-600';
    case 'LOADING':
      return 'text-gray-400';
  }
}

/**
 * Returns the tooltip text for a route health status.
 */
export function getStatusTooltip(status: RouteHealthStatus): string | null {
  switch (status) {
    case 'AUTH_REQUIRED':
      return 'Sign in to check this route.';
    default:
      return null;
  }
}
