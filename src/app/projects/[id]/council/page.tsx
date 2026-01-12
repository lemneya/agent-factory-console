'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface Task {
  id: string;
  title: string;
  status: string;
}

interface CouncilDecision {
  id: string;
  taskId: string | null;
  task: Task | null;
  decision: 'ADOPT' | 'ADAPT' | 'BUILD';
  confidence: number;
  candidateName: string | null;
  candidateUrl: string | null;
  licenseType: string | null;
  maintenanceRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  createdAt: string;
}

interface Project {
  id: string;
  repoName: string;
  repoFullName: string;
}

export default function ProjectCouncilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [decisions, setDecisions] = useState<CouncilDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDecision, setFilterDecision] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filterDecision) params.set('decision', filterDecision);

        const response = await fetch(`/api/projects/${id}/council?${params.toString()}`);
        if (!response.ok) {
          if (response.status === 404) throw new Error('Project not found');
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        if (isMounted) {
          setProject(data.project);
          setDecisions(data.decisions);
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

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, filterDecision]);

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'ADOPT':
        return 'bg-green-100 text-green-800';
      case 'ADAPT':
        return 'bg-yellow-100 text-yellow-800';
      case 'BUILD':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Link
            href={`/projects/${id}`}
            className="text-blue-600 hover:underline text-sm mb-2 inline-block"
          >
            &larr; Back to Project
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Council History</h1>
          <p className="text-gray-600">{project.repoFullName}</p>
        </div>

        {/* Filter & Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <label htmlFor="filterDecision" className="sr-only">
              Filter by decision
            </label>
            <select
              id="filterDecision"
              value={filterDecision}
              onChange={e => setFilterDecision(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Decisions</option>
              <option value="ADOPT">ADOPT</option>
              <option value="ADAPT">ADAPT</option>
              <option value="BUILD">BUILD</option>
            </select>
          </div>
          <Link
            href={`/council/new?projectId=${id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Evaluation
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{decisions.length}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-green-700">
              {decisions.filter(d => d.decision === 'ADOPT').length}
            </p>
            <p className="text-sm text-green-600">ADOPT</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-yellow-700">
              {decisions.filter(d => d.decision === 'ADAPT').length}
            </p>
            <p className="text-sm text-yellow-600">ADAPT</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {decisions.filter(d => d.decision === 'BUILD').length}
            </p>
            <p className="text-sm text-blue-600">BUILD</p>
          </div>
        </div>

        {/* Decisions List */}
        {decisions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">No Council decisions for this project</p>
            <Link href={`/council/new?projectId=${id}`} className="text-blue-600 hover:underline">
              Create your first evaluation
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map(decision => (
              <Link
                key={decision.id}
                href={`/council/${decision.id}`}
                className="block bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${getDecisionColor(decision.decision)}`}
                    >
                      {decision.decision}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded ${getRiskColor(decision.maintenanceRisk)}`}
                    >
                      {decision.maintenanceRisk} risk
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(decision.confidence * 100)}% confidence
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(decision.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mb-2">
                  <span className="font-medium text-gray-900">
                    {decision.candidateName || 'Unnamed Solution'}
                  </span>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-2">{decision.reasoning}</p>

                {decision.task && (
                  <div className="text-xs text-gray-500">
                    Linked Task: {decision.task.title} ({decision.task.status})
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
