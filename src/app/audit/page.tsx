import Link from 'next/link';
import { getNavItem } from '@/config/nav';

const navItem = getNavItem('audit');

export default function AuditPage() {
  const Icon = navItem?.icon;

  return (
    <div data-testid="page-root">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
          Audit Trail
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Complete activity log across all factory operations
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
        {Icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-600 dark:bg-slate-900/50 dark:text-slate-400">
            <Icon className="h-8 w-8" />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">No audit events yet</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Audit events are recorded as agents perform actions and make decisions.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
