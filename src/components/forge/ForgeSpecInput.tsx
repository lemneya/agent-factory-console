'use client';

import { useState } from 'react';
import type { TechStack } from '@/lib/forge';

interface ForgeSpecInputProps {
  onSubmit: (spec: string, techStack: TechStack, dryRun: boolean) => Promise<void>;
  isLoading: boolean;
}

const TECH_STACK_PRESETS: { label: string; stack: Partial<TechStack> }[] = [
  {
    label: 'Next.js Full-Stack',
    stack: {
      frontend: 'nextjs',
      backend: 'nextjs-api',
      database: 'postgres',
      auth: 'nextauth',
      styling: 'tailwind',
      deployment: 'vercel',
    },
  },
  {
    label: 'React + Express',
    stack: {
      frontend: 'react',
      backend: 'express',
      database: 'postgres',
      auth: 'custom',
      styling: 'tailwind',
      deployment: 'railway',
    },
  },
  {
    label: 'API Only',
    stack: {
      backend: 'express',
      database: 'postgres',
      deployment: 'docker',
    },
  },
];

const EXAMPLE_SPECS = [
  {
    label: 'SaaS MVP',
    spec: 'Build a SaaS MVP with user authentication, subscription billing with Stripe, a dashboard showing usage analytics, and team management features.',
  },
  {
    label: 'E-commerce Store',
    spec: 'Create an e-commerce store with product catalog, shopping cart, checkout flow, order management, and admin dashboard for inventory.',
  },
  {
    label: 'Project Management',
    spec: 'Build a project management tool with boards, tasks, team assignments, due dates, comments, and real-time notifications.',
  },
];

export default function ForgeSpecInput({ onSubmit, isLoading }: ForgeSpecInputProps) {
  const [spec, setSpec] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customStack, setCustomStack] = useState<Partial<TechStack>>({});
  const [useCustomStack, setUseCustomStack] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  const currentStack = useCustomStack
    ? customStack
    : TECH_STACK_PRESETS[selectedPreset]?.stack || {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spec.trim() || isLoading) return;
    await onSubmit(spec.trim(), currentStack as TechStack, dryRun);
  };

  const handleExampleClick = (exampleSpec: string) => {
    setSpec(exampleSpec);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Build Specification
      </h3>

      {/* Example specs */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Quick Start Templates
        </label>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_SPECS.map((example) => (
            <button
              key={example.label}
              onClick={() => handleExampleClick(example.spec)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Spec textarea */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What do you want to build?
          </label>
          <textarea
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            placeholder="Describe your application in detail. Include features, user flows, integrations, and any specific requirements..."
            className="w-full h-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            disabled={isLoading}
          />
        </div>

        {/* Tech Stack Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tech Stack
          </label>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {TECH_STACK_PRESETS.map((preset, idx) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setSelectedPreset(idx);
                  setUseCustomStack(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  !useCustomStack && selectedPreset === idx
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setUseCustomStack(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                useCustomStack
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Current stack display */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(currentStack).map(([key, value]) => (
              <span
                key={key}
                className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {key}: {value}
              </span>
            ))}
          </div>

          {/* Custom stack editor */}
          {useCustomStack && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {['frontend', 'backend', 'database', 'auth', 'styling', 'deployment'].map((field) => (
                <div key={field}>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                    {field}
                  </label>
                  <input
                    type="text"
                    value={(customStack as Record<string, string>)[field] || ''}
                    onChange={(e) =>
                      setCustomStack((prev) => ({ ...prev, [field]: e.target.value }))
                    }
                    placeholder={field}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Options */}
        <div className="mb-4 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Dry Run (preview plan without executing)
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!spec.trim() || isLoading}
          className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 text-sm font-medium text-white hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Analyzing Spec...
            </span>
          ) : dryRun ? (
            'Preview Build Plan'
          ) : (
            'Start Multi-Agent Build'
          )}
        </button>
      </form>
    </div>
  );
}
