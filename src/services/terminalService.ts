/**
 * AFC-1.5: Terminal Service
 *
 * Provides API operations for terminal session management.
 * Uses mock data for MVP, connects to terminal-gateway in production.
 */

import { TerminalSession, TerminalEvent, TerminalToken } from '../types';
import { mockTerminalSessions, mockTerminalEvents } from '../data/mockData';

// Simulated in-memory store for MVP (replace with actual API calls)
let sessions = [...mockTerminalSessions];
let events = [...mockTerminalEvents];
let eventSeq = events.length + 1;

// API base URL (configure via environment in production)
const API_BASE = '/api/terminals';

/**
 * Create a new terminal session
 */
export async function createTerminalSession(
  projectId: string,
  runId: string,
  workerId: string,
  name: string,
  userId: string
): Promise<TerminalSession> {
  // MVP: Create session in memory
  const newSession: TerminalSession = {
    id: `term-${Date.now()}`,
    projectId,
    runId,
    workerId,
    name,
    mode: 'READ_ONLY', // Default: READ_ONLY for safety
    status: 'ACTIVE',
    createdByUserId: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  sessions.push(newSession);

  // Log connect event
  const connectEvent: TerminalEvent = {
    id: `evt-${Date.now()}`,
    terminalSessionId: newSession.id,
    ts: new Date().toISOString(),
    type: 'CONNECT',
    actorUserId: userId,
    seq: eventSeq++,
    data: { message: 'Session started' },
  };
  events.push(connectEvent);

  return newSession;
}

/**
 * Get terminal sessions for a run
 */
export async function getTerminalSessions(runId?: string): Promise<TerminalSession[]> {
  if (runId) {
    return sessions.filter(s => s.runId === runId);
  }
  return sessions;
}

/**
 * Get a specific terminal session
 */
export async function getTerminalSession(sessionId: string): Promise<TerminalSession | null> {
  return sessions.find(s => s.id === sessionId) || null;
}

/**
 * Enable interactive mode (break-glass)
 * IMPORTANT: This is a privileged action that is audited
 */
export async function enableInteractiveMode(
  sessionId: string,
  userId: string,
  reason: string
): Promise<TerminalSession> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.status !== 'ACTIVE') {
    throw new Error('Session is not active');
  }

  const previousMode = session.mode;
  session.mode = 'INTERACTIVE';
  session.updatedAt = new Date().toISOString();

  // Log mode change event (CRITICAL audit log)
  const modeChangeEvent: TerminalEvent = {
    id: `evt-${Date.now()}`,
    terminalSessionId: sessionId,
    ts: new Date().toISOString(),
    type: 'MODE_CHANGE',
    actorUserId: userId,
    seq: eventSeq++,
    data: {
      from: previousMode,
      to: 'INTERACTIVE',
      reason,
    },
  };
  events.push(modeChangeEvent);

  console.warn(
    `[AUDIT] BREAK-GLASS: User ${userId} enabled INTERACTIVE mode on session ${sessionId}. Reason: ${reason}`
  );

  return session;
}

/**
 * Send input to terminal session (only if INTERACTIVE)
 */
export async function sendTerminalInput(
  sessionId: string,
  userId: string,
  input: string
): Promise<void> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (session.mode !== 'INTERACTIVE') {
    throw new Error('Session is in READ_ONLY mode. Enable interactive mode first.');
  }

  if (session.status !== 'ACTIVE') {
    throw new Error('Session is not active');
  }

  // Log input event
  const inputEvent: TerminalEvent = {
    id: `evt-${Date.now()}`,
    terminalSessionId: sessionId,
    ts: new Date().toISOString(),
    type: 'INPUT',
    actorUserId: userId,
    seq: eventSeq++,
    data: { text: input },
  };
  events.push(inputEvent);

  console.log(`[AUDIT] INPUT: User ${userId} sent input to session ${sessionId}`);
}

/**
 * Kill a terminal session
 */
export async function killTerminalSession(
  sessionId: string,
  userId: string,
  reason?: string
): Promise<TerminalSession> {
  const session = sessions.find(s => s.id === sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  session.status = 'CLOSED';
  session.closedAt = new Date().toISOString();
  session.updatedAt = new Date().toISOString();

  // Log kill event
  const killEvent: TerminalEvent = {
    id: `evt-${Date.now()}`,
    terminalSessionId: sessionId,
    ts: new Date().toISOString(),
    type: 'KILL',
    actorUserId: userId,
    seq: eventSeq++,
    data: { reason: reason || 'User requested termination' },
  };
  events.push(killEvent);

  console.log(`[AUDIT] KILL: User ${userId} killed session ${sessionId}. Reason: ${reason || 'N/A'}`);

  return session;
}

/**
 * Get events for a terminal session (for audit/playback)
 */
export async function getTerminalEvents(
  sessionId: string,
  afterSeq?: number
): Promise<TerminalEvent[]> {
  let sessionEvents = events.filter(e => e.terminalSessionId === sessionId);

  if (afterSeq !== undefined) {
    sessionEvents = sessionEvents.filter(e => e.seq > afterSeq);
  }

  return sessionEvents.sort((a, b) => a.seq - b.seq);
}

/**
 * Subscribe to terminal output stream (SSE)
 * Returns an EventSource for real-time updates
 */
export function subscribeToTerminalStream(sessionId: string): EventSource | null {
  // In production, connect to actual SSE endpoint
  const streamUrl = `${API_BASE}/${sessionId}/stream`;

  try {
    return new EventSource(streamUrl);
  } catch {
    console.error('Failed to create EventSource for terminal stream');
    return null;
  }
}

/**
 * Generate ephemeral token for terminal access
 */
export async function generateTerminalToken(sessionId: string): Promise<TerminalToken> {
  const token: TerminalToken = {
    id: `token-${Date.now()}`,
    terminalSessionId: sessionId,
    token: `tkn_${Math.random().toString(36).substring(2, 15)}`,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 min expiry
    createdAt: new Date().toISOString(),
  };

  return token;
}

// Export for testing
export function _resetMockData() {
  sessions = [...mockTerminalSessions];
  events = [...mockTerminalEvents];
  eventSeq = events.length + 1;
}
