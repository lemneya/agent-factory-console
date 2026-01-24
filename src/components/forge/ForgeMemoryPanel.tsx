'use client';

import { useMemo, useState } from 'react';
import type { ForgeMemory } from '@/lib/forge';
import { createInitialMemory, getMemoryStats } from '@/lib/forge';

interface ForgeMemoryPanelProps {
  userId?: string;
}

export default function ForgeMemoryPanel({ userId = 'demo' }: ForgeMemoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create initial memory (in a real app, this would fetch from database)
  const memory = useMemo<ForgeMemory>(() => createInitialMemory(userId), [userId]);

  const stats = getMemoryStats(memory);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Forge Memory
          </h3>
          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
            {stats.errorsLearned} patterns learned
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats.totalBuilds}
              </p>
              <p className="text-xs text-gray-500">Builds</p>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {stats.successRate}%
              </p>
              <p className="text-xs text-gray-500">Success</p>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {stats.avgBuildTime || '—'}
              </p>
              <p className="text-xs text-gray-500">Avg Min</p>
            </div>
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {stats.totalTimeSaved}
              </p>
              <p className="text-xs text-gray-500">Saved</p>
            </div>
          </div>

          {/* Learned Error Fixes */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              🛡️ Error Prevention ({memory.errorFixes.length} patterns)
            </p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {memory.errorFixes.slice(0, 5).map((fix) => (
                <div
                  key={fix.id}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-xs"
                >
                  <p className="font-medium text-red-700 dark:text-red-300">
                    {fix.errorType}
                  </p>
                  <p className="text-red-600 dark:text-red-400 truncate">
                    {fix.preventionTip || fix.fix}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Component Combos */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              🧩 Winning Combinations ({memory.componentCombos.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {memory.componentCombos.map((combo) => (
                <div
                  key={combo.id}
                  className="px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-xs"
                >
                  <span className="font-medium text-green-700 dark:text-green-300">
                    {combo.description}
                  </span>
                  <span className="ml-1 text-green-600 dark:text-green-400">
                    ({Math.round(combo.successRate * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Structures */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              📁 Best Structures ({memory.projectStructures.length})
            </p>
            <div className="space-y-1">
              {memory.projectStructures.map((structure) => (
                <div
                  key={structure.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs"
                >
                  <span className="font-medium text-blue-700 dark:text-blue-300">
                    {structure.name}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {Math.round(structure.successRate * 100)}% success
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* User Preferences */}
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              ⚙️ Your Preferences
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(memory.preferences.preferredStack || {}).map(([key, value]) => (
                <span
                  key={key}
                  className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>

          {/* Memory Benefits */}
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
            <p className="text-xs font-medium text-purple-800 dark:text-purple-200 mb-1">
              💡 Memory Benefits
            </p>
            <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-0.5">
              <li>• Prevents {memory.errorFixes.length} known errors automatically</li>
              <li>• Suggests {memory.componentCombos.length} proven component combinations</li>
              <li>• Applies your coding style preferences</li>
              <li>• Improves ~10-20% per project built</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
