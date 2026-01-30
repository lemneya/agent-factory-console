/**
 * AFC-C2-MOLTBOT-INGEST-1: Secure Moltbot Ingest Endpoint
 *
 * POST /api/c2/ingest/moltbot
 *
 * Security:
 * - Bearer token auth via MOLTBOT_INGEST_TOKEN
 * - Identity mapping via ExternalAgentIdentity
 * - Strict payload validation (no extra fields)
 * - Session ownership enforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { publishToSession, createC2Event } from '@/lib/c2-pubsub';
import { Prisma } from '@prisma/client';

// Valid event types
const VALID_EVENT_TYPES = ['brain.message', 'brain.thought', 'brain.decision'] as const;
type MoltbotEventType = (typeof VALID_EVENT_TYPES)[number];

// Valid sources
const VALID_SOURCES = ['whatsapp', 'telegram', 'web'] as const;
type MoltbotSource = (typeof VALID_SOURCES)[number];

// Payload schema interface
interface MoltbotEvent {
  type: MoltbotEventType;
  content: string;
  confidence?: number;
  tags?: string[];
}

interface MoltbotPayload {
  sessionId: string;
  event: MoltbotEvent;
}

/**
 * Validate the ingest token
 */
function validateToken(request: NextRequest): { valid: true } | { valid: false; error: string; status: number } {
  const token = process.env.MOLTBOT_INGEST_TOKEN;

  if (!token) {
    console.error('[Moltbot Ingest] MOLTBOT_INGEST_TOKEN not configured');
    return { valid: false, error: 'Ingest endpoint not configured', status: 500 };
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header', status: 401 };
  }

  const [scheme, providedToken] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !providedToken) {
    return { valid: false, error: 'Invalid Authorization header format', status: 401 };
  }

  if (providedToken !== token) {
    return { valid: false, error: 'Invalid token', status: 401 };
  }

  return { valid: true };
}

/**
 * Validate required headers
 */
function validateHeaders(request: NextRequest): {
  valid: true;
  provider: string;
  externalId: string;
  source: MoltbotSource;
} | { valid: false; error: string; status: number } {
  const provider = request.headers.get('x-moltbot-provider');
  const externalId = request.headers.get('x-moltbot-external-id');
  const source = request.headers.get('x-moltbot-source') as MoltbotSource | null;

  if (!provider) {
    return { valid: false, error: 'Missing X-Moltbot-Provider header', status: 400 };
  }

  if (provider !== 'moltbot') {
    return { valid: false, error: 'Invalid X-Moltbot-Provider value', status: 400 };
  }

  if (!externalId) {
    return { valid: false, error: 'Missing X-Moltbot-External-Id header', status: 400 };
  }

  if (!source) {
    return { valid: false, error: 'Missing X-Moltbot-Source header', status: 400 };
  }

  if (!VALID_SOURCES.includes(source)) {
    return { valid: false, error: `Invalid X-Moltbot-Source. Must be one of: ${VALID_SOURCES.join(', ')}`, status: 400 };
  }

  return { valid: true, provider, externalId, source };
}

/**
 * Validate payload schema strictly (no extra fields allowed)
 */
function validatePayload(body: unknown): {
  valid: true;
  payload: MoltbotPayload;
} | { valid: false; error: string; status: number } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object', status: 400 };
  }

  const obj = body as Record<string, unknown>;

  // Check for extra top-level fields
  const allowedTopLevel = ['sessionId', 'event'];
  const extraTopLevel = Object.keys(obj).filter((k) => !allowedTopLevel.includes(k));
  if (extraTopLevel.length > 0) {
    return { valid: false, error: `Extra fields not allowed: ${extraTopLevel.join(', ')}`, status: 400 };
  }

  // Validate sessionId
  if (typeof obj.sessionId !== 'string') {
    return { valid: false, error: 'sessionId must be a string', status: 400 };
  }
  if (obj.sessionId.length < 10) {
    return { valid: false, error: 'sessionId must be at least 10 characters', status: 400 };
  }

  // Validate event object
  if (!obj.event || typeof obj.event !== 'object') {
    return { valid: false, error: 'event must be an object', status: 400 };
  }

  const event = obj.event as Record<string, unknown>;

  // Check for extra event fields
  const allowedEventFields = ['type', 'content', 'confidence', 'tags'];
  const extraEventFields = Object.keys(event).filter((k) => !allowedEventFields.includes(k));
  if (extraEventFields.length > 0) {
    return { valid: false, error: `Extra fields in event not allowed: ${extraEventFields.join(', ')}`, status: 400 };
  }

  // Validate event.type
  if (typeof event.type !== 'string') {
    return { valid: false, error: 'event.type must be a string', status: 400 };
  }
  if (!VALID_EVENT_TYPES.includes(event.type as MoltbotEventType)) {
    return { valid: false, error: `Invalid event.type. Must be one of: ${VALID_EVENT_TYPES.join(', ')}`, status: 400 };
  }

  // Validate event.content
  if (typeof event.content !== 'string') {
    return { valid: false, error: 'event.content must be a string', status: 400 };
  }
  if (event.content.length < 1) {
    return { valid: false, error: 'event.content must not be empty', status: 400 };
  }
  if (event.content.length > 5000) {
    return { valid: false, error: 'event.content must not exceed 5000 characters', status: 400 };
  }

  // Validate event.confidence (optional)
  if (event.confidence !== undefined) {
    if (typeof event.confidence !== 'number') {
      return { valid: false, error: 'event.confidence must be a number', status: 400 };
    }
    if (event.confidence < 0 || event.confidence > 1) {
      return { valid: false, error: 'event.confidence must be between 0 and 1', status: 400 };
    }
  }

  // Validate event.tags (optional)
  if (event.tags !== undefined) {
    if (!Array.isArray(event.tags)) {
      return { valid: false, error: 'event.tags must be an array', status: 400 };
    }
    if (event.tags.length > 10) {
      return { valid: false, error: 'event.tags must not exceed 10 items', status: 400 };
    }
    for (const tag of event.tags) {
      if (typeof tag !== 'string') {
        return { valid: false, error: 'event.tags must contain only strings', status: 400 };
      }
    }
  }

  return {
    valid: true,
    payload: {
      sessionId: obj.sessionId as string,
      event: {
        type: event.type as MoltbotEventType,
        content: event.content as string,
        confidence: event.confidence as number | undefined,
        tags: event.tags as string[] | undefined,
      },
    },
  };
}

