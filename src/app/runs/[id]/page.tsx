import Link from 'next/link';

interface RunDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-8">
      <div className="mb-8">
        <Link
          href="/runs"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ← Back to Runs
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Run: {id}</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Task board for this run</p>
      </div>

      {/* Kanban-style task board */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* TODO Column */}
        <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
          <h2 className="mb-4 font-semibold text-gray-700 dark:text-gray-300">
            TODO
            <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
              0
            </span>
          </h2>
          <div className="space-y-2">
            <div className="rounded border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              No tasks
            </div>
          </div>
        </div>

        {/* DOING Column */}
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h2 className="mb-4 font-semibold text-blue-700 dark:text-blue-300">
            DOING
            <span className="ml-2 rounded-full bg-blue-200 px-2 py-0.5 text-xs dark:bg-blue-800">
              0
            </span>
          </h2>
          <div className="space-y-2">
            <div className="rounded border border-dashed border-blue-300 p-4 text-center text-sm text-blue-500 dark:border-blue-700 dark:text-blue-400">
              No tasks
            </div>
          </div>
        </div>

        {/* BLOCKED Column */}
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <h2 className="mb-4 font-semibold text-red-700 dark:text-red-300">
            BLOCKED
            <span className="ml-2 rounded-full bg-red-200 px-2 py-0.5 text-xs dark:bg-red-800">
              0
            </span>
          </h2>
          <div className="space-y-2">
            <div className="rounded border border-dashed border-red-300 p-4 text-center text-sm text-red-500 dark:border-red-700 dark:text-red-400">
              No tasks
            </div>
          </div>
        </div>

        {/* DONE Column */}
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <h2 className="mb-4 font-semibold text-green-700 dark:text-green-300">
            DONE
            <span className="ml-2 rounded-full bg-green-200 px-2 py-0.5 text-xs dark:bg-green-800">
              0
            </span>
          </h2>
          <div className="space-y-2">
            <div className="rounded border border-dashed border-green-300 p-4 text-center text-sm text-green-500 dark:border-green-700 dark:text-green-400">
              No tasks
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
