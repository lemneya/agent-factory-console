'use client';

import { useState, useRef, useEffect } from 'react';
import { CopilotMessage, Source } from './types';
import { SourceCitation } from './SourceCitation';

// Mock responses for read-only demo
const MOCK_RESPONSES: Record<string, { content: string; sources: Source[] }> = {
  default: {
    content:
      "I'm the Agent Factory Copilot, a read-only assistant that helps you understand the console. I can answer questions about projects, runs, blueprints, and more. Try asking me something!",
    sources: [
      {
        id: '1',
        title: 'Agent Factory Documentation',
        url: '/docs',
        type: 'documentation',
        snippet: 'Getting started with Agent Factory Console',
      },
    ],
  },
  project: {
    content:
      'Projects in Agent Factory are containers for organizing your AI agent workflows. Each project can contain multiple runs, blueprints, and assets. You can create a new project from the Projects page.',
    sources: [
      {
        id: '2',
        title: 'Projects API Reference',
        url: '/api/projects',
        type: 'api',
        snippet: 'POST /api/projects - Create a new project',
      },
      {
        id: '3',
        title: 'Project Management Guide',
        url: '/docs/projects',
        type: 'documentation',
        snippet: 'Learn how to organize your AI workflows with projects',
      },
    ],
  },
  run: {
    content:
      'Runs represent individual executions of your AI agent workflows. Each run tracks the status, logs, and outputs of the execution. You can view run details, replay runs, or cancel running executions.',
    sources: [
      {
        id: '4',
        title: 'Runs API Reference',
        url: '/api/runs',
        type: 'api',
        snippet: 'GET /api/runs - List all runs',
      },
      {
        id: '5',
        title: 'Run Lifecycle Documentation',
        url: '/docs/runs/lifecycle',
        type: 'documentation',
        snippet: 'Understanding run states: pending, running, completed, failed',
      },
    ],
  },
  blueprint: {
    content:
      'Blueprints are reusable templates that define the structure and configuration of your AI agent workflows. They specify the agents involved, their roles, and how they interact.',
    sources: [
      {
        id: '6',
        title: 'Blueprint Schema',
        url: '/docs/blueprints/schema',
        type: 'documentation',
        snippet: 'Blueprint JSON schema definition',
      },
      {
        id: '7',
        title: 'Blueprint Examples',
        url: '/docs/blueprints/examples',
        type: 'code',
        snippet: 'Example blueprints for common use cases',
      },
    ],
  },
  council: {
    content:
      'The Council is a multi-agent decision-making system where multiple AI agents debate and vote on decisions. It provides transparency and consensus-based outcomes for critical operations.',
    sources: [
      {
        id: '8',
        title: 'Council Architecture',
        url: '/docs/council',
        type: 'documentation',
        snippet: 'How the multi-agent council works',
      },
      {
        id: '9',
        title: 'Council Voting Protocol',
        url: '/docs/council/voting',
        type: 'internal',
        snippet: 'Voting mechanisms and consensus algorithms',
      },
    ],
  },
  memory: {
    content:
      'The Memory system provides persistent storage for agent context and knowledge. It enables agents to remember past interactions and maintain state across sessions.',
    sources: [
      {
        id: '10',
        title: 'Memory Store API',
        url: '/api/memory',
        type: 'api',
        snippet: 'Memory CRUD operations',
      },
      {
        id: '11',
        title: 'Memory Best Practices',
        url: '/docs/memory/best-practices',
        type: 'documentation',
        snippet: 'Optimizing memory usage for agents',
      },
    ],
  },
};

function getMockResponse(query: string): { content: string; sources: Source[] } {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('project')) return MOCK_RESPONSES.project;
  if (lowerQuery.includes('run')) return MOCK_RESPONSES.run;
  if (lowerQuery.includes('blueprint')) return MOCK_RESPONSES.blueprint;
  if (lowerQuery.includes('council')) return MOCK_RESPONSES.council;
  if (lowerQuery.includes('memory')) return MOCK_RESPONSES.memory;
  return MOCK_RESPONSES.default;
}

export function CopilotPanel() {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm the Agent Factory Copilot. I can help you understand the console and answer questions about projects, runs, blueprints, and more. This is a read-only demo - no actions will be performed.",
      sources: [
        {
          id: 'welcome-source',
          title: 'Agent Factory Console',
          url: '/',
          type: 'documentation',
          snippet: 'Welcome to the Agent Factory Console',
        },
      ],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const response = getMockResponse(userMessage.content);
    const assistantMessage: CopilotMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      sources: response.sources,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-900" data-testid="copilot-panel">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700"
        data-testid="copilot-header"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 text-white">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Copilot</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Read-only assistant</p>
          </div>
        </div>
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Demo Mode
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="copilot-messages">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`copilot-message-${message.role}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Sources ({message.sources.length})
                  </p>
                  <div className="space-y-2">
                    {message.sources.map((source, index) => (
                      <SourceCitation key={source.id} source={source} index={index + 1} />
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs opacity-60 mt-2">{message.timestamp.toLocaleTimeString()}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start" data-testid="copilot-loading">
            <div className="max-w-[85%] rounded-lg bg-gray-100 px-4 py-3 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 dark:border-gray-700"
        data-testid="copilot-input-form"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about projects, runs, blueprints..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
            data-testid="copilot-input"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="copilot-submit"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          This is a read-only demo. No actions will be performed.
        </p>
      </form>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
      />
    </svg>
  );
}
