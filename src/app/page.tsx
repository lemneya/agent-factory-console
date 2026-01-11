import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Agent Factory Console</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Single pane of glass dashboard for multi-agent AI development
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/projects"
          className="rounded-lg border border-gray-200 p-6 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
        >
          <h2 className="text-xl font-semibold">Projects</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View and manage your AI projects</p>
        </Link>
        <Link
          href="/runs"
          className="rounded-lg border border-gray-200 p-6 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
        >
          <h2 className="text-xl font-semibold">Runs</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Track agent execution runs</p>
        </Link>
        <Link
          href="/notifications"
          className="rounded-lg border border-gray-200 p-6 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
        >
          <h2 className="text-xl font-semibold">Notifications</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">GitHub events feed</p>
        </Link>
      </div>
    </main>
  );
}
