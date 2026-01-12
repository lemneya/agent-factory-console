'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
  description: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
}

interface CouncilDecision {
  id: string;
  projectId: string;
  project: Project;
  taskId: string | null;
  task: Task | null;
  decision: 'ADOPT' | 'ADAPT' | 'BUILD';
  confidence: number;
  candidateName: string | null;
  candidateUrl: string | null;
  licenseType: string | null;
  maintenanceRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  integrationPlan: string | null;
  redTeamCritique: string | null;
  sources: string[];
  reasoning: string;
  overrideOf: string | null;
  overrideReason: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CouncilDecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [decision, setDecision] = useState<CouncilDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDecision = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/council/decisions/${id}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Decision not found');
          throw new Error('Failed to fetch decision');
        }
        const data = await response.json();
        if (isMounted) {
          setDecision(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDecision();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const getDecisionColor = (dec: string) => {
    switch (dec) {
      case 'ADOPT':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ADAPT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BUILD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'text-green-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading decision...</p>
        </div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Decision not found'}
          </div>
          <Link href="/council" className="text-blue-600 hover:underline mt-4 inline-block">
            &larr; Back to Council
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
          <Link href="/council" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Back to Council
          </Link>
        </div>

        {/* Decision Card */}
        <div className={`rounded-lg border-2 p-6 mb-6 ${getDecisionColor(decision.decision)}`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-3xl font-bold">{decision.decision}</span>
              <p className="text-sm mt-1 opacity-75">
                {decision.decision === 'ADOPT' && 'Use existing solution as-is'}
                {decision.decision === 'ADAPT' && 'Modify existing solution to fit needs'}
                {decision.decision === 'BUILD' && 'Build custom solution from scratch'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold">{Math.round(decision.confidence * 100)}%</span>
              <p className="text-sm opacity-75">confidence</p>
            </div>
          </div>

          {decision.overrideOf && (
            <div className="bg-white/50 rounded p-3 mt-4">
              <p className="text-sm font-medium">This decision overrides a previous decision</p>
              <p className="text-sm">{decision.overrideReason}</p>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Solution */}
            {(decision.candidateName || decision.candidateUrl) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidate Solution</h2>
                {decision.candidateName && (
                  <p className="text-xl font-medium text-gray-900 mb-2">{decision.candidateName}</p>
                )}
                {decision.candidateUrl && (
                  <a
                    href={decision.candidateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {decision.candidateUrl}
                  </a>
                )}
              </div>
            )}

            {/* Reasoning */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Reasoning</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{decision.reasoning}</p>
            </div>

            {/* Integration Plan */}
            {decision.integrationPlan && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Integration Plan</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{decision.integrationPlan}</p>
              </div>
            )}

            {/* Red Team Critique */}
            {decision.redTeamCritique && (
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-400">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Red Team Critique</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{decision.redTeamCritique}</p>
              </div>
            )}

            {/* Sources */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sources</h2>
              <ul className="space-y-2">
                {(decision.sources as string[]).map((source, index) => (
                  <li key={index}>
                    <a
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {source}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Risk Assessment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Assessment</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-500">Maintenance Risk</span>
                  <p className={`font-bold ${getRiskColor(decision.maintenanceRisk)}`}>
                    {decision.maintenanceRisk}
                  </p>
                </div>
                {decision.licenseType && (
                  <div>
                    <span className="text-sm text-gray-500">License</span>
                    <p className="font-medium text-gray-900">{decision.licenseType}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project</h2>
              <Link
                href={`/projects/${decision.project.id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {decision.project.repoFullName}
              </Link>
              {decision.project.description && (
                <p className="text-sm text-gray-500 mt-2">{decision.project.description}</p>
              )}
            </div>

            {/* Task Info */}
            {decision.task && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Linked Task</h2>
                <p className="font-medium text-gray-900">{decision.task.title}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                    {decision.task.status}
                  </span>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Created</span>
                  <p className="text-gray-900">{new Date(decision.createdAt).toLocaleString()}</p>
                </div>
                {decision.createdBy && (
                  <div>
                    <span className="text-gray-500">Created by</span>
                    <p className="text-gray-900">{decision.createdBy}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Decision ID</span>
                  <p className="text-gray-900 font-mono text-xs">{decision.id}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <Link
                  href={`/council/new?override=${decision.id}`}
                  className="block w-full text-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Override Decision
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
