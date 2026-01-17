'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { usePreviewPresets } from './usePreviewPresets';

interface PreviewLauncherProps {
  className?: string;
}

/**
 * Global Preview Launcher button that appears in the header.
 * Opens /preview with the current path and last used preset.
 */
export function PreviewLauncher({ className = '' }: PreviewLauncherProps) {
  const pathname = usePathname();
  const { activePresetId } = usePreviewPresets();

  // Build the preview URL with current path and preset
  const previewUrl = `/preview?path=${encodeURIComponent(pathname)}&preset=${encodeURIComponent(activePresetId)}`;

  return (
    <Link
      href={previewUrl}
      className={`group relative inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 ${className}`}
      data-testid="preview-launcher-btn"
      title="Open current page in Preview panel"
    >
      <svg
        className="h-4 w-4"
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
      <span>Preview</span>
      <span
        className="rounded bg-blue-200 px-1.5 py-0.5 text-xs dark:bg-blue-800"
        data-testid="preview-launcher-preset"
      >
        {activePresetId}
      </span>
      {/* Tooltip */}
      <span className="pointer-events-none absolute -bottom-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-gray-700">
        Open in Preview ({activePresetId})
      </span>
    </Link>
  );
}
