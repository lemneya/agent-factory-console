"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SignInRequired, EmptyState } from "@/components/auth";

interface Asset {
  id: string;
  name: string;
  type: string;
  url: string;
  projectId: string;
  project: {
    repoName: string;
  };
  createdAt: string;
}

export default function AssetsPage() {
  const { status } = useSession();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const res = await fetch("/api/assets");
        if (!res.ok) throw new Error("Failed to fetch assets");
        const data = await res.json();
        setAssets(data.assets || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, []);

  if (status === "loading" || loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Assets
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Registered assets and resources for your projects
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="h-5 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Assets
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Registered assets and resources for your projects
          </p>
        </div>
        <SignInRequired
          title="Sign in to manage assets"
          description="View and manage registered assets, images, and resources for your projects."
          showDemoOption={true}
          demoPath="/assets?demo=true"
        />
      </main>
    );
  }

  if (error) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Assets
          </h1>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1
            data-testid="page-title"
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Assets
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Registered assets and resources for your projects
          </p>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon="asset"
          title="No assets registered"
          description="Assets are registered automatically when agents discover or create reusable resources."
          ctaText="Go to Projects"
          ctaHref="/projects"
          secondaryText="Learn about assets"
          secondaryHref="/docs/assets"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="truncate font-medium text-gray-900 dark:text-white">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {asset.type}
                  </p>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                {asset.project.repoName}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
