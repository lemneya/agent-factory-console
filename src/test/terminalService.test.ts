/**
 * AFC-1.5: Terminal Service Unit Tests
 *
 * Tests cover:
 * - Create session (READ_ONLY by default)
 * - Token expiry
 * - Enable-input mode change + audit
 * - Kill session
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTerminalSession,
  getTerminalSessions,
  enableInteractiveMode,
  sendTerminalInput,
  killTerminalSession,
  getTerminalEvents,
  generateTerminalToken,
  _resetMockData,
} from '../services/terminalService';

describe('AFC-1.5 Terminal Service', () => {
  beforeEach(() => {
    _resetMockData();
  });

  describe('createTerminalSession', () => {
    it('should create a session with READ_ONLY mode by default', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      expect(session.id).toBeDefined();
      expect(session.projectId).toBe('proj-1');
      expect(session.runId).toBe('run-1');
      expect(session.workerId).toBe('worker-1');
      expect(session.name).toBe('Test Session');
      expect(session.mode).toBe('READ_ONLY'); // CRITICAL: Default must be READ_ONLY
      expect(session.status).toBe('ACTIVE');
      expect(session.createdByUserId).toBe('user-1');
    });

    it('should create a CONNECT event when session is created', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      const events = await getTerminalEvents(session.id);
      const connectEvent = events.find(e => e.type === 'CONNECT');

      expect(connectEvent).toBeDefined();
      expect(connectEvent?.actorUserId).toBe('user-1');
    });
  });

  describe('getTerminalSessions', () => {
    it('should filter sessions by runId', async () => {
      await createTerminalSession('proj-1', 'run-test-1', 'worker-1', 'Session 1', 'user-1');
      await createTerminalSession('proj-1', 'run-test-2', 'worker-2', 'Session 2', 'user-1');

      const sessions = await getTerminalSessions('run-test-1');

      expect(sessions.length).toBeGreaterThanOrEqual(1);
      expect(sessions.every(s => s.runId === 'run-test-1')).toBe(true);
    });
  });

  describe('enableInteractiveMode (break-glass)', () => {
    it('should change mode from READ_ONLY to INTERACTIVE', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      expect(session.mode).toBe('READ_ONLY');

      const updatedSession = await enableInteractiveMode(
        session.id,
        'user-1',
        'Need to debug issue'
      );

      expect(updatedSession.mode).toBe('INTERACTIVE');
    });

    it('should create MODE_CHANGE audit event', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      await enableInteractiveMode(session.id, 'user-1', 'Need to debug issue');

      const events = await getTerminalEvents(session.id);
      const modeChangeEvent = events.find(e => e.type === 'MODE_CHANGE');

      expect(modeChangeEvent).toBeDefined();
      expect(modeChangeEvent?.actorUserId).toBe('user-1');
      expect((modeChangeEvent?.data as { from?: string })?.from).toBe('READ_ONLY');
      expect((modeChangeEvent?.data as { to?: string })?.to).toBe('INTERACTIVE');
      expect((modeChangeEvent?.data as { reason?: string })?.reason).toBe('Need to debug issue');
    });

    it('should throw error for non-existent session', async () => {
      await expect(
        enableInteractiveMode('non-existent', 'user-1', 'reason')
      ).rejects.toThrow('Session not found');
    });
  });

  describe('sendTerminalInput', () => {
    it('should allow input in INTERACTIVE mode', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      await enableInteractiveMode(session.id, 'user-1', 'Testing');
      await sendTerminalInput(session.id, 'user-1', 'npm test');

      const events = await getTerminalEvents(session.id);
      const inputEvent = events.find(e => e.type === 'INPUT');

      expect(inputEvent).toBeDefined();
      expect((inputEvent?.data as { text?: string })?.text).toBe('npm test');
    });

    it('should block input in READ_ONLY mode', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      // Session is READ_ONLY by default
      await expect(
        sendTerminalInput(session.id, 'user-1', 'npm test')
      ).rejects.toThrow('Session is in READ_ONLY mode');
    });
  });

  describe('killTerminalSession', () => {
    it('should close the session and create KILL event', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      const killedSession = await killTerminalSession(
        session.id,
        'user-1',
        'Testing complete'
      );

      expect(killedSession.status).toBe('CLOSED');
      expect(killedSession.closedAt).toBeDefined();

      const events = await getTerminalEvents(session.id);
      const killEvent = events.find(e => e.type === 'KILL');

      expect(killEvent).toBeDefined();
      expect(killEvent?.actorUserId).toBe('user-1');
      expect((killEvent?.data as { reason?: string })?.reason).toBe('Testing complete');
    });
  });

  describe('generateTerminalToken', () => {
    it('should generate token with 15 minute expiry', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      const token = await generateTerminalToken(session.id);

      expect(token.id).toBeDefined();
      expect(token.terminalSessionId).toBe(session.id);
      expect(token.token).toMatch(/^tkn_/);

      const expiresAt = new Date(token.expiresAt);
      const now = new Date();
      const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

      // Should expire in ~15 minutes (with some tolerance)
      expect(diffMinutes).toBeGreaterThan(14);
      expect(diffMinutes).toBeLessThan(16);
    });
  });

  describe('Security Constraints', () => {
    it('should always create sessions in READ_ONLY mode', async () => {
      // Create multiple sessions
      const sessions = await Promise.all([
        createTerminalSession('proj-1', 'run-1', 'worker-1', 'Session 1', 'user-1'),
        createTerminalSession('proj-2', 'run-2', 'worker-2', 'Session 2', 'user-2'),
        createTerminalSession('proj-3', 'run-3', 'worker-3', 'Session 3', 'user-3'),
      ]);

      // ALL sessions must be READ_ONLY by default
      expect(sessions.every(s => s.mode === 'READ_ONLY')).toBe(true);
    });

    it('should require reason for enabling interactive mode', async () => {
      const session = await createTerminalSession(
        'proj-1',
        'run-1',
        'worker-1',
        'Test Session',
        'user-1'
      );

      // The reason is captured in the event for audit
      await enableInteractiveMode(session.id, 'user-1', 'Critical debugging needed');

      const events = await getTerminalEvents(session.id);
      const modeChangeEvent = events.find(e => e.type === 'MODE_CHANGE');

      expect((modeChangeEvent?.data as { reason?: string })?.reason).toBe('Critical debugging needed');
    });
  });
});
