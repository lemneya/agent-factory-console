'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface BlueprintVersion {
  id: string;
  version: number;
  schemaVersion: string;
  specJson: Record<string, unknown>;
  specHash: string;
  publishedAt: string | null;
  createdAt: string;
  _count: {
    workOrders: number;
  };
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
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  DRAFT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400',
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
};

export default function BlueprintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blueprintId = params.id as string;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [slicing, setSlicing] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<BlueprintVersion | null>(null);

  const fetchBlueprint = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/blueprints/${blueprintId}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Blueprint not found');
        throw new Error('Failed to fetch blueprint');
      }
      const data = await res.json();
      setBlueprint(data.data);
      if (data.data.versions.length > 0) {
        setSelectedVersion(data.data.versions[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [blueprintId]);

  useEffect(() => {
    fetchBlueprint();
  }, [fetchBlueprint]);

  async function handlePublish(versionId: string) {
    try {
      setPublishing(versionId);
      const res = await fetch(`/api/blueprints/versions/${versionId}/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to publish');
      }
      await fetchBlueprint();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setPublishing(null);
    }
  }

  async function handleSlice(versionId: string) {
    try {
      setSlicing(versionId);
      const res = await fetch(`/api/blueprints/versions/${versionId}/slice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to slice');
      }
      const data = await res.json();
      alert(`Created ${data.data.totalCount} WorkOrders!`);
      await fetchBlueprint();
      router.push(`/workorders?blueprintVersionId=${versionId}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to slice');
    } finally {
      setSlicing(null);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <main data-testid="page-root">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 w-full rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    );
  }

  if (error || !blueprint) {
    return (
      <main data-testid="page-root">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/50">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
            {error || 'Blueprint not found'}
          </h2>
          <Link
            href="/blueprints"
            className="mt-4 inline-block text-blue-600 hover:underline dark:text-blue-400"
          >
            Back to Blueprints
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/blueprints" className="hover:text-blue-600 dark:hover:text-blue-400">
            Blueprints
          </Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-white">{blueprint.name}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1
              data-testid="page-title"
              className="text-2xl font-bold text-gray-900 dark:text-white"
            >
              {blueprint.name}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {blueprint.project.repoFullName}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[blueprint.status]}`}
          >
            {blueprint.status}
          </span>
        </div>
        {blueprint.description && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">{blueprint.description}</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Versions</h2>
            <div className="mt-4 space-y-2">
              {blueprint.versions.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No versions yet</p>
              ) : (
                blueprint.versions.map(version => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version)}
                    data-testid={`version-btn-${version.version}`}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      selectedVersion?.id === version.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">
                        v{version.version}
                      </span>
                      {version.publishedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/50 dark:text-green-400">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {version._count.workOrders} WorkOrders
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(version.createdAt)}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedVersion ? (
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Version {selectedVersion.version}
                </h2>
                <div className="flex gap-2">
                  {!selectedVersion.publishedAt && (
                    <button
                      onClick={() => handlePublish(selectedVersion.id)}
                      disabled={publishing === selectedVersion.id}
                      data-testid="publish-version-btn"
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {publishing === selectedVersion.id ? 'Publishing...' : 'Publish'}
                    </button>
                  )}
                  {selectedVersion.publishedAt && selectedVersion._count.workOrders === 0 && (
                    <button
                      onClick={() => handleSlice(selectedVersion.id)}
                      disabled={slicing === selectedVersion.id}
                      data-testid="slice-version-btn"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {slicing === selectedVersion.id ? 'Slicing...' : 'Slice to WorkOrders'}
                    </button>
                  )}
                  {selectedVersion._count.workOrders > 0 && (
                    <Link
                      href={`/workorders?blueprintVersionId=${selectedVersion.id}`}
                      data-testid="view-workorders-link"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      View WorkOrders ({selectedVersion._count.workOrders})
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Schema Version:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {selectedVersion.schemaVersion}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Spec Hash:</span>
                  <span className="ml-2 font-mono text-xs text-gray-900 dark:text-white">
                    {selectedVersion.specHash.substring(0, 16)}...
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {formatDate(selectedVersion.createdAt)}
                  </span>
                </div>
                {selectedVersion.publishedAt && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Published:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {formatDate(selectedVersion.publishedAt)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Spec JSON</h3>
                <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-900">
                  {JSON.stringify(selectedVersion.specJson, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
              <p className="text-gray-500 dark:text-gray-400">Select a version to view details</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
