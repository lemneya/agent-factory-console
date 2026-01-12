'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AssetTag {
  id: string;
  tag: string;
}

interface AssetVersion {
  id: string;
  version: string;
  status: string;
  createdAt: string;
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['auth', 'crud', 'ui', 'infra', 'worker', 'integration', 'testing'];

  useEffect(() => {
    fetchAssets();
  }, [searchQuery, selectedTag, selectedCategory]);

  async function fetchAssets() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedTag) params.set('tag', selectedTag);
      if (selectedCategory) params.set('category', selectedCategory);

      const response = await fetch(`/api/assets?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asset Registry</h1>
            <p className="text-gray-600 mt-1">
              Reusable components for your projects
            </p>
          </div>
          <Link
            href="/assets/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Asset
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by tag..."
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading assets...</p>
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500 text-lg">No assets found</p>
            <Link
              href="/assets/new"
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Create your first asset
            </Link>
          </div>
        ) : (
          /* Asset Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 block"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {asset.name}
                    </h3>
                    <code className="text-sm text-gray-500">{asset.slug}</code>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                    {asset.category}
                  </span>
                </div>

                {asset.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {asset.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mb-4">
                  {asset.tags.slice(0, 5).map((tag) => (
                    <span
                      key={tag.id}
                      className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                    >
                      {tag.tag}
                    </span>
                  ))}
                  {asset.tags.length > 5 && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      +{asset.tags.length - 5}
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    {asset._count.versions} version{asset._count.versions !== 1 ? 's' : ''}
                  </span>
                  {asset.versions[0] && (
                    <span className="font-mono">v{asset.versions[0].version}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
