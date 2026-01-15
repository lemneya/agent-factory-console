'use client';

import Link from 'next/link';
import { usePreviewPresets } from './usePreviewPresets';

interface OpenInPreviewProps {
  /** The entity type (e.g., 'run', 'project', 'blueprint') */
  entity: string;
  /** The entity ID */
  id: string;
  /** The target path to preview (e.g., '/runs/abc123') */
  path: string;
  /** Optional custom label */
  label?: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * "Open in Preview" button for list rows.
 * Navigates to /preview with the target path and last used preset.
 */
export function OpenInPreview({
  entity,
  id,
  path,
  label = 'Preview',
  className = '',
}: OpenInPreviewProps) {
  const { activePresetId } = usePreviewPresets();

  const previewUrl = `/preview?path=${encodeURIComponent(path)}&preset=${encodeURIComponent(activePresetId)}`;

  return (
    <Link
      href={previewUrl}
      className={`group relative inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 ${className}`}
      data-testid={`open-in-preview-${entity}-${id}`}
      title={`Open ${path} in Preview`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span>{label}</span>
      {/* Tooltip */}
      <span className="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
        Open in Preview ({activePresetId})
      </span>
    </Link>
  );
}
