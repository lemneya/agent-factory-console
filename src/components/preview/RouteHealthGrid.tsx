'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { NAV_ITEMS, type NavItem } from '@/config/nav';

interface RouteHealth {
  path: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  redirected?: boolean;
  redirectUrl?: string;
  error?: string;
  headers?: Record<string, string>;
  contentType?: string;
  contentLength?: number;
}

interface RouteHealthGridProps {
  onRouteSelect: (path: string) => void;
  baseUrl?: string; // Optional custom base URL for preset support
}

function getStatusIcon(health: RouteHealth | null): string {
  if (!health) return '⏳';
  if (health.status === 200) return '✅';
  // Redirect to auth
  if (health.redirected && health.redirectUrl) {
    const url = health.redirectUrl.toLowerCase();
    if (url.includes('/login') || url.includes('/signin') || url.includes('/auth')) {
      return '🔒';
    }
  }
  // Other redirects
  if (health.redirected) return '↪️';
  if (health.status === 401 || health.status === 403) return '🔒';
  if (health.status === 404) return '⚠️';
  if (health.status >= 500) return '❌';
  if (health.status === 0 || health.error) return '❌';
  return '⚠️';
}

function getStatusColor(health: RouteHealth | null): string {
  if (!health) return 'text-gray-400';
  if (health.status === 200) return 'text-green-600';
  // Redirect to auth
  if (health.redirected && health.redirectUrl) {
    const url = health.redirectUrl.toLowerCase();
    if (url.includes('/login') || url.includes('/signin') || url.includes('/auth')) {
      return 'text-yellow-600';
    }
  }
  // Other redirects (considered ok)
  if (health.redirected) return 'text-blue-600';
  if (health.status === 401 || health.status === 403) return 'text-yellow-600';
  if (health.status === 404) return 'text-orange-500';
  if (health.status >= 500 || health.status === 0 || health.error) return 'text-red-600';
  return 'text-yellow-600';
}

function getStatusLabel(health: RouteHealth | null): string {
  if (!health) return '...';
  if (health.error) return 'Error';
  if (health.redirected) {
    if (health.redirectUrl) {
      const url = health.redirectUrl.toLowerCase();
      if (url.includes('/login') || url.includes('/signin') || url.includes('/auth')) {
        return `${health.status} → Auth`;
      }
    }
    return `${health.status} →`;
  }
  return String(health.status);
}

function getLatencyColor(latencyMs: number): string {
  if (latencyMs < 100) return 'text-green-600';
  if (latencyMs < 300) return 'text-yellow-600';
  return 'text-red-600';
}

export function RouteHealthGrid({ onRouteSelect, baseUrl }: RouteHealthGridProps) {
  const [healthMap, setHealthMap] = useState<Record<string, RouteHealth | null>>({});
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const isMounted = useRef(true);

  const navItems = NAV_ITEMS;

  const toggleExpanded = (key: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const checkRouteHealth = useCallback(
    async (item: NavItem): Promise<RouteHealth | null> => {
      try {
        const response = await fetch('/api/preview/route-health', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: item.href,
            baseUrl: baseUrl || undefined,
          }),
        });
        return (await response.json()) as RouteHealth;
      } catch {
        return {
          path: item.href,
          status: 0,
          ok: false,
          latencyMs: 0,
          error: 'Failed to check route',
        };
      }
    },
    [baseUrl]
  );

  const refreshAll = useCallback(async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    const results: Record<string, RouteHealth | null> = {};

    // Check all routes in parallel
    const promises = navItems.map(async (item: NavItem) => {
      const health = await checkRouteHealth(item);
      results[item.key] = health;
    });

    await Promise.all(promises);

    // Only update state if component is still mounted
    if (isMounted.current) {
      setHealthMap(results);
      setLastRefresh(new Date());
      setIsLoading(false);
    }
  }, [navItems, checkRouteHealth]);

  // Initial load and auto-refresh every 30 seconds
  useEffect(() => {
    isMounted.current = true;

    // Use setTimeout to avoid synchronous setState in effect
    const initialTimeout = setTimeout(() => {
      refreshAll();
    }, 0);

    const interval = setInterval(refreshAll, 30000);

    return () => {
      isMounted.current = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [refreshAll]);

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      data-testid="route-health-grid"
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Route Health</h3>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-gray-500">Last: {lastRefresh.toLocaleTimeString()}</span>
          )}
          <button
            onClick={refreshAll}
            disabled={isLoading}
            className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
            data-testid="route-health-refresh"
          >
            {isLoading ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {navItems.map((item: NavItem) => {
          const health = healthMap[item.key];
          const isExpanded = expandedRows.has(item.key);
          return (
            <div key={item.key} data-testid={`route-row-${item.key}`}>
              <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  {/* Expand/collapse button */}
                  <button
                    onClick={() => toggleExpanded(item.key)}
                    className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
                    data-testid={`route-expand-${item.key}`}
                    title={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    <svg
                      className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                  <span className={`text-lg ${getStatusColor(health)}`}>
                    {getStatusIcon(health)}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </div>
                    <div className="text-xs text-gray-500">{item.href}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(health)}`}>
                      {getStatusLabel(health)}
                    </div>
                    <div
                      className={`text-xs ${health ? getLatencyColor(health.latencyMs) : 'text-gray-500'}`}
                    >
                      {health ? `${health.latencyMs}ms` : '-'}
                    </div>
                  </div>
                  <button
                    onClick={() => onRouteSelect(item.href)}
                    className="group relative rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    data-testid={`route-open-${item.key}`}
                  >
                    Open
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
                      Load in iframe
                    </span>
                  </button>
                </div>
              </div>
              {/* Expanded details panel */}
              {isExpanded && health && (
                <div
                  className="border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/50"
                  data-testid={`route-details-${item.key}`}
                >
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`ml-2 ${getStatusColor(health)}`}>{health.status}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500 dark:text-gray-400">Latency:</span>
                      <span className={`ml-2 ${getLatencyColor(health.latencyMs)}`}>
                        {health.latencyMs}ms
                      </span>
                    </div>
                    {health.redirected && health.redirectUrl && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          Redirect URL:
                        </span>
                        <span className="ml-2 break-all text-gray-700 dark:text-gray-300">
                          {health.redirectUrl}
                        </span>
                      </div>
                    )}
                    {health.error && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-500 dark:text-gray-400">Error:</span>
                        <span className="ml-2 text-red-600 dark:text-red-400">{health.error}</span>
                      </div>
                    )}
                    {health.contentType && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-500 dark:text-gray-400">
                          Content-Type:
                        </span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {health.contentType}
                        </span>
                      </div>
                    )}
                    {health.contentLength !== undefined && (
                      <div>
                        <span className="font-medium text-gray-500 dark:text-gray-400">Size:</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                          {health.contentLength > 1024
                            ? `${(health.contentLength / 1024).toFixed(1)}KB`
                            : `${health.contentLength}B`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>✅ 200</span>
          <span>🔒 Auth</span>
          <span>↪️ Redirect</span>
          <span>⚠️ 404</span>
          <span>❌ Error</span>
        </div>
      </div>
    </div>
  );
}
