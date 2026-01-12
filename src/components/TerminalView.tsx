/**
 * AFC-1.5: Terminal View Component
 *
 * Displays terminal output and handles input when in INTERACTIVE mode.
 * Implements read-only streaming with optional break-glass input.
 */

import { useState, useEffect, useRef } from 'react';
import { Terminal, Send, X, Eye, Keyboard, AlertCircle } from 'lucide-react';
import { TerminalSession, TerminalEvent } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

interface TerminalViewProps {
  session: TerminalSession;
  events: TerminalEvent[];
  onSendInput: (input: string) => void;
  onClose: () => void;
}

export function TerminalView({ session, events, onSendInput, onClose }: TerminalViewProps) {
  const [inputValue, setInputValue] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [events]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && session.mode === 'INTERACTIVE') {
      onSendInput(inputValue);
      setInputValue('');
    }
  };

  const renderEvent = (event: TerminalEvent) => {
    switch (event.type) {
      case 'OUTPUT':
        return (
          <div key={event.id} className="font-mono text-sm text-green-400">
            {(event.data as { text?: string })?.text || ''}
          </div>
        );
      case 'INPUT':
        return (
          <div key={event.id} className="font-mono text-sm text-blue-400">
            <span className="text-gray-500">{'> '}</span>
            {(event.data as { text?: string })?.text || ''}
          </div>
        );
      case 'MODE_CHANGE':
        return (
          <div
            key={event.id}
            className="font-mono text-xs text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded my-1"
          >
            [SYSTEM] Mode changed from {(event.data as { from?: string })?.from} to{' '}
            {(event.data as { to?: string })?.to}
            {(event.data as { reason?: string })?.reason &&
              ` - Reason: ${(event.data as { reason?: string })?.reason}`}
          </div>
        );
      case 'CONNECT':
        return (
          <div
            key={event.id}
            className="font-mono text-xs text-green-500 bg-green-900/20 px-2 py-1 rounded my-1"
          >
            [SYSTEM] Session connected
          </div>
        );
      case 'DISCONNECT':
        return (
          <div
            key={event.id}
            className="font-mono text-xs text-gray-500 bg-gray-900/20 px-2 py-1 rounded my-1"
          >
            [SYSTEM] Session disconnected
          </div>
        );
      case 'KILL':
        return (
          <div
            key={event.id}
            className="font-mono text-xs text-red-500 bg-red-900/20 px-2 py-1 rounded my-1"
          >
            [SYSTEM] Session terminated
            {(event.data as { reason?: string })?.reason &&
              ` - ${(event.data as { reason?: string })?.reason}`}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-3">
          <Terminal className="w-5 h-5 text-gray-600" />
          <span className="font-medium">{session.name}</span>
          {session.mode === 'INTERACTIVE' ? (
            <Badge variant="warning">
              <Keyboard className="w-3 h-3 mr-1" />
              Interactive
            </Badge>
          ) : (
            <Badge variant="info">
              <Eye className="w-3 h-3 mr-1" />
              Read-Only
            </Badge>
          )}
          {session.status !== 'ACTIVE' && <Badge variant="error">{session.status}</Badge>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-auto bg-gray-900 p-4 font-mono text-sm min-h-[300px]"
      >
        {events.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Waiting for output...</p>
          </div>
        ) : (
          events.map(renderEvent)
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-3 bg-gray-50">
        {session.mode === 'INTERACTIVE' ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Enter command..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              disabled={session.status !== 'ACTIVE'}
            />
            <Button type="submit" disabled={!inputValue.trim() || session.status !== 'ACTIVE'}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              Session is in read-only mode. Enable interactive mode from the matrix to send input.
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
