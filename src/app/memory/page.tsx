import Link from 'next/link';
import { getNavItem } from '@/config/nav';

const navItem = getNavItem('memory');

export default function MemoryPage() {
  const Icon = navItem?.icon;

  return (
    <div data-testid="page-root">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
          Memory
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Agent memory layer for patterns, decisions, and learnings
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        {Icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No memory items yet</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Memory items are created as agents learn patterns and make decisions during runs.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
