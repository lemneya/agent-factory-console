'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

export default function NewCouncilEvaluationPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    projectId: '',
    taskId: '',
    decision: '',
    confidence: '0.8',
    candidateName: '',
    candidateUrl: '',
    licenseType: '',
    maintenanceRisk: '',
    integrationPlan: '',
    redTeamCritique: '',
    sources: '',
    reasoning: '',
  });

  useEffect(() => {
    let isMounted = true;

    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setProjects(data);
          }
        }
      } catch {
        // Silently fail - projects list is optional
      } finally {
        if (isMounted) {
          setFetchingProjects(false);
        }
      }
    };

    fetchProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sources = formData.sources
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const response = await fetch('/api/council/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: formData.projectId,
          taskId: formData.taskId || null,
          decision: formData.decision,
          confidence: parseFloat(formData.confidence),
          candidateName: formData.candidateName || null,
          candidateUrl: formData.candidateUrl || null,
          licenseType: formData.licenseType || null,
          maintenanceRisk: formData.maintenanceRisk,
          integrationPlan: formData.integrationPlan || null,
          redTeamCritique: formData.redTeamCritique || null,
          sources,
          reasoning: formData.reasoning,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create evaluation');
      }

      const decision = await response.json();
      router.push(`/council/${decision.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const licenses = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0', 'ISC', 'Proprietary', 'Other'];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/council" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Back to Council
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">New Council Evaluation</h1>
          <p className="text-gray-600 mt-1">
            Research and evaluate before building. Document your ADOPT | ADAPT | BUILD decision.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Project Selection */}
          <div>
            <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            {fetchingProjects ? (
              <p className="text-gray-500">Loading projects...</p>
            ) : (
              <select
                id="projectId"
                value={formData.projectId}
                onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.repoFullName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Decision */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Decision <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['ADOPT', 'ADAPT', 'BUILD'].map(dec => (
                <button
                  key={dec}
                  type="button"
                  onClick={() => setFormData({ ...formData, decision: dec })}
                  className={`p-4 rounded-lg border-2 text-center transition-colors ${
                    formData.decision === dec
                      ? dec === 'ADOPT'
                        ? 'border-green-500 bg-green-50'
                        : dec === 'ADAPT'
                          ? 'border-yellow-500 bg-yellow-50'
                          : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold">{dec}</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {dec === 'ADOPT' && 'Use existing solution as-is'}
                    {dec === 'ADAPT' && 'Modify existing solution'}
                    {dec === 'BUILD' && 'Build from scratch'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Candidate Solution */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="candidateName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Candidate Name
              </label>
              <input
                id="candidateName"
                type="text"
                value={formData.candidateName}
                onChange={e => setFormData({ ...formData, candidateName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NextAuth.js"
              />
            </div>
            <div>
              <label
                htmlFor="candidateUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Candidate URL
              </label>
              <input
                id="candidateUrl"
                type="url"
                value={formData.candidateUrl}
                onChange={e => setFormData({ ...formData, candidateUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* License & Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="licenseType" className="block text-sm font-medium text-gray-700 mb-1">
                License Type
              </label>
              <select
                id="licenseType"
                value={formData.licenseType}
                onChange={e => setFormData({ ...formData, licenseType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select license</option>
                {licenses.map(license => (
                  <option key={license} value={license}>
                    {license}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="maintenanceRisk"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Maintenance Risk <span className="text-red-500">*</span>
              </label>
              <select
                id="maintenanceRisk"
                value={formData.maintenanceRisk}
                onChange={e => setFormData({ ...formData, maintenanceRisk: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select risk level</option>
                <option value="LOW">LOW - Well maintained, active community</option>
                <option value="MEDIUM">MEDIUM - Moderate maintenance, some concerns</option>
                <option value="HIGH">HIGH - Abandoned or unmaintained</option>
              </select>
            </div>
          </div>

          {/* Confidence */}
          <div>
            <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 mb-1">
              Confidence: {Math.round(parseFloat(formData.confidence) * 100)}%
            </label>
            <input
              id="confidence"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.confidence}
              onChange={e => setFormData({ ...formData, confidence: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Integration Plan */}
          <div>
            <label
              htmlFor="integrationPlan"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Integration Plan
            </label>
            <textarea
              id="integrationPlan"
              value={formData.integrationPlan}
              onChange={e => setFormData({ ...formData, integrationPlan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="How will this solution be integrated?"
            />
          </div>

          {/* Red Team Critique */}
          <div>
            <label
              htmlFor="redTeamCritique"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Red Team Critique
            </label>
            <textarea
              id="redTeamCritique"
              value={formData.redTeamCritique}
              onChange={e => setFormData({ ...formData, redTeamCritique: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What could go wrong? What are the risks?"
            />
          </div>

          {/* Sources */}
          <div>
            <label htmlFor="sources" className="block text-sm font-medium text-gray-700 mb-1">
              Sources (one URL per line) <span className="text-red-500">*</span>
            </label>
            <textarea
              id="sources"
              value={formData.sources}
              onChange={e => setFormData({ ...formData, sources: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={4}
              placeholder="https://github.com/...&#10;https://docs.example.com/..."
              required
            />
          </div>

          {/* Reasoning */}
          <div>
            <label htmlFor="reasoning" className="block text-sm font-medium text-gray-700 mb-1">
              Reasoning <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reasoning"
              value={formData.reasoning}
              onChange={e => setFormData({ ...formData, reasoning: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Why did you make this decision? What factors influenced the choice?"
              required
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Link href="/council" className="px-4 py-2 text-gray-700 hover:text-gray-900">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.decision || !formData.maintenanceRisk}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
