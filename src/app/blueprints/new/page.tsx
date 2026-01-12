'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

const SAMPLE_SPEC = {
  blueprint_id: 'SAMPLE',
  title: 'Sample Blueprint',
  description: 'A sample blueprint to get started',
  modules: [
    {
      module_id: 'CORE',
      title: 'Core Module',
      domains: ['BACKEND', 'FRONTEND', 'QA'],
      spec_items: [
        {
          spec_id: 'CORE-001',
          must: 'Implement basic CRUD operations',
          acceptance: ['API returns 200 on success', 'E2E test passes'],
        },
        {
          spec_id: 'CORE-002',
          must: 'Add input validation',
          acceptance: ['Invalid input returns 400', 'Error messages are descriptive'],
        },
      ],
      interfaces: [{ name: 'CoreDTO', path: 'types/core.ts' }],
      owned_paths_hint: {
        BACKEND: ['src/app/api/**', 'prisma/**'],
        FRONTEND: ['src/app/**', 'src/components/**'],
        QA: ['tests/**', 'evidence/**'],
      },
      assets_hint: ['auth-shell', 'crud-table'],
    },
  ],
};

export default function NewBlueprintPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [specJson, setSpecJson] = useState(JSON.stringify(SAMPLE_SPEC, null, 2));

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProjects(data || []);
        if (data.length > 0) {
          setProjectId(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, []);

  async function handleValidate() {
    setValidationErrors([]);
    try {
      const parsed = JSON.parse(specJson);
      // Call a validation endpoint or validate locally
      const res = await fetch('/api/blueprints/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specJson: parsed }),
      });
      const data = await res.json();
      if (data.error) {
        setValidationErrors(data.error.details || [data.error.message]);
      } else if (data.valid === false) {
        setValidationErrors(data.errors || ['Validation failed']);
      } else {
        setValidationErrors([]);
        alert('Blueprint spec is valid!');
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setValidationErrors(['Invalid JSON syntax: ' + err.message]);
      } else {
        setValidationErrors([err instanceof Error ? err.message : 'Unknown error']);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setValidationErrors([]);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!projectId) {
      setError('Please select a project');
      return;
    }

    let parsedSpec;
    try {
      parsedSpec = JSON.parse(specJson);
    } catch {
      setError('Invalid JSON syntax');
      return;
    }

    try {
      setSubmitting(true);

      // Create blueprint
      const blueprintRes = await fetch('/api/blueprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, name: name.trim(), description: description.trim() }),
      });

      if (!blueprintRes.ok) {
        const data = await blueprintRes.json();
        throw new Error(data.error?.message || 'Failed to create blueprint');
      }

      const blueprintData = await blueprintRes.json();
      const blueprintId = blueprintData.data.id;

      // Create version with spec
      const versionRes = await fetch(`/api/blueprints/${blueprintId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ specJson: parsedSpec }),
      });

      if (!versionRes.ok) {
        const data = await versionRes.json();
        if (data.error?.details) {
          setValidationErrors(data.error.details);
        }
        throw new Error(data.error?.message || 'Failed to create version');
      }

      router.push(`/blueprints/${blueprintId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main data-testid="page-root">
        <div className="mb-8">
          <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
            New Blueprint
          </h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-10 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-64 w-full rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </main>
    );
  }

  return (
    <main data-testid="page-root">
      <div className="mb-8">
        <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          New Blueprint
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Create a structured spec for deterministic WorkOrder generation
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {validationErrors.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/50">
          <h4 className="font-medium text-red-800 dark:text-red-400">Validation Errors:</h4>
          <ul className="mt-2 list-inside list-disc text-sm text-red-700 dark:text-red-400">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Blueprint Details</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name *
              </label>
              <input
                type="text"
                id="name"
                data-testid="blueprint-name-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., NEMT Dispatch MVP"
                required
              />
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Project *
              </label>
              <select
                id="project"
                data-testid="blueprint-project-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.repoFullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              id="description"
              data-testid="blueprint-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Brief description of this blueprint"
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spec JSON (v1.0)</h2>
            <button
              type="button"
              onClick={handleValidate}
              data-testid="validate-spec-btn"
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Validate
            </button>
          </div>

          <textarea
            id="specJson"
            data-testid="blueprint-spec-input"
            value={specJson}
            onChange={(e) => setSpecJson(e.target.value)}
            rows={20}
            className="mt-4 block w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            placeholder="Paste your blueprint JSON here"
          />
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            data-testid="create-blueprint-btn"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Blueprint'}
          </button>
        </div>
      </form>
    </main>
  );
}
