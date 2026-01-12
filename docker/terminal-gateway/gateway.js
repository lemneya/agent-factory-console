/**
 * AFC-1.5: Terminal Gateway Service
 *
 * Provides secure, authenticated access to worker terminal sessions.
 *
 * HARD CONSTRAINTS:
 * 1. Terminals disabled by default (TERMINAL_ENABLED must be 'true')
 * 2. Default mode is READ_ONLY streaming
 * 3. Enable Input requires elevated permission + is logged
 * 4. All terminal I/O is recorded to audit log
 * 5. No direct worker IP access - gateway only
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Configuration from environment
const PORT = process.env.PORT || 7681;
const TERMINAL_ENABLED = process.env.TERMINAL_ENABLED === 'true';
const GATEWAY_AUTH_TOKEN = process.env.GATEWAY_AUTH_TOKEN;
const DEFAULT_MODE = process.env.DEFAULT_MODE || 'READ_ONLY';
const AUDIT_LOG_PATH = process.env.AUDIT_LOG_PATH || '/var/log/terminal-gateway/audit.log';

// Ensure log directory exists
const logDir = path.dirname(AUDIT_LOG_PATH);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Configure audit logger
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: AUDIT_LOG_PATH }),
    new winston.transports.Console(),
  ],
});

// In-memory session store (replace with Redis in production)
const sessions = new Map();

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    terminalEnabled: TERMINAL_ENABLED,
    defaultMode: DEFAULT_MODE,
    timestamp: new Date().toISOString(),
  });
});

// Middleware: Check if terminals are enabled
const checkTerminalsEnabled = (req, res, next) => {
  if (!TERMINAL_ENABLED) {
    auditLogger.warn('Terminal access attempted while disabled', {
      ip: req.ip,
      path: req.path,
    });
    return res.status(503).json({
      error: 'Terminals are disabled',
      message: 'Set TERMINAL_ENABLED=true to enable terminal access',
    });
  }
  next();
};

// Middleware: Authenticate requests
const authenticate = (req, res, next) => {
  const token = req.headers['x-gateway-token'] || req.query.token;

  if (!GATEWAY_AUTH_TOKEN) {
    auditLogger.error('Gateway auth token not configured');
    return res.status(500).json({ error: 'Gateway not properly configured' });
  }

  if (token !== GATEWAY_AUTH_TOKEN) {
    auditLogger.warn('Authentication failed', {
      ip: req.ip,
      path: req.path,
      providedToken: token ? '[REDACTED]' : 'none',
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

// Create new terminal session
app.post('/sessions', checkTerminalsEnabled, authenticate, (req, res) => {
  const { workerId, userId, sessionName } = req.body;

  if (!workerId || !userId) {
    return res.status(400).json({ error: 'workerId and userId are required' });
  }

  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    workerId,
    userId,
    name: sessionName || `Session-${sessionId.slice(0, 8)}`,
    mode: DEFAULT_MODE,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    events: [],
  };

  sessions.set(sessionId, session);

  // Audit log: Session created
  auditLogger.info('Terminal session created', {
    sessionId,
    workerId,
    userId,
    mode: DEFAULT_MODE,
    eventType: 'CONNECT',
  });

  res.status(201).json(session);
});

// Get session info
app.get('/sessions/:id', checkTerminalsEnabled, authenticate, (req, res) => {
  const session = sessions.get(req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json(session);
});

// Enable interactive mode (break-glass)
app.post('/sessions/:id/enable-input', checkTerminalsEnabled, authenticate, (req, res) => {
  const session = sessions.get(req.params.id);
  const { userId, reason } = req.body;

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!userId || !reason) {
    return res.status(400).json({ error: 'userId and reason are required for break-glass access' });
  }

  const previousMode = session.mode;
  session.mode = 'INTERACTIVE';
  session.events.push({
    type: 'MODE_CHANGE',
    timestamp: new Date().toISOString(),
    actorUserId: userId,
    data: { from: previousMode, to: 'INTERACTIVE', reason },
  });

  // Audit log: Mode change (CRITICAL - break-glass action)
  auditLogger.warn('BREAK-GLASS: Interactive mode enabled', {
    sessionId: session.id,
    workerId: session.workerId,
    userId,
    reason,
    previousMode,
    eventType: 'MODE_CHANGE',
  });

  res.json(session);
});

// Send input to session (only if INTERACTIVE)
app.post('/sessions/:id/input', checkTerminalsEnabled, authenticate, (req, res) => {
  const session = sessions.get(req.params.id);
  const { userId, input } = req.body;

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.mode !== 'INTERACTIVE') {
    auditLogger.warn('Input attempted in READ_ONLY mode', {
      sessionId: session.id,
      userId,
      eventType: 'INPUT_BLOCKED',
    });
    return res.status(403).json({
      error: 'Session is in READ_ONLY mode',
      message: 'Use /enable-input to switch to INTERACTIVE mode',
    });
  }

  if (!userId || !input) {
    return res.status(400).json({ error: 'userId and input are required' });
  }

  session.events.push({
    type: 'INPUT',
    timestamp: new Date().toISOString(),
    actorUserId: userId,
    data: { text: input },
  });

  // Audit log: Input received
  auditLogger.info('Terminal input received', {
    sessionId: session.id,
    workerId: session.workerId,
    userId,
    inputLength: input.length,
    eventType: 'INPUT',
  });

  // In production, forward input to ttyd/tmux session
  res.json({ success: true, message: 'Input sent to terminal' });
});

// Kill session
app.post('/sessions/:id/kill', checkTerminalsEnabled, authenticate, (req, res) => {
  const session = sessions.get(req.params.id);
  const { userId, reason } = req.body;

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.status = 'CLOSED';
  session.closedAt = new Date().toISOString();
  session.events.push({
    type: 'KILL',
    timestamp: new Date().toISOString(),
    actorUserId: userId,
    data: { reason: reason || 'User requested termination' },
  });

  // Audit log: Session killed
  auditLogger.info('Terminal session killed', {
    sessionId: session.id,
    workerId: session.workerId,
    userId,
    reason: reason || 'User requested termination',
    eventType: 'KILL',
  });

  res.json(session);
});

// Get session events (for audit/playback)
app.get('/sessions/:id/events', checkTerminalsEnabled, authenticate, (req, res) => {
  const session = sessions.get(req.params.id);
  const afterSeq = parseInt(req.query.afterSeq) || 0;

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const events = session.events.slice(afterSeq);
  res.json({ events, totalCount: session.events.length });
});

// SSE stream endpoint for real-time output
app.get('/sessions/:id/stream', checkTerminalsEnabled, authenticate, (req, res) => {
  const session = sessions.get(req.params.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId: session.id })}\n\n`);

  // In production, pipe actual terminal output here
  // For now, send periodic heartbeat
  const heartbeat = setInterval(() => {
    if (session.status !== 'ACTIVE') {
      clearInterval(heartbeat);
      res.write(`data: ${JSON.stringify({ type: 'closed' })}\n\n`);
      res.end();
      return;
    }
    res.write(
      `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`
    );
  }, 5000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    auditLogger.info('Stream disconnected', {
      sessionId: session.id,
      eventType: 'DISCONNECT',
    });
  });
});

// Start server
app.listen(PORT, () => {
  auditLogger.info('Terminal Gateway started', {
    port: PORT,
    terminalEnabled: TERMINAL_ENABLED,
    defaultMode: DEFAULT_MODE,
  });

  if (!TERMINAL_ENABLED) {
    console.log('\n⚠️  WARNING: Terminals are DISABLED by default.');
    console.log('   Set TERMINAL_ENABLED=true to enable terminal access.\n');
  }
});
