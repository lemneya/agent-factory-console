'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { getRouteHealthItems, type NavItem } from '@/config/nav';
import {
  classifyRouteHealth,
  getStatusIcon,
  getStatusLabel,
  getStatusColorClass,
  getStatusTooltip,
  type RouteHealthData,
} from '@/lib/route-health-classifier';
import {
  getProbeUrlResult,
  getNetworkErrorHint,
} from '@/lib/probe-url-resolver';

interface RouteHealth extends RouteHealthData {
  path: string;
  latencyMs: number;
  headers?: Record<string, string>;
  contentType?: string;
  contentLength?: number;
}

interface RouteHealthGridProps {
  onRouteSelect: (path: string) => void;
  baseUrl?: string; // Optional custom base URL for preset support
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

  const navItems = getRouteHealthItems();

  // ROUTE-HEALTH-NET-0: Resolve probe URL and detect localhost mismatch
  const probeUrlResult = useMemo(
    () => getProbeUrlResult({ baseUrl }),
    [baseUrl]
  );

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
            // ROUTE-HEALTH-NET-0: Use resolved URL (same-origin by default)
            baseUrl: probeUrlResult.resolvedUrl,
          }),
        });
        return (await response.json()) as RouteHealth;
      } catch {
        // ROUTE-HEALTH-NET-0: Enhanced network error hint
        return {
          path: item.href,
          status: 0,
          ok: false,
          latencyMs: 0,
          error: getNetworkErrorHint(probeUrlResult.resolvedUrl),
        };
      }
    },
    [probeUrlResult.resolvedUrl]
  );

  const refreshAll = useCallback(async () => {
    if (!isMounted.current) return;
    setIsLoading(true);
    const results: Record<string, RouteHealth | null> = {};

    // Check all routes in parallel
    const promises = navItems.map(async item => {
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
      {/* ROUTE-HEALTH-NET-0: Localhost mismatch warning */}
      {probeUrlResult.isLocalhostMismatch && (
        <div
          className="border-b border-yellow-200 bg-yellow-50 px-4 py-2 dark:border-yellow-800 dark:bg-yellow-900/20"
          data-testid="localhost-mismatch-warning"
        >
          <div className="flex items-start gap-2">
            <span className="text-yellow-600 dark:text-yellow-400">⚠️</span>
            <div>
              <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300">
                {probeUrlResult.mismatchWarning}
              </p>
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                Target: <code className="rounded bg-yellow-100 px-1 dark:bg-yellow-800">{probeUrlResult.resolvedUrl}</code>
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {navItems.map(item => {
          const health = healthMap[item.key];
          const isExpanded = expandedRows.has(item.key);
          const status = classifyRouteHealth(health);
          const icon = getStatusIcon(status);
          const label = getStatusLabel(status);
          const colorClass = getStatusColorClass(status);
          const tooltip = getStatusTooltip(status);

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
                  <span
                    className={`text-lg ${colorClass}`}
                    title={tooltip || undefined}
                    data-testid={`route-status-icon-${item.key}`}
                  >
                    {icon}
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
                    <div
                      className={`text-sm font-medium ${colorClass}`}
                      data-testid={`route-status-label-${item.key}`}
                    >
                      {label}
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
                      <span className={`ml-2 ${colorClass}`}>{health.status}</span>
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
          <span>✅ Healthy</span>
          <span>🔒 Auth required</span>
          <span>❌ Error</span>
        </div>
      </div>
    </div>
  );
}
