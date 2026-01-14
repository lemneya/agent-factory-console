import Link from 'next/link';
import { getNavItem } from '@/config/nav';

const navItem = getNavItem('assets');

export default function AssetsPage() {
  const Icon = navItem?.icon;

  return (
    <div data-testid="page-root">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
          Assets
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Registered resources for your projects
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        {Icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          No assets registered
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Register assets to track images, files, and resources used in your projects.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
