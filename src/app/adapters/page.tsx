'use client';

/**
 * AFC-ADAPTER-4: Adapter Status UI (read-only)
 * Route: /adapters
 * 
 * Displays adapter registry + health status in a read-only operator UI
 */

import { useState, useEffect } from 'react';
import { RefreshCw, Copy, CheckCircle2, XCircle, Circle } from 'lucide-react';

interface Adapter {
  id: string;
  name: string;
  baseUrl: string;
  enabled: boolean;
  healthStatus: 'OK' | 'UNREACHABLE' | 'UNKNOWN';
  lastSeenAt: string | null;
  lastHealthCheckAt: string | null;
  lastHealthError: string | null;
}

export default function AdaptersPage() {
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const REFRESH_COOLDOWN = 5000; // 5 seconds

  const fetchAdapters = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const url = refresh 
        ? '/api/adapters/status?refresh=1' 
        : '/api/adapters/status';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch adapters');
      }

      const data = await response.json();
      setAdapters(data);
      
      if (refresh) {
        setLastRefresh(Date.now());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdapters();
  }, []);

  const handleRefresh = () => {
    const now = Date.now();
    if (now - lastRefresh < REFRESH_COOLDOWN) {
      return; // Still in cooldown
    }
    fetchAdapters(true);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'UNREACHABLE':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'UNKNOWN':
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'OK':
        return <span className="text-green-600 font-medium">✅ OK</span>;
      case 'UNREACHABLE':
        return <span className="text-red-600 font-medium">❌ UNREACHABLE</span>;
      case 'UNKNOWN':
      default:
        return <span className="text-gray-500 font-medium">⚪ UNKNOWN</span>;
    }
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  };

  const formatExactTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const truncateUrl = (url: string, maxLength = 40) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const truncateError = (error: string | null, maxLength = 120) => {
    if (!error) return null;
    if (error.length <= maxLength) return error;
    return error.substring(0, maxLength) + '...';
  };

  const canRefresh = Date.now() - lastRefresh >= REFRESH_COOLDOWN;
  const cooldownRemaining = Math.max(0, Math.ceil((REFRESH_COOLDOWN - (Date.now() - lastRefresh)) / 1000));

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Adapter Status</h1>
          <p className="text-gray-600 mt-1">Read-only view of registered adapters and their health status</p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={!canRefresh || refreshing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            canRefresh && !refreshing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!canRefresh ? `Wait ${cooldownRemaining}s` : 'Refresh health status'}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
          {!canRefresh && cooldownRemaining > 0 && (
            <span className="text-xs">({cooldownRemaining}s)</span>
          )}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-red-800 font-medium">Error loading adapters</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => fetchAdapters()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && adapters.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-700 font-medium text-lg mb-2">No adapters registered</h3>
          <p className="text-gray-600 mb-4">
            Get started by seeding the adapter registry with test data.
          </p>
          <code className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-700">
            POST /api/adapters/seed
          </code>
        </div>
      )}

      {!loading && !error && adapters.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enabled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Error
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adapters.map((adapter) => (
                  <tr key={adapter.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(adapter.healthStatus)}
                        {getStatusText(adapter.healthStatus)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{adapter.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-gray-600" title={adapter.baseUrl}>
                          {truncateUrl(adapter.baseUrl)}
                        </code>
                        <button
                          onClick={() => handleCopyUrl(adapter.baseUrl)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Copy URL"
                        >
                          {copiedUrl === adapter.baseUrl ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {adapter.enabled ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Enabled
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900" title={formatExactTime(adapter.lastSeenAt)}>
                        {formatRelativeTime(adapter.lastSeenAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {adapter.lastHealthError ? (
                        <div
                          className="text-sm text-red-600 max-w-xs"
                          title={adapter.lastHealthError}
                        >
                          {truncateError(adapter.lastHealthError)}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> This is a read-only view. Use the Refresh button to force health probes.
          Refresh has a 5-second cooldown to prevent excessive API calls.
        </p>
      </div>
    </div>
  );
}
