/**
 * AFC-C2-STREAM-0: In-memory PubSub for C2 SSE streaming
 *
 * Session-scoped event bus for real-time C2 dashboard updates.
 * Acceptable for this gate; production would use Redis or similar.
 */

import { C2EventType, C2AgentState, C2ArtifactType } from '@prisma/client';

// Event payload types
export interface C2StreamEvent {
  id: string;
  type: C2EventType;
  timestamp: string;
  sessionId: string;
  payload: Record<string, unknown>;

  // Optional fields based on event type
  agentIndex?: number;
  agentState?: C2AgentState;
  progress?: number;
  level?: string;
  message?: string;
  artifactId?: string;
  artifactName?: string;
  artifactType?: C2ArtifactType;
}

// Subscriber callback type
type C2Subscriber = (event: C2StreamEvent) => void;

// Session-scoped subscribers map
const sessionSubscribers = new Map<string, Set<C2Subscriber>>();

/**
 * Subscribe to events for a specific C2 session
 */
export function subscribeToSession(sessionId: string, callback: C2Subscriber): () => void {
  if (!sessionSubscribers.has(sessionId)) {
    sessionSubscribers.set(sessionId, new Set());
  }

  const subscribers = sessionSubscribers.get(sessionId)!;
  subscribers.add(callback);

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0) {
      sessionSubscribers.delete(sessionId);
    }
  };
}

/**
 * Publish an event to all subscribers of a session
 */
export function publishToSession(sessionId: string, event: C2StreamEvent): void {
  const subscribers = sessionSubscribers.get(sessionId);
  if (!subscribers) return;

  for (const callback of subscribers) {
    try {
      callback(event);
    } catch (error) {
      console.error('[C2 PubSub] Error in subscriber callback:', error);
    }
  }
}

/**
 * Get subscriber count for a session (useful for debugging)
 */
export function getSubscriberCount(sessionId: string): number {
  return sessionSubscribers.get(sessionId)?.size ?? 0;
}

/**
 * Helper to create a unique event ID
 */
export function createEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Helper to create a C2StreamEvent
 */
export function createC2Event(
  sessionId: string,
  type: C2EventType,
  payload: Record<string, unknown>,
  extras?: Partial<C2StreamEvent>
): C2StreamEvent {
  return {
    id: createEventId(),
    type,
    timestamp: new Date().toISOString(),
    sessionId,
    payload,
    ...extras,
  };
}
