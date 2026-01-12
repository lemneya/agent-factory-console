'use client';

/**
 * AFC-1.6: Memory Layer MVP - Policy Editor Component
 *
 * Allows editing memory policy configuration for a project.
 */

import { useEffect, useState, useCallback } from 'react';

interface MemoryPolicy {
  projectId: string;
  maxItems: number;
  maxTokensPerQuery: number;
  maxTokensTotal: number;
  enabledScopes: string[];
  enabledCategories: string[];
  defaultTtlDays: number | null;
  autoArchiveDays: number | null;
  dedupeEnabled: boolean;
  similarityThreshold: number;
  decayFactor: number;
  accessBoost: number;
}

interface BudgetStatus {
  itemCount: number;
  maxItems: number;
  tokenCount: number;
  maxTokens: number;
  utilizationPercent: number;
  nearLimit: boolean;
  atLimit: boolean;
}

interface PolicyEditorProps {
  projectId: string;
  onSave?: () => void;
}

const ALL_SCOPES = ['GLOBAL', 'PROJECT', 'RUN'];
const ALL_CATEGORIES = ['CODE', 'DOCUMENTATION', 'DECISION', 'ERROR', 'CONTEXT', 'CUSTOM'];

export default function PolicyEditor({ projectId, onSave }: PolicyEditorProps) {
  const [policy, setPolicy] = useState<MemoryPolicy | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/memory/policy?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch policy');

      const data = await res.json();
      setPolicy(data.policy);
      setBudget(data.budgetStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const handleSave = async () => {
    if (!policy) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const res = await fetch('/api/memory/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save policy');
      }

      const data = await res.json();
      setPolicy(data.policy);
      setBudget(data.budgetStatus);
      setSuccess(true);
      onSave?.();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const toggleScope = (scope: string) => {
    if (!policy) return;
    const scopes = policy.enabledScopes.includes(scope)
      ? policy.enabledScopes.filter(s => s !== scope)
      : [...policy.enabledScopes, scope];
    setPolicy({ ...policy, enabledScopes: scopes });
  };

  const toggleCategory = (category: string) => {
    if (!policy) return;
    const categories = policy.enabledCategories.includes(category)
      ? policy.enabledCategories.filter(c => c !== category)
      : [...policy.enabledCategories, category];
    setPolicy({ ...policy, enabledCategories: categories });
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="animate-pulse">
          <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-4 space-y-4">
            <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-10 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
        Failed to load policy configuration
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Memory Policy Configuration
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure memory storage limits, filtering, and scoring behavior
        </p>
      </div>

      {/* Budget Status */}
      {budget && (
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget Status
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Items</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {budget.itemCount.toLocaleString()} / {budget.maxItems.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full ${
                    budget.atLimit
                      ? 'bg-red-500'
                      : budget.nearLimit
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, (budget.itemCount / budget.maxItems) * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tokens</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {budget.tokenCount.toLocaleString()} / {budget.maxTokens.toLocaleString()}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full ${
                    budget.atLimit
                      ? 'bg-red-500'
                      : budget.nearLimit
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (budget.tokenCount / budget.maxTokens) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 p-4">
        {/* Budget Limits */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Budget Limits
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">Max Items</label>
              <input
                type="number"
                value={policy.maxItems}
                onChange={e => setPolicy({ ...policy, maxItems: parseInt(e.target.value) || 0 })}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">
                Max Tokens/Query
              </label>
              <input
                type="number"
                value={policy.maxTokensPerQuery}
                onChange={e =>
                  setPolicy({ ...policy, maxTokensPerQuery: parseInt(e.target.value) || 0 })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={100}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">
                Max Total Tokens
              </label>
              <input
                type="number"
                value={policy.maxTokensTotal}
                onChange={e =>
                  setPolicy({ ...policy, maxTokensTotal: parseInt(e.target.value) || 0 })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={1000}
              />
            </div>
          </div>
        </div>

        {/* Scope Filtering */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enabled Scopes
          </h4>
          <div className="flex flex-wrap gap-2">
            {ALL_SCOPES.map(scope => (
              <button
                key={scope}
                onClick={() => toggleScope(scope)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  policy.enabledScopes.includes(scope)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filtering */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enabled Categories
          </h4>
          <div className="flex flex-wrap gap-2">
            {ALL_CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  policy.enabledCategories.includes(category)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Scoring Settings */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Scoring Settings
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">
                Decay Factor (0-1)
              </label>
              <input
                type="number"
                value={policy.decayFactor}
                onChange={e =>
                  setPolicy({ ...policy, decayFactor: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">
                Access Boost (0-1)
              </label>
              <input
                type="number"
                value={policy.accessBoost}
                onChange={e =>
                  setPolicy({ ...policy, accessBoost: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={0}
                max={1}
                step={0.01}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={policy.dedupeEnabled}
                  onChange={e => setPolicy({ ...policy, dedupeEnabled: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Enable Deduplication
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Retention Settings */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Retention Settings
          </h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">
                Default TTL (days)
              </label>
              <input
                type="number"
                value={policy.defaultTtlDays ?? ''}
                onChange={e =>
                  setPolicy({
                    ...policy,
                    defaultTtlDays: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="No expiration"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={1}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400">
                Auto-archive after (days of no access)
              </label>
              <input
                type="number"
                value={policy.autoArchiveDays ?? ''}
                onChange={e =>
                  setPolicy({
                    ...policy,
                    autoArchiveDays: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="No auto-archive"
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                min={1}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 p-4 dark:border-gray-700">
        <div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400">Policy saved successfully</p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Policy'}
        </button>
      </div>
    </div>
  );
}
