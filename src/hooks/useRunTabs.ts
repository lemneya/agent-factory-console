'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export type RunTab = 'spec' | 'decisions' | 'copilot' | 'execution';

interface Task {
  id: string;
  status: string;
  hitlJson?: unknown;
}

interface UseRunTabsOptions {
  runId: string;
  tasks: Task[];
  specPresent?: boolean;
}

interface UseRunTabsResult {
  tab: RunTab;
  setTab: (tab: RunTab) => void;
  hasBlockedTasks: boolean;
}

const VALID_TABS: RunTab[] = ['spec', 'decisions', 'copilot', 'execution'];
const STORAGE_KEY_PREFIX = 'afc-run-tab-';

function isValidTab(tab: string | null): tab is RunTab {
  return tab !== null && VALID_TABS.includes(tab as RunTab);
}

function getStorageKey(runId: string): string {
  return `${STORAGE_KEY_PREFIX}${runId}`;
}

function getInitialTab(
  searchParams: URLSearchParams,
  runId: string,
  hasBlockedTasks: boolean,
  specPresent: boolean
): RunTab {
  // If blocked tasks exist, always default to decisions
  if (hasBlockedTasks) return 'decisions';

  // Check URL param first
  const urlTab = searchParams.get('tab');
  if (isValidTab(urlTab)) return urlTab;

  // Check localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(getStorageKey(runId));
    if (isValidTab(stored)) return stored;
  }

  // Use dynamic default
  if (!specPresent) return 'spec';
  return 'execution';
}

/**
 * useRunTabs - Hook for managing run detail page tabs with dynamic defaults
 *
 * Dynamic default logic:
 * 1. If any task has status === "BLOCKED" → effective tab is Decisions
 * 2. Else if spec is missing → default to Spec
 * 3. Else → default to Execution
 *
 * URL/persistence:
 * - Uses query param: ?tab=spec|decisions|copilot|execution
 * - Persists last selected tab in localStorage keyed by runId
 * - BUT: if run has BLOCKED tasks, effective tab is always decisions
 */
export function useRunTabs({ runId, tasks, specPresent = false }: UseRunTabsOptions): UseRunTabsResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Check for blocked tasks (BLOCKED or BLOCKED_HITL)
  const hasBlockedTasks = useMemo(
    () => tasks.some((t) => t.status === 'BLOCKED' || t.status === 'BLOCKED_HITL'),
    [tasks]
  );

  // Initialize stored tab state (user's preference, may be overridden by blocked state)
  const [storedTab, setStoredTab] = useState<RunTab>(() =>
    getInitialTab(searchParams, runId, hasBlockedTasks, specPresent)
  );

  // The effective tab: if blocked, force decisions; otherwise use stored tab
  const effectiveTab = useMemo((): RunTab => {
    if (hasBlockedTasks) return 'decisions';
    return storedTab;
  }, [hasBlockedTasks, storedTab]);

  // Sync with URL and localStorage
  const setTab = useCallback(
    (newTab: RunTab) => {
      setStoredTab(newTab);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', newTab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(getStorageKey(runId), newTab);
      }
    },
    [router, pathname, searchParams, runId]
  );

  return {
    tab: effectiveTab,
    setTab,
    hasBlockedTasks,
  };
}
