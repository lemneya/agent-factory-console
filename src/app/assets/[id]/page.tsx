'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface AssetTag {
  id: string;
  tag: string;
}

interface AssetVersion {
  id: string;
  version: string;
  stackCompat: Record<string, string>;
  source: Record<string, string>;
  installRecipe: { steps: { title: string; description?: string }[] };
  interfacesRef: string | null;
  boundariesRef: string | null;
  proofPack: Record<string, string> | null;
  status: string;
  createdAt: string;
  _count: {
    projectAssets: number;
    tasks: number;
  };
}

interface Asset {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  defaultLicense: string;
  versions: AssetVersion[];
  tags: AssetTag[];
  _count: {
    versions: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [versionForm, setVersionForm] = useState({
    version: '',
    stackCompat: '{\n  "nextjs": ">=14",\n  "prisma": "^5"\n}',
    source: '{\n  "type": "repo_path",\n  "ref": "assets/"\n}',
    installRecipe: '{\n  "steps": [\n    {\n      "title": "Install dependencies",\n      "command": "npm install"\n    }\n  ]\n}',
    interfacesRef: '',
    boundariesRef: '',
  });
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  useEffect(() => {
    fetchAsset();
  }, [id]);

  async function fetchAsset() {
    try {
      setLoading(true);
      const response = await fetch(`/api/assets/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Asset not found');
        throw new Error('Failed to fetch asset');
      }
      const data = await response.json();
      setAsset(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddVersion(e: React.FormEvent) {
    e.preventDefault();
    setVersionLoading(true);
    setVersionError(null);

    try {
      const response = await fetch(`/api/assets/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: versionForm.version,
          stackCompat: JSON.parse(versionForm.stackCompat),
          source: JSON.parse(versionForm.source),
          installRecipe: JSON.parse(versionForm.installRecipe),
          interfacesRef: versionForm.interfacesRef || null,
          boundariesRef: versionForm.boundariesRef || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create version');
      }

      setShowVersionForm(false);
      setVersionForm({
        version: '',
        stackCompat: '{\n  "nextjs": ">=14",\n  "prisma": "^5"\n}',
        source: '{\n  "type": "repo_path",\n  "ref": "assets/"\n}',
        installRecipe: '{\n  "steps": [\n    {\n      "title": "Install dependencies",\n      "command": "npm install"\n    }\n  ]\n}',
        interfacesRef: '',
        boundariesRef: '',
      });
      fetchAsset();
    } catch (err) {
      setVersionError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setVersionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Asset not found'}
          </div>
          <Link href="/assets" className="text-blue-600 hover:underline mt-4 inline-block">
            &larr; Back to Assets
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
          <Link href="/assets" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Back to Assets
          </Link>
        </div>

        {/* Asset Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
              <code className="text-gray-500">{asset.slug}</code>
            </div>
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
              {asset.category}
            </span>
          </div>

          {asset.description && (
            <p className="text-gray-600 mb-4">{asset.description}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {asset.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded"
              >
                {tag.tag}
              </span>
            ))}
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <span>License: {asset.defaultLicense}</span>
            <span>{asset._count.versions} versions</span>
            <span>Created: {new Date(asset.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Versions Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Versions</h2>
            <button
              onClick={() => setShowVersionForm(!showVersionForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {showVersionForm ? 'Cancel' : '+ Add Version'}
            </button>
          </div>

          {/* Add Version Form */}
          {showVersionForm && (
            <form onSubmit={handleAddVersion} className="bg-gray-50 rounded-lg p-4 mb-6 space-y-4">
              {versionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                  {versionError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version (semver) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={versionForm.version}
                  onChange={(e) => setVersionForm({ ...versionForm, version: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="1.0.0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stack Compatibility (JSON) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={versionForm.stackCompat}
                  onChange={(e) => setVersionForm({ ...versionForm, stackCompat: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source (JSON) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={versionForm.source}
                  onChange={(e) => setVersionForm({ ...versionForm, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Install Recipe (JSON) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={versionForm.installRecipe}
                  onChange={(e) => setVersionForm({ ...versionForm, installRecipe: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  rows={6}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interfaces Ref (optional)
                  </label>
                  <input
                    type="text"
                    value={versionForm.interfacesRef}
                    onChange={(e) => setVersionForm({ ...versionForm, interfacesRef: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="docs/INTERFACES.md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Boundaries Ref (optional)
                  </label>
                  <input
                    type="text"
                    value={versionForm.boundariesRef}
                    onChange={(e) => setVersionForm({ ...versionForm, boundariesRef: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="docs/BOUNDARIES.md"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={versionLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {versionLoading ? 'Creating...' : 'Create Version'}
                </button>
              </div>
            </form>
          )}

          {/* Versions List */}
          {asset.versions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No versions yet. Add one to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {asset.versions.map((version) => (
                <div
                  key={version.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-semibold">v{version.version}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          version.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {version.status}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Stack:</span>{' '}
                      {Object.entries(version.stackCompat)
                        .map(([k, v]) => `${k} ${v}`)
                        .join(', ')}
                    </div>
                    <div>
                      <span className="text-gray-500">Install Steps:</span>{' '}
                      {version.installRecipe.steps?.length || 0}
                    </div>
                    <div>
                      <span className="text-gray-500">Used in:</span>{' '}
                      {version._count.projectAssets} project(s)
                    </div>
                    <div>
                      <span className="text-gray-500">Tasks:</span>{' '}
                      {version._count.tasks}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
