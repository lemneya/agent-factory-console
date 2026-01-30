/**
 * AFC-C2-STREAM-0: Vault Panel Component
 *
 * Right panel showing generated artifacts
 */

'use client';

import { C2ArtifactType } from '@prisma/client';

interface Artifact {
  id: string;
  name: string;
  type: C2ArtifactType;
  createdAt: string;
}

interface C2VaultPanelProps {
  artifacts: Artifact[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const TYPE_ICONS: Record<C2ArtifactType, string> = {
  CODE: '</>' ,
  DOCUMENT: '📄',
  CONFIG: '⚙️',
  LOG: '📋',
  REPORT: '📊',
  OTHER: '📦',
};

const TYPE_COLORS: Record<C2ArtifactType, string> = {
  CODE: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
  DOCUMENT: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
  CONFIG: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20',
  LOG: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  REPORT: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
  OTHER: 'text-gray-500 bg-gray-50 dark:bg-gray-900/20',
};

export function C2VaultPanel({ artifacts, selectedId, onSelect }: C2VaultPanelProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Vault
        </h3>
        <span className="text-xs text-gray-500">{artifacts.length} artifacts</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {artifacts.length === 0 ? (
          <div className="text-sm text-gray-500 italic text-center py-8">
            No artifacts yet...
          </div>
        ) : (
          artifacts.map((artifact) => (
            <div
              key={artifact.id}
              onClick={() => onSelect?.(artifact.id)}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${
                  selectedId === artifact.id
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${TYPE_COLORS[artifact.type]}`}
                >
                  {TYPE_ICONS[artifact.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {artifact.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(artifact.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
