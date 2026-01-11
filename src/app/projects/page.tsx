import Link from 'next/link';

export default function ProjectsPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your GitHub repositories linked to Agent Factory
          </p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          + Sync Repository
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for project cards - will be populated from API */}
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No projects yet. Sign in with GitHub to sync your repositories.
          </p>
        </div>
      </div>
    </main>
  );
}
