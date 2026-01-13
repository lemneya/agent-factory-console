import Link from 'next/link';

export default function Home() {
  return (
    <div data-testid="page-root">
      <div className="mb-8">
        <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Single pane of glass for multi-agent AI development
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/projects"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
            Projects
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            View and manage your GitHub repositories linked to Agent Factory
          </p>
        </Link>

        <Link
          href="/runs"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-green-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-green-600"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 dark:text-white dark:group-hover:text-green-400">
            Runs
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Track agent execution runs and manage tasks in Kanban boards
          </p>
        </Link>

        <Link
          href="/notifications"
          className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-purple-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
            Notifications
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Real-time feed of GitHub events from your connected repositories
          </p>
        </Link>
      </div>
    </div>
  );
}
