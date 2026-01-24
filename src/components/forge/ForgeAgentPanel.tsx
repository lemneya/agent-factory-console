'use client';

import type { AgentRole, AgentStatus as AgentStatusType } from '@/lib/forge';

// UI-specific type for displaying agent status
export interface AgentDisplayStatus {
  workstreamId: string;
  status: AgentStatusType;
  startedAt?: Date;
  output?: string;
  error?: string;
}

interface ForgeAgentPanelProps {
  agents: AgentDisplayStatus[];
  currentWave: number;
  totalWaves: number;
}

const AGENT_ROLE_INFO: Record<
  AgentRole,
  { label: string; color: string; icon: string }
> = {
  data: {
    label: 'Data Layer',
    color: 'bg-green-500',
    icon: '🗄️',
  },
  auth: {
    label: 'Authentication',
    color: 'bg-yellow-500',
    icon: '🔐',
  },
  api: {
    label: 'API Routes',
    color: 'bg-blue-500',
    icon: '🔌',
  },
  ui: {
    label: 'UI Components',
    color: 'bg-purple-500',
    icon: '🎨',
  },
  integrations: {
    label: 'Integrations',
    color: 'bg-orange-500',
    icon: '🔗',
  },
  qa: {
    label: 'Quality Assurance',
    color: 'bg-red-500',
    icon: '✅',
  },
};

function getStatusColor(status: AgentStatusType): string {
  switch (status) {
    case 'pending':
      return 'text-gray-400';
    case 'running':
      return 'text-blue-500';
    case 'waiting_input':
      return 'text-amber-500';
    case 'completed':
      return 'text-green-500';
    case 'failed':
      return 'text-red-500';
    default:
      return 'text-gray-400';
  }
}

function getStatusLabel(status: AgentStatusType): string {
  switch (status) {
    case 'pending':
      return 'Waiting';
    case 'running':
      return 'Working';
    case 'waiting_input':
      return 'Needs Input';
    case 'completed':
      return 'Done';
    case 'failed':
      return 'Failed';
    default:
      return 'Unknown';
  }
}

export default function ForgeAgentPanel({
  agents,
  currentWave,
  totalWaves,
}: ForgeAgentPanelProps) {
  const runningAgents = agents.filter((a) => a.status === 'running').length;
  const completedAgents = agents.filter((a) => a.status === 'completed').length;
  const waitingAgents = agents.filter((a) => a.status === 'waiting_input').length;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Agent Swarm
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Wave {currentWave}/{totalWaves}
          </span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {runningAgents} Running
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {completedAgents} Done
          </span>
        </div>
        {waitingAgents > 0 && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {waitingAgents} Need Input
            </span>
          </div>
        )}
      </div>

      {/* Agent grid */}
      {agents.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No agents spawned yet</p>
          <p className="text-xs mt-1">Start a build to see agents in action</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => {
            const roleKey = agent.workstreamId.split('-')[0] as AgentRole;
            const roleInfo = AGENT_ROLE_INFO[roleKey] || AGENT_ROLE_INFO.api;

            return (
              <div
                key={agent.workstreamId}
                className={`p-3 rounded-lg border transition-all ${
                  agent.status === 'running'
                    ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                    : agent.status === 'waiting_input'
                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20'
                    : agent.status === 'completed'
                    ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                    : agent.status === 'failed'
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{roleInfo.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.workstreamId}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {roleInfo.label}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {agent.status === 'running' && (
                      <svg
                        className="animate-spin h-4 w-4 text-blue-500"
                        viewBox="0 0 24 24"
                      >
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
                    )}
                    <span
                      className={`text-xs font-medium ${getStatusColor(agent.status)}`}
                    >
                      {getStatusLabel(agent.status)}
                    </span>
                  </div>
                </div>

                {/* Progress indicator for running agents */}
                {agent.status === 'running' && (
                  <div className="mt-2">
                    <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full animate-pulse w-2/3" />
                    </div>
                  </div>
                )}

                {/* Output preview */}
                {agent.output && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded font-mono">
                    {agent.output.slice(0, 100)}
                    {agent.output.length > 100 && '...'}
                  </div>
                )}

                {/* Error message */}
                {agent.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    {agent.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
