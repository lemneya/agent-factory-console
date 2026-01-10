import { useState } from 'react';
import {
  Play,
  Pause,
  XCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  ProgressBar,
  getRunStatusVariant,
} from '../components';
import { mockRuns } from '../data/mockData';
import { RunStatus } from '../types';

export function Runs() {
  const [statusFilter, setStatusFilter] = useState<RunStatus | 'all'>('all');

  const filteredRuns = mockRuns.filter((run) => {
    return statusFilter === 'all' || run.status === statusFilter;
  });

  const runsByStatus = {
    running: mockRuns.filter((r) => r.status === 'running').length,
    pending: mockRuns.filter((r) => r.status === 'pending').length,
    completed: mockRuns.filter((r) => r.status === 'completed').length,
    failed: mockRuns.filter((r) => r.status === 'failed').length,
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: RunStatus) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-primary-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-dark-400" />;
    }
  };

  return (
    <div className="p-8">
      <PageHeader
        title="Runs & Tasks"
        description="Monitor and manage agent run executions"
        actions={
          <Button variant="secondary" icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
        }
      />

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card
          onClick={() => setStatusFilter('running')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'running' ? 'ring-2 ring-emerald-500/50' : ''
          }`}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{runsByStatus.running}</p>
              <p className="text-sm text-dark-400">Running</p>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => setStatusFilter('pending')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'pending' ? 'ring-2 ring-amber-500/50' : ''
          }`}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{runsByStatus.pending}</p>
              <p className="text-sm text-dark-400">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => setStatusFilter('completed')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'completed' ? 'ring-2 ring-primary-500/50' : ''
          }`}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{runsByStatus.completed}</p>
              <p className="text-sm text-dark-400">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card
          onClick={() => setStatusFilter('failed')}
          className={`cursor-pointer transition-all ${
            statusFilter === 'failed' ? 'ring-2 ring-red-500/50' : ''
          }`}
        >
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{runsByStatus.failed}</p>
              <p className="text-sm text-dark-400">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-dark-400">
          Showing {filteredRuns.length} of {mockRuns.length} runs
        </p>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="text-sm text-primary-400 hover:text-primary-300"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Runs List */}
      <Card>
        <div className="divide-y divide-dark-700">
          {filteredRuns.map((run) => (
            <div key={run.id} className="p-5 hover:bg-dark-800/50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">{getStatusIcon(run.status)}</div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-white">{run.agentName}</h3>
                    <Badge variant={getRunStatusVariant(run.status)} dot pulse={run.status === 'running'}>
                      {run.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-dark-400 mb-3">{run.projectName}</p>

                  {/* Progress */}
                  <div className="mb-3">
                    <ProgressBar
                      value={run.completedTasks}
                      max={run.taskCount}
                      showLabel
                    />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-dark-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Started: {formatTime(run.startedAt)}
                    </span>
                    {run.duration && (
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        Duration: {formatDuration(run.duration)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {run.status === 'running' && (
                    <>
                      <button className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors">
                        <Pause className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {run.status === 'pending' && (
                    <button className="p-2 rounded-lg text-dark-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {(run.status === 'failed' || run.status === 'cancelled') && (
                    <button className="p-2 rounded-lg text-dark-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {filteredRuns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-400">No runs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
