'use client';

interface SpecTabProps {
  runId: string;
  specMarkdown?: string | null;
}

export default function SpecTab({ runId: _runId, specMarkdown }: SpecTabProps) {
  if (!specMarkdown) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          No specification yet
        </h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          The specification document for this run has not been created yet.
        </p>
        <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
          Use the Copilot tab to discuss requirements and generate a spec.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Specification
          </h2>
          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">
            Source of Truth
          </span>
        </div>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none p-6">
        {/* Render markdown - for now just render as preformatted text */}
        {/* In production, use a markdown renderer like react-markdown */}
        <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-300">
          {specMarkdown}
        </pre>
      </div>
    </div>
  );
}
