'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRouteHealthItems, type NavItem } from '@/config/nav';

interface RouteHealth {
  path: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

interface RouteHealthGridProps {
  onRouteSelect: (path: string) => void;
}

function getStatusIcon(health: RouteHealth | null): string {
  if (!health) return '⏳';
  if (health.status === 200) return '✅';
  if (health.status === 401 || health.status === 403) return '🔒';
  if (health.status === 404) return '⚠️';
  if (health.status >= 500) return '❌';
  if (health.status === 0 || health.error) return '❌';
  return '⚠️';
}

function getStatusColor(health: RouteHealth | null): string {
  if (!health) return 'text-gray-400';
  if (health.status === 200) return 'text-green-600';
  if (health.status === 401 || health.status === 403) return 'text-yellow-600';
  if (health.status === 404) return 'text-orange-500';
  if (health.status >= 500 || health.status === 0 || health.error) return 'text-red-600';
  return 'text-yellow-600';
}

export function RouteHealthGrid({ onRouteSelect }: RouteHealthGridProps) {
  const [healthMap, setHealthMap] = useState<Record<string, RouteHealth | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const isMounted = useRef(true);

  const navItems = getRouteHealthItems();

  const checkRouteHealth = useCallback(async (item: NavItem): Promise<RouteHealth | null> => {
    try {
      const response = await fetch('/api/preview/route-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: item.href }),
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
  }, []);

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
          >
            {isLoading ? 'Checking...' : 'Refresh'}
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {navItems.map(item => {
          const health = healthMap[item.key];
          return (
            <div
              key={item.key}
              data-testid={`route-row-${item.key}`}
              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg ${getStatusColor(health)}`}>{getStatusIcon(health)}</span>
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
                    {health ? (health.error ? 'Error' : health.status) : '...'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {health ? `${health.latencyMs}ms` : '-'}
                  </div>
                </div>
                <button
                  onClick={() => onRouteSelect(item.href)}
                  className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  Open
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
