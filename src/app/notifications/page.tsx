import Link from 'next/link';

export default function NotificationsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          GitHub events feed from your connected repositories
        </p>
      </div>

      <div className="space-y-4">
        {/* Placeholder for notification feed - will be populated from webhook events */}
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No events yet. Events will appear here when GitHub webhooks are triggered.
          </p>
        </div>
      </div>
    </main>
  );
}
