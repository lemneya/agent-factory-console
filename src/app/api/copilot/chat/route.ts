/**
 * Copilot Chat API Route
 * UX-GATE-COPILOT-0: Read-only Copilot with cited answers
 * UX-GATE-COPILOT-1: Draft mode support
 *
 * HARD CONSTRAINTS:
 * - MUST NOT write to any tables except Copilot audit log
 * - MUST NOT call: /api/runs POST, worker endpoints, terminal endpoints
 * - MUST NOT create/update/delete anything except audit logging
 * - Draft mode generates structured payloads but does NOT execute them
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { retrieveDocs, DocChunk } from '@/knowledge/docsLoader';
import { getDBContext, isDBAvailable, DBSource } from '@/knowledge/dbContext';
import {
  generateCopilotResponse,
  CopilotSource,
  CopilotMode,
  DraftKind,
} from '@/services/llm/provider';
import { PrismaClient } from '@prisma/client';

// Request body type
interface ChatRequest {
  message: string;
  projectId?: string | null;
  runId?: string | null;
  mode?: 'ASK' | 'DRAFT';
  draftType?: 'BLUEPRINT' | 'WORKORDERS' | 'COUNCIL';
  demoMode?: boolean;
}

// Response body type
interface ChatResponse {
  answer: string;
  sources: CopilotSource[];
  dbAvailable?: boolean;
  llmUsed?: boolean;
  draftPayload?: Record<string, unknown>;
  draftTitle?: string;
}

// Singleton Prisma client for audit logging
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient | null {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch {
      return null;
    }
  }
  return prisma;
}

/**
 * Log Copilot message to audit table (write-only exception)
 */
async function logCopilotMessage(
  role: 'USER' | 'ASSISTANT',
  content: string,
  userId?: string | null,
  projectId?: string | null,
  runId?: string | null,
  sourcesJson?: CopilotSource[] | null
): Promise<void> {
  const db = getPrisma();
  if (!db) return;

  try {
    await db.copilotMessage.create({
      data: {
        role,
        content,
        userId: userId || null,
        projectId: projectId || null,
        runId: runId || null,
        sourcesJson: sourcesJson ? JSON.parse(JSON.stringify(sourcesJson)) : null,
      },
    });
  } catch (error) {
    // Skip audit logging gracefully if DB unavailable
    console.warn('Could not log Copilot message:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ChatRequest = await request.json();
    const { message, projectId, runId, mode = 'ASK', draftType, demoMode = false } = body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate mode
    const copilotMode: CopilotMode = mode === 'DRAFT' ? 'DRAFT' : 'ASK';

    // Validate draftType if in draft mode
    let draftKind: DraftKind | undefined;
    if (copilotMode === 'DRAFT') {
      if (!draftType || !['BLUEPRINT', 'WORKORDERS', 'COUNCIL'].includes(draftType)) {
        return NextResponse.json(
          { error: 'draftType is required for DRAFT mode (BLUEPRINT, WORKORDERS, or COUNCIL)' },
          { status: 400 }
        );
      }
      draftKind = draftType as DraftKind;
    }

    // Get session for user ID (optional)
    let userId: string | null = null;
    try {
      const session = await getServerSession(authOptions);
      userId = session?.user?.email || null;
    } catch {
      // Session not available, continue as anonymous
    }

    // Check DB availability
    const dbAvailable = await isDBAvailable();

    // Log user message (audit)
    await logCopilotMessage('USER', message.trim(), userId, projectId, runId);

    // Retrieve relevant docs
    const docChunks: DocChunk[] = retrieveDocs(message.trim());

    // Get DB context (read-only)
    let dbContext = '';
    let dbSources: DBSource[] = [];

    if (!demoMode && dbAvailable) {
      const context = await getDBContext(demoMode, projectId, runId);
      dbContext = context.context;
      dbSources = context.sources;
    } else if (demoMode) {
      dbContext = 'Demo mode - database context not available.';
    } else if (!dbAvailable) {
      dbContext = 'Database unavailable - using docs-only mode.';
    }

    // Generate response
    const response = await generateCopilotResponse(
      message.trim(),
      docChunks,
      dbContext,
      dbSources,
      copilotMode,
      draftKind
    );

    // Log assistant response (audit)
    await logCopilotMessage(
      'ASSISTANT',
      response.answer,
      userId,
      projectId,
      runId,
      response.sources
    );

    // Return response
    const chatResponse: ChatResponse = {
      answer: response.answer,
      sources: response.sources,
      dbAvailable,
      llmUsed: response.llmUsed,
      draftPayload: response.draftPayload,
      draftTitle: response.draftTitle,
    };

    return NextResponse.json(chatResponse);
  } catch (error) {
    console.error('Copilot API error:', error);

    // Return helpful error response
    return NextResponse.json(
      {
        answer:
          'I encountered an error processing your request. Please try again or rephrase your question.',
        sources: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 200 } // Return 200 even on error to show helpful message
    );
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed. Use POST.' }, { status: 405 });
}
