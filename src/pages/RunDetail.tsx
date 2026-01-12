/**
 * AFC-1.5: Run Detail Page with Terminals Tab
 *
 * Shows run details with tabs for Overview, Tasks, and Terminals.
 * Terminal Matrix provides spawn/attach/kill controls for worker sessions.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Terminal,
  ListTodo,
  LayoutDashboard,
} from 'lucide-react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  ProgressBar,
  TerminalMatrix,
  TerminalView,
  getRunStatusVariant,
} from '../components';
import { mockRuns, mockTerminalSessions, mockTerminalEvents } from '../data/mockData';
import { Run, TerminalSession, TerminalEvent } from '../types';
import {
  createTerminalSession,
  getTerminalSessions,
  getTerminalEvents,
  enableInteractiveMode,
  killTerminalSession,
  sendTerminalInput,
} from '../services/terminalService';

type TabType = 'overview' | 'tasks' | 'terminals';

export function RunDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [run, setRun] = useState<Run | null>(null);
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<TerminalSession | null>(null);
  const [sessionEvents, setSessionEvents] = useState<TerminalEvent[]>([]);

  // Load run data
  useEffect(() => {
    const foundRun = mockRuns.find(r => r.id === id);
    if (foundRun) {
      setRun(foundRun);
    }
  }, [id]);

  // Load terminal sessions for this run
  useEffect(() => {
    if (id) {
      loadSessions();
    }
  }, [id]);

  // Load events when session is selected
  useEffect(() => {
    if (selectedSession) {
      loadSessionEvents(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    try {
      const runSessions = await getTerminalSessions(id);
      setSessions(runSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      // Fallback to mock data filtered by runId
      setSessions(mockTerminalSessions.filter(s => s.runId === id));
    }
  };

  const loadSessionEvents = async (sessionId: string) => {
    try {
      const events = await getTerminalEvents(sessionId);
      setSessionEvents(events);
    } catch (error) {
      console.error('Failed to load events:', error);
      // Fallback to mock events
      setSessionEvents(mockTerminalEvents.filter(e => e.terminalSessionId === sessionId));
    }
  };

  const handleSpawnSession = async (workerType: string) => {
    if (!id || !run) return;

    const workerNames: Record<string, string> = {
      orchestrator: 'Orchestrator',
      backend: 'Backend Pod',
      frontend: 'Frontend Pod',
      qa: 'QA Pod',
    };

    try {
      const newSession = await createTerminalSession(
        run.projectId,
        id,
        `worker-${workerType}-${Date.now()}`,
        workerNames[workerType] || workerType,
        'current-user' // TODO: Get from auth context
      );
      setSessions([...sessions, newSession]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleEnableInput = async (sessionId: string) => {
    try {
      const updatedSession = await enableInteractiveMode(
        sessionId,
        'current-user', // TODO: Get from auth context
        'Break-glass access requested via UI'
      );
      setSessions(sessions.map(s => (s.id === sessionId ? updatedSession : s)));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(updatedSession);
        loadSessionEvents(sessionId);
      }
    } catch (error) {
      console.error('Failed to enable input:', error);
    }
  };

  const handleKillSession = async (sessionId: string) => {
    try {
      const killedSession = await killTerminalSession(
        sessionId,
        'current-user', // TODO: Get from auth context
        'User terminated session via UI'
      );
      setSessions(sessions.map(s => (s.id === sessionId ? killedSession : s)));
      if (selectedSession?.id === sessionId) {
        setSelectedSession(killedSession);
        loadSessionEvents(sessionId);
      }
    } catch (error) {
      console.error('Failed to kill session:', error);
    }
  };

  const handleSelectSession = (session: TerminalSession) => {
    setSelectedSession(session);
  };

  const handleSendInput = async (input: string) => {
    if (!selectedSession) return;

    try {
      await sendTerminalInput(selectedSession.id, 'current-user', input);
      loadSessionEvents(selectedSession.id);
    } catch (error) {
      console.error('Failed to send input:', error);
    }
  };

  const handleCloseTerminalView = () => {
    setSelectedSession(null);
    setSessionEvents([]);
  };

  if (!run) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-dark-400 mb-4" />
          <p className="text-dark-400">Run not found</p>
          <Button variant="secondary" className="mt-4" onClick={() => navigate('/runs')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Runs
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (run.status) {
      case 'running':
        return <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-primary-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-amber-400" />;
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'terminals', label: 'Terminals', icon: <Terminal className="w-4 h-4" /> },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" className="mb-4" onClick={() => navigate('/runs')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Runs
        </Button>

        <PageHeader
          title={
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <span>{run.agentName}</span>
              <Badge variant={getRunStatusVariant(run.status)} dot pulse={run.status === 'running'}>
                {run.status}
              </Badge>
            </div>
          }
          description={`${run.projectName} - Started ${new Date(run.startedAt).toLocaleString()}`}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-dark-700 mb-6">
        <nav className="flex gap-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-white'
                  : 'border-transparent text-dark-400 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'terminals' && sessions.filter(s => s.status === 'ACTIVE').length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-500/20 text-primary-400 rounded">
                  {sessions.filter(s => s.status === 'ACTIVE').length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <h3 className="text-lg font-semibold text-white mb-4">Progress</h3>
              <ProgressBar value={run.completedTasks} max={run.taskCount} showLabel size="lg" />
              <p className="text-sm text-dark-400 mt-2">
                {run.completedTasks} of {run.taskCount} tasks completed
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent>
                <h4 className="text-sm text-dark-400 mb-1">Agent</h4>
                <p className="text-white font-medium">{run.agentName}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h4 className="text-sm text-dark-400 mb-1">Project</h4>
                <p className="text-white font-medium">{run.projectName}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <Card>
          <CardContent>
            <p className="text-dark-400">Task list coming soon...</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'terminals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Terminal Matrix */}
          <div className={selectedSession ? '' : 'lg:col-span-2'}>
            <TerminalMatrix
              sessions={sessions}
              onSpawnSession={handleSpawnSession}
              onEnableInput={handleEnableInput}
              onKillSession={handleKillSession}
              onSelectSession={handleSelectSession}
            />
          </div>

          {/* Terminal View (when session selected) */}
          {selectedSession && (
            <div className="lg:sticky lg:top-4 h-[600px]">
              <TerminalView
                session={selectedSession}
                events={sessionEvents}
                onSendInput={handleSendInput}
                onClose={handleCloseTerminalView}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
