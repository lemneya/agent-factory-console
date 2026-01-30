/**
 * AFC-C2-STREAM-0: Agent Grid Component
 *
 * Displays 20 agents in a 5x4 grid with real-time state updates
 */

'use client';

import { C2AgentState } from '@prisma/client';

interface AgentState {
  index: number;
  state: C2AgentState;
}

interface C2AgentGridProps {
  agents: AgentState[];
  rows?: number;
  cols?: number;
}

const STATE_COLORS: Record<C2AgentState, { bg: string; border: string; animate?: string }> = {
  IDLE: { bg: 'bg-gray-100', border: 'border-gray-300' },
  THINKING: { bg: 'bg-yellow-100', border: 'border-yellow-400', animate: 'animate-pulse' },
  WORKING: { bg: 'bg-blue-100', border: 'border-blue-400', animate: 'animate-pulse' },
  DONE: { bg: 'bg-green-100', border: 'border-green-400' },
  ERROR: { bg: 'bg-red-100', border: 'border-red-400' },
};

const STATE_ICONS: Record<C2AgentState, string> = {
  IDLE: '○',
  THINKING: '◐',
  WORKING: '●',
  DONE: '✓',
  ERROR: '✗',
};

export function C2AgentGrid({ agents, rows = 4, cols = 5 }: C2AgentGridProps) {
  // Create a map for quick lookups
  const agentMap = new Map(agents.map((a) => [a.index, a.state]));

  const getAgentState = (index: number): C2AgentState => {
    return agentMap.get(index) || 'IDLE';
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Swarm Grid ({rows}x{cols})
      </h3>
      <div
        className="grid gap-2 flex-1"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const state = getAgentState(i);
          const colors = STATE_COLORS[state];
          return (
            <div
              key={i}
              className={`
                flex items-center justify-center rounded-lg border-2
                ${colors.bg} ${colors.border} ${colors.animate || ''}
                transition-all duration-300
                dark:bg-opacity-20
              `}
              title={`Agent ${i}: ${state}`}
            >
              <span className="text-lg font-bold">{STATE_ICONS[state]}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {Object.entries(STATE_ICONS).map(([state, icon]) => (
          <div key={state} className="flex items-center gap-1">
            <span>{icon}</span>
            <span className="text-gray-500">{state}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
