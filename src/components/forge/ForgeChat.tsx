'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  type ChatMessage,
  type ChatSession,
  type ChatAgentResponse,
  createChatSession,
  processMessage,
  QUICK_ACTIONS,
} from '@/lib/forge/chat-agent';
import type { DecomposedSpec } from '@/lib/forge';

interface ForgeChatProps {
  buildId: string;
  decomposition: DecomposedSpec;
  onActionRequested?: (action: ChatAgentResponse['action']) => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export default function ForgeChat({
  buildId,
  decomposition,
  onActionRequested,
  isMinimized = false,
  onToggleMinimize,
}: ForgeChatProps) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session
  useEffect(() => {
    if (!session && decomposition) {
      setSession(createChatSession(buildId, decomposition));
    }
  }, [buildId, decomposition, session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // Focus input when expanded
  useEffect(() => {
    if (!isMinimized) {
      inputRef.current?.focus();
    }
  }, [isMinimized]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !session || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setShowQuickActions(false);

    // Process message locally first (instant feedback)
    const { session: updatedSession, response } = processMessage(session, userMessage);
    setSession(updatedSession);

    // If there's an action, notify parent
    if (response.action && onActionRequested) {
      onActionRequested(response.action);
    }

    // Simulate a slight delay for natural feel
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
  }, [input, session, isLoading, onActionRequested]);

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isMinimized) {
    return (
      <button
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        {/* Notification dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center">
          ?
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Build Assistant</h3>
            <p className="text-xs text-white/70">Ask me to modify your build</p>
          </div>
        </div>
        <button
          onClick={onToggleMinimize}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm">Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && session?.messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.slice(0, 4).map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.prompt)}
                className="px-3 py-1.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to change something..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MESSAGE BUBBLE
// ============================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
        }`}
      >
        {/* Message content with markdown-like formatting */}
        <div className="text-sm whitespace-pre-wrap">
          {formatMessage(message.content)}
        </div>

        {/* Status indicator for actions */}
        {message.metadata?.status && (
          <div className="mt-2 pt-2 border-t border-white/20 dark:border-gray-700">
            <span className={`text-xs ${
              message.metadata.status === 'completed' ? 'text-green-400' :
              message.metadata.status === 'failed' ? 'text-red-400' :
              message.metadata.status === 'processing' ? 'text-blue-400' :
              'text-gray-400'
            }`}>
              {message.metadata.status === 'completed' && '✓ Completed'}
              {message.metadata.status === 'failed' && '✗ Failed'}
              {message.metadata.status === 'processing' && '⏳ Processing...'}
              {message.metadata.status === 'pending' && '⏸ Pending confirmation'}
            </span>
          </div>
        )}

        {/* Timestamp */}
        <div className={`mt-1 text-[10px] ${isUser ? 'text-white/60' : 'text-gray-500 dark:text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

// ============================================
// HELPERS
// ============================================

function formatMessage(content: string): React.ReactNode {
  // Simple markdown-like formatting
  const lines = content.split('\n');

  return lines.map((line, i) => {
    // Bold
    let formatted: React.ReactNode = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Code
    if (typeof formatted === 'string') {
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-black/10 dark:bg-white/10 rounded text-xs">$1</code>');
    }

    // Convert to JSX
    if (typeof formatted === 'string' && (formatted.includes('<strong>') || formatted.includes('<code'))) {
      return (
        <span key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }

    // List items
    if (line.startsWith('- ')) {
      return (
        <div key={i} className="flex items-start gap-2">
          <span className="text-blue-500">•</span>
          <span>{line.slice(2)}</span>
        </div>
      );
    }

    return <div key={i}>{line || <br />}</div>;
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
