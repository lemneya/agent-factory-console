'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface BlueprintVersion {
  id: string;
  version: number;
  schemaVersion: string;
  specHash: string;
  publishedAt: string | null;
  createdAt: string;
}

interface Blueprint {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  versions: BlueprintVersion[];
  project: {
    id: string;
    repoName: string;
    repoFullName: string;
  };
  _count: {
    versions: number;
  };
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlueprints() {
      try {
        setLoading(true);
        const res = await fetch('/api/blueprints');
        if (!res.ok) throw new Error('Failed to fetch blueprints');
        const data = await res.json();
        setBlueprints(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchBlueprints();
  }, []);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Structured specs for deterministic WorkOrder generation
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-2 h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            Blueprints
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Structured specs for deterministic WorkOrder generation
          </p>
        </div>
        <Link
          href="/blueprints/new"
          data-testid="new-blueprint-btn"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Blueprint
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {blueprints.length === 0 ? (
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
            No blueprints yet
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a blueprint to define structured specs for your project.
          </p>
          <Link
            href="/blueprints/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Blueprint
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blueprints.map(blueprint => (
            <Link
              key={blueprint.id}
              href={`/blueprints/${blueprint.id}`}
              data-testid={`blueprint-card-${blueprint.id}`}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {blueprint.name}
                  </h3>
                  <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                    {blueprint.project.repoFullName}
                  </p>
                </div>
                <span
                  className={`ml-2 flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${statusColors[blueprint.status]}`}
                >
                  {blueprint.status}
                </span>
              </div>
              {blueprint.description && (
                <p className="mt-3 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                  {blueprint.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-4 w-4"
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
                  {blueprint._count.versions} version{blueprint._count.versions !== 1 ? 's' : ''}
                </span>
                {blueprint.versions[0]?.publishedAt && (
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    v{blueprint.versions[0].version} published
                  </span>
                )}
                <span className="ml-auto">Updated {formatDate(blueprint.updatedAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
