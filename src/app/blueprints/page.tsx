import Link from 'next/link';
import { getNavItem } from '@/config/nav';

const navItem = getNavItem('blueprints');

export default function BlueprintsPage() {
  const Icon = navItem?.icon;

  return (
    <div data-testid="page-root">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
          Blueprints
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Structured specifications for agent work
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        {Icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          No blueprints yet
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Create your first blueprint to define structured work specifications for agents.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