/**
 * POST /api/c2/ingest/moltbot
 */
export async function POST(request: NextRequest) {
  // 1. Validate token
  const tokenResult = validateToken(request);
  if (!tokenResult.valid) {
    return NextResponse.json({ error: tokenResult.error }, { status: tokenResult.status });
  }

  // 2. Validate headers
  const headerResult = validateHeaders(request);
  if (!headerResult.valid) {
    return NextResponse.json({ error: headerResult.error }, { status: headerResult.status });
  }
  const { provider, externalId, source } = headerResult;

  // 3. Resolve identity
  const identity = await prisma.externalAgentIdentity.findUnique({
    where: {
      provider_externalId: { provider, externalId },
    },
  });

  if (!identity) {
    return NextResponse.json(
      { error: 'Unknown identity. No mapping found for this provider/externalId.' },
      { status: 403 }
    );
  }

  const userId = identity.userId;

  // 4. Parse and validate payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const payloadResult = validatePayload(body);
  if (!payloadResult.valid) {
    return NextResponse.json({ error: payloadResult.error }, { status: payloadResult.status });
  }
  const { payload } = payloadResult;

  // 5. Verify session exists and ownership
  const session = await prisma.c2Session.findUnique({
    where: { id: payload.sessionId },
    select: { id: true, userId: true },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Strict ownership check (no null userId sessions allowed)
  if (!session.userId || session.userId !== userId) {
    return NextResponse.json(
      { error: 'Forbidden: Session does not belong to this identity' },
      { status: 403 }
    );
  }

  // 6. Determine log level based on event type
  let level: string;
  const isDecision = payload.event.type === 'brain.decision';

  switch (payload.event.type) {
    case 'brain.message':
      level = 'INFO';
      break;
    case 'brain.thought':
      level = 'DEBUG';
      break;
    case 'brain.decision':
      level = 'INFO';
      break;
    default:
      level = 'INFO';
  }

  // 7. Build message with source context
  const sourceEmoji = source === 'whatsapp' ? 'WhatsApp' : source === 'telegram' ? 'Telegram' : 'Web';
  const displayName = identity.displayName || externalId;
  const messagePrefix = `🧠 Moltbot • ${sourceEmoji} • ${displayName}`;
  const message = `${messagePrefix}: ${payload.event.content}`;

  // 8. Create C2Event record
  const eventPayload: Prisma.InputJsonValue = {
    source: 'moltbot',
    moltbotSource: source,
    externalId,
    eventType: payload.event.type,
    displayName,
    ...(payload.event.confidence !== undefined && { confidence: payload.event.confidence }),
    ...(payload.event.tags !== undefined && { tags: payload.event.tags }),
    ...(isDecision && { decision: true }),
  };

  const c2Event = await prisma.c2Event.create({
    data: {
      sessionId: payload.sessionId,
      type: 'LOG',
      payload: eventPayload,
      level,
      message,
    },
  });

  // 9. Publish to SSE stream
  publishToSession(
    payload.sessionId,
    createC2Event(
      payload.sessionId,
      'LOG',
      eventPayload as Record<string, unknown>,
      {
        level,
        message,
      }
    )
  );

  // 10. Return success
  return NextResponse.json(
    {
      id: c2Event.id,
      message: 'Event ingested successfully',
    },
    { status: 201 }
  );
}
