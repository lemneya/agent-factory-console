'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface AssetTag {
  id: string;
  tag: string;
}

interface Asset {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  tags: AssetTag[];
}

interface AssetVersion {
  id: string;
  version: string;
  status: string;
  asset: Asset;
}

interface ProjectAsset {
  id: string;
  projectId: string;
  assetVersionId: string;
  pinned: boolean;
  config: Record<string, unknown> | null;
  createdAt: string;
  assetVersion: AssetVersion;
}

interface AvailableAsset {
  id: string;
  slug: string;
  name: string;
  category: string;
  versions: { id: string; version: string; status: string }[];
}

interface Run {
  id: string;
  name: string;
  status: string;
}

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

export default function ProjectAssetsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Attach modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [attachLoading, setAttachLoading] = useState(false);

  // Generate tasks modal state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedProjectAsset, setSelectedProjectAsset] = useState<ProjectAsset | null>(null);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateResult, setGenerateResult] = useState<{ message: string; count: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      setLoading(true);
      const [projectRes, assetsRes, availableRes, runsRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/projects/${id}/assets`),
        fetch('/api/assets'),
        fetch(`/api/runs?projectId=${id}`),
      ]);

      if (!projectRes.ok) throw new Error('Project not found');

      const [projectData, assetsData, availableData, runsData] = await Promise.all([
        projectRes.json(),
        assetsRes.json(),
        availableRes.json(),
        runsRes.json(),
      ]);

      setProject(projectData);
      setProjectAssets(assetsData);
      setAvailableAssets(availableData);
      setRuns(runsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAttach(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVersionId) return;

    setAttachLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}/assets/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetVersionId: selectedVersionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to attach asset');
      }

      setShowAttachModal(false);
      setSelectedAssetId('');
      setSelectedVersionId('');
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to attach asset');
    } finally {
      setAttachLoading(false);
    }
  }

  async function handleDetach(projectAssetId: string) {
    if (!confirm('Are you sure you want to detach this asset?')) return;

    try {
      const response = await fetch(`/api/projects/${id}/assets/detach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectAssetId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to detach asset');
      }

      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to detach asset');
    }
  }

  async function handleGenerateTasks(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectAsset || !selectedRunId) return;

    setGenerateLoading(true);
    setGenerateResult(null);
    try {
      const response = await fetch(`/api/projects/${id}/assets/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetVersionId: selectedProjectAsset.assetVersionId,
          runId: selectedRunId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate tasks');
      }

      const data = await response.json();
      setGenerateResult({ message: data.message, count: data.tasks.length });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setGenerateLoading(false);
    }
  }

  const selectedAsset = availableAssets.find((a) => a.id === selectedAssetId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Project not found'}
          </div>
          <Link href="/projects" className="text-blue-600 hover:underline mt-4 inline-block">
            &larr; Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/projects/${id}`} className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Project Assets</h1>
          <p className="text-gray-600">{project.repoFullName}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowAttachModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Attach Asset
          </button>
        </div>

        {/* Attached Assets */}
        {projectAssets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">No assets attached to this project</p>
            <button
              onClick={() => setShowAttachModal(true)}
              className="text-blue-600 hover:underline"
            >
              Attach your first asset
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projectAssets.map((pa) => (
              <div
                key={pa.id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Link
                      href={`/assets/${pa.assetVersion.asset.id}`}
                      className="font-semibold text-lg text-gray-900 hover:text-blue-600"
                    >
                      {pa.assetVersion.asset.name}
                    </Link>
                    <span className="font-mono text-sm text-gray-500">
                      v{pa.assetVersion.version}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      {pa.assetVersion.asset.category}
                    </span>
                    {pa.pinned && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                        Pinned
                      </span>
                    )}
                  </div>
                  {pa.assetVersion.asset.description && (
                    <p className="text-gray-600 text-sm">
                      {pa.assetVersion.asset.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedProjectAsset(pa);
                      setShowGenerateModal(true);
                    }}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Generate Tasks
                  </button>
                  <button
                    onClick={() => handleDetach(pa.id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 transition-colors"
                  >
                    Detach
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Attach Modal */}
        {showAttachModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Attach Asset</h2>
              <form onSubmit={handleAttach} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Asset
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => {
                      setSelectedAssetId(e.target.value);
                      setSelectedVersionId('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Choose an asset...</option>
                    {availableAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.category})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedAsset && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Version
                    </label>
                    <select
                      value={selectedVersionId}
                      onChange={(e) => setSelectedVersionId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Choose a version...</option>
                      {selectedAsset.versions
                        .filter((v) => v.status === 'ACTIVE')
                        .map((version) => (
                          <option key={version.id} value={version.id}>
                            v{version.version}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttachModal(false);
                      setSelectedAssetId('');
                      setSelectedVersionId('');
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={attachLoading || !selectedVersionId}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {attachLoading ? 'Attaching...' : 'Attach'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Generate Tasks Modal */}
        {showGenerateModal && selectedProjectAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">Generate Integration Tasks</h2>
              <p className="text-gray-600 mb-4">
                Create tasks from the install recipe for{' '}
                <strong>{selectedProjectAsset.assetVersion.asset.name}</strong> v
                {selectedProjectAsset.assetVersion.version}
              </p>

              {generateResult ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {generateResult.message}
                </div>
              ) : (
                <form onSubmit={handleGenerateTasks} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Run
                    </label>
                    <select
                      value={selectedRunId}
                      onChange={(e) => setSelectedRunId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      required
                    >
                      <option value="">Choose a run...</option>
                      {runs
                        .filter((r) => r.status === 'ACTIVE')
                        .map((run) => (
                          <option key={run.id} value={run.id}>
                            {run.name}
                          </option>
                        ))}
                    </select>
                    {runs.filter((r) => r.status === 'ACTIVE').length === 0 && (
                      <p className="text-sm text-amber-600 mt-1">
                        No active runs available. Create a run first.
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGenerateModal(false);
                        setSelectedProjectAsset(null);
                        setSelectedRunId('');
                        setGenerateResult(null);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={generateLoading || !selectedRunId}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {generateLoading ? 'Generating...' : 'Generate Tasks'}
                    </button>
                  </div>
                </form>
              )}

              {generateResult && (
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => {
                      setShowGenerateModal(false);
                      setSelectedProjectAsset(null);
                      setSelectedRunId('');
                      setGenerateResult(null);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
