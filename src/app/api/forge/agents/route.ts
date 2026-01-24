/**
 * GET /api/forge/agents
 * List available agent types
 */

import { NextResponse } from 'next/server';
import { getAvailableAgents, AgentType } from '@/lib/forge';

// Agent descriptions
const AGENT_INFO: Record<AgentType, { name: string; description: string; url: string }> = {
  'claude-code': {
    name: 'Claude Code',
    description: 'Anthropic\'s official CLI agent for Claude. Best quality code generation.',
    url: 'https://github.com/anthropics/claude-code',
  },
  'openhands': {
    name: 'OpenHands',
    description: 'Open source autonomous coding agent with browser and terminal access.',
    url: 'https://github.com/All-Hands-AI/OpenHands',
  },
  'aider': {
    name: 'Aider',
    description: 'AI pair programming in your terminal. Git-native with great context.',
    url: 'https://github.com/paul-gauthier/aider',
  },
  'mock': {
    name: 'Mock Agent',
    description: 'Simulated agent for testing and development.',
    url: '',
  },
};

export async function GET() {
  try {
    const available = await getAvailableAgents();

    const agents = available.map((type) => ({
      type,
      ...AGENT_INFO[type],
      available: true,
    }));

    // Also include unavailable agents for reference
    const allTypes: AgentType[] = ['claude-code', 'openhands', 'aider', 'mock'];
    const unavailable = allTypes
      .filter((t) => !available.includes(t))
      .map((type) => ({
        type,
        ...AGENT_INFO[type],
        available: false,
      }));

    return NextResponse.json({
      available: agents,
      unavailable,
      recommended: available.includes('claude-code') ? 'claude-code' : available[0],
    });
  } catch (error) {
    console.error('Error checking agents:', error);
    return NextResponse.json(
      { error: 'Failed to check available agents' },
      { status: 500 }
    );
  }
}
