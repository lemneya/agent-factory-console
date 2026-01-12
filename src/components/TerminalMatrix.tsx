/**
 * AFC-1.5: Terminal Matrix Component
 *
 * Displays a grid of terminal sessions with status, mode, and actions.
 * Implements safety controls: read-only by default, break-glass for input.
 */

import { useState } from 'react';
import { Terminal, Play, Square, AlertTriangle, Eye, Keyboard, RefreshCw } from 'lucide-react';
import { TerminalSession, TerminalMode } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';

interface TerminalMatrixProps {
  sessions: TerminalSession[];
  onSpawnSession: (workerType: string) => void;
  onEnableInput: (sessionId: string) => void;
  onKillSession: (sessionId: string) => void;
  onSelectSession: (session: TerminalSession) => void;
}

const WORKER_TYPES = [
  { id: 'orchestrator', name: 'Orchestrator', icon: '🎯' },
  { id: 'backend', name: 'Backend Pod', icon: '⚙️' },
  { id: 'frontend', name: 'Frontend Pod', icon: '🖥️' },
  { id: 'qa', name: 'QA Pod', icon: '🧪' },
];

export function TerminalMatrix({
  sessions,
  onSpawnSession,
  onEnableInput,
  onKillSession,
  onSelectSession,
}: TerminalMatrixProps) {
  const [showBreakGlassWarning, setShowBreakGlassWarning] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>;
      case 'CLOSED':
        return <Badge variant="default">Closed</Badge>;
      case 'ERROR':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getModeBadge = (mode: TerminalMode) => {
    if (mode === 'INTERACTIVE') {
      return (
        <Badge variant="warning">
          <Keyboard className="w-3 h-3 mr-1" />
          Interactive
        </Badge>
      );
    }
    return (
      <Badge variant="info">
        <Eye className="w-3 h-3 mr-1" />
        Read-Only
      </Badge>
    );
  };

  const handleEnableInputClick = (sessionId: string) => {
    setShowBreakGlassWarning(sessionId);
  };

  const confirmEnableInput = (sessionId: string) => {
    onEnableInput(sessionId);
    setShowBreakGlassWarning(null);
  };

  return (
    <div className="space-y-6">
      {/* Spawn Buttons */}
      <Card>
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Spawn Terminal Session</h3>
          <div className="flex flex-wrap gap-2">
            {WORKER_TYPES.map(worker => (
              <Button
                key={worker.id}
                variant="secondary"
                size="sm"
                onClick={() => onSpawnSession(worker.id)}
              >
                <Play className="w-4 h-4 mr-1" />
                {worker.icon} {worker.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.length === 0 ? (
          <Card className="col-span-full">
            <div className="p-8 text-center text-gray-500">
              <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No terminal sessions active</p>
              <p className="text-sm mt-1">Click a spawn button above to create a new session</p>
            </div>
          </Card>
        ) : (
          sessions.map(session => (
            <Card
              key={session.id}
              className={`cursor-pointer hover:border-blue-300 transition-colors ${
                session.status === 'ACTIVE' ? 'border-green-200' : 'opacity-60'
              }`}
              onClick={() => onSelectSession(session)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">{session.name}</span>
                  </div>
                  {getStatusBadge(session.status)}
                </div>

                {/* Mode */}
                <div className="mb-3">{getModeBadge(session.mode)}</div>

                {/* Info */}
                <div className="text-xs text-gray-500 space-y-1 mb-4">
                  <p>ID: {session.id}</p>
                  <p>Started: {new Date(session.createdAt).toLocaleTimeString()}</p>
                  {session.closedAt && (
                    <p>Closed: {new Date(session.closedAt).toLocaleTimeString()}</p>
                  )}
                </div>

                {/* Actions */}
                {session.status === 'ACTIVE' && (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {session.mode === 'READ_ONLY' && (
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleEnableInputClick(session.id)}
                      >
                        <Keyboard className="w-4 h-4 mr-1" />
                        Enable Input
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => onKillSession(session.id)}>
                      <Square className="w-4 h-4 mr-1" />
                      Kill
                    </Button>
                  </div>
                )}

                {session.status === 'CLOSED' && (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="secondary" size="sm" disabled>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Reconnect
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Break-Glass Warning Modal */}
      {showBreakGlassWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold">Enable Interactive Mode?</h3>
              </div>

              <div className="mb-6 space-y-3">
                <p className="text-gray-600">
                  You are about to enable <strong>break-glass</strong> interactive access to this
                  terminal session.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                  <p className="font-medium text-yellow-800 mb-1">This action will be audited:</p>
                  <ul className="text-yellow-700 list-disc list-inside space-y-1">
                    <li>Your user ID will be recorded</li>
                    <li>All input will be logged</li>
                    <li>Timestamp will be captured</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-500">
                  Only proceed if you need to intervene in the worker&apos;s operation.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setShowBreakGlassWarning(null)}>
                  Cancel
                </Button>
                <Button variant="warning" onClick={() => confirmEnableInput(showBreakGlassWarning)}>
                  <Keyboard className="w-4 h-4 mr-1" />
                  Enable Input
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
