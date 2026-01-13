'use client';

import { useRouter } from 'next/navigation';

interface DemoModeBadgeProps {
  onExit?: () => void;
}

export function DemoModeBadge({ onExit }: DemoModeBadgeProps) {
  const router = useRouter();

  const handleExit = () => {
    // Clear demo cookie
    document.cookie = 'afc_demo=; path=/; max-age=0';
    if (onExit) {
      onExit();
    } else {
      // Remove demo param and refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      router.push(url.pathname);
      router.refresh();
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 shadow-lg dark:border-yellow-600 dark:bg-yellow-900/50"
      data-testid="demo-mode-badge"
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
        </span>
        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          DEMO MODE (read-only)
        </span>
      </div>
      <button
        onClick={handleExit}
        className="rounded px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-800"
        data-testid="exit-demo-mode-btn"
      >
        Exit
      </button>
    </div>
  );
}
