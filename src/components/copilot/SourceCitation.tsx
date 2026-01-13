'use client';

import { Source } from './types';

interface SourceCitationProps {
  source: Source;
  index: number;
}

const TYPE_COLORS: Record<Source['type'], { bg: string; text: string; icon: string }> = {
  documentation: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    icon: '📖',
  },
  api: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    icon: '🔌',
  },
  code: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    icon: '💻',
  },
  external: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    icon: '🔗',
  },
  internal: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    icon: '📁',
  },
};

export function SourceCitation({ source, index }: SourceCitationProps) {
  const colors = TYPE_COLORS[source.type];

  return (
    <div className={`rounded-md p-2 ${colors.bg}`} data-testid={`source-citation-${index}`}>
      <div className="flex items-start gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded text-xs font-medium ${colors.bg} ${colors.text}`}
          data-testid="source-index"
        >
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm">{colors.icon}</span>
            <a
              href={source.url}
              className={`text-xs font-medium hover:underline truncate ${colors.text}`}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="source-title"
            >
              {source.title}
            </a>
          </div>
          {source.snippet && (
            <p
              className="mt-1 text-xs text-gray-600 dark:text-gray-400 line-clamp-2"
              data-testid="source-snippet"
            >
              {source.snippet}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${colors.bg} ${colors.text}`}
              data-testid="source-type"
            >
              {source.type}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
