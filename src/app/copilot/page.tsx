'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { SignedOutCTA } from '@/components/auth/SignedOutCTA';

interface Source {
  type: 'DOC' | 'DB';
  ref: string;
  title: string;
  snippet: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
}

// Quick prompt buttons
const QUICK_PROMPTS = [
  { label: 'Explain Council Gate', prompt: 'Explain the Council Gate and how it works' },
  { label: 'Explain Ralph Mode', prompt: 'What is Ralph Mode and when should I use it?' },
  { label: 'How do I start a BUILD run?', prompt: 'How do I start a BUILD run in Agent Factory?' },
  {
    label: 'What is a Blueprint and Slicer?',
    prompt: 'What is a Blueprint and how does the Slicer work?',
  },
];

function CopilotContent() {
  const { status } = useSession();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get('demo') === '1';

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scope, setScope] = useState<'global' | 'project' | 'run'>('global');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is signed out and not in demo mode
  const isSignedOut = status === 'unauthenticated' && !demoMode;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input.trim());
  };

  const sendMessage = async (message: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          projectId: scope === 'project' ? selectedProject : null,
          runId: scope === 'run' ? selectedRun : null,
          mode: 'ASK',
          demoMode,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.answer || 'No response received.',
        sources: data.sources || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        sources: [],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSourceExpanded = (sourceRef: string) => {
    setExpandedSources(prev => {
      const next = new Set(prev);
      if (next.has(sourceRef)) {
        next.delete(sourceRef);
      } else {
        next.add(sourceRef);
      }
      return next;
    });
  };

  // Show SignedOutCTA if not authenticated and not in demo mode
  if (isSignedOut) {
    return (
      <div data-testid="page-root">
        <h1
          className="text-2xl font-bold text-gray-900 dark:text-white mb-6"
          data-testid="page-title"
        >
          Copilot
        </h1>
        <SignedOutCTA />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="page-root">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
            Copilot
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            AI assistant for Agent Factory Console
          </p>
        </div>
        {demoMode && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            DEMO (read-only)
          </span>
        )}
      </div>

      {/* Main content - 2 columns */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left: Chat */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="copilot-chat">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                <p className="text-lg font-medium mb-2">Welcome to Copilot!</p>
                <p className="text-sm">
                  Ask me about AFC features, project status, or what to do next.
                </p>
              </div>
            )}
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div
                      className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                      data-testid="copilot-sources"
                    >
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Sources ({message.sources.length})
                      </p>
                      <div className="space-y-2">
                        {message.sources.map((source, idx) => (
                          <div
                            key={`${source.ref}-${idx}`}
                            className={`rounded-md p-2 cursor-pointer ${
                              source.type === 'DOC'
                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                : 'bg-green-50 dark:bg-green-900/20'
                            }`}
                            onClick={() => toggleSourceExpanded(source.ref)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {source.type === 'DOC' ? '📖' : '🗄️'}
                              </span>
                              <span className="text-xs font-medium truncate">{source.title}</span>
                            </div>
                            {expandedSources.has(source.ref) && (
                              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                <p className="font-mono text-[10px] text-gray-400 mb-1">
                                  {source.ref}
                                </p>
                                <p>{source.snippet}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No sources message */}
                  {message.role === 'assistant' &&
                    (!message.sources || message.sources.length === 0) && (
                      <div
                        className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                        data-testid="copilot-sources"
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          No sources available; ask a more specific question.
                        </p>
                      </div>
                    )}

                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
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
                data-testid="copilot-send"
              >
                Send
              </button>
            </div>
          </form>
        </div>

        {/* Right: Context panel */}
        <div
          className="w-80 flex-shrink-0 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          data-testid="copilot-context"
        >
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Context</h3>

          {/* Scope selector */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Scope
            </label>
            <select
              value={scope}
              onChange={e => setScope(e.target.value as 'global' | 'project' | 'run')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="global">Global (default)</option>
              <option value="project">Project</option>
              <option value="run">Run</option>
            </select>

            {scope === 'project' && (
              <input
                type="text"
                placeholder="Project ID"
                value={selectedProject || ''}
                onChange={e => setSelectedProject(e.target.value || null)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            )}

            {scope === 'run' && (
              <input
                type="text"
                placeholder="Run ID"
                value={selectedRun || ''}
                onChange={e => setSelectedRun(e.target.value || null)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            )}
          </div>

          {/* Quick prompts */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Quick Prompts
            </label>
            <div className="space-y-2">
              {QUICK_PROMPTS.map(qp => (
                <button
                  key={qp.label}
                  onClick={() => sendMessage(qp.prompt)}
                  disabled={isLoading}
                  className="w-full text-left rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <strong>Read-only mode:</strong> Copilot can answer questions but cannot create runs,
              modify data, or trigger actions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <CopilotContent />
    </Suspense>
  );
}
