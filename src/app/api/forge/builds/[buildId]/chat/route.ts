import { NextRequest, NextResponse } from 'next/server';
import { detectIntent, generateResponse, type ChatContext, type ChatMessage } from '@/lib/forge/chat-agent';

export const runtime = 'nodejs';

/**
 * POST /api/forge/builds/[buildId]/chat
 *
 * Process a chat message and return a response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const body = await request.json();
    const { message, context } = body as {
      message: string;
      context: ChatContext;
    };

    if (!message || !context) {
      return NextResponse.json(
        { error: 'Missing message or context' },
        { status: 400 }
      );
    }

    // Detect intent
    const intent = detectIntent(message);

    // Generate response
    const response = generateResponse(intent, context);

    // Create messages
    const userMessage: ChatMessage = {
      id: `${buildId}-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    const assistantMessage: ChatMessage = {
      id: `${buildId}-${Date.now()}-assistant`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      metadata: {
        intent,
        affectedFiles: response.action?.payload?.files?.map(f => f.path),
        status: response.action ? 'pending' : undefined,
      },
    };

    return NextResponse.json({
      success: true,
      userMessage,
      assistantMessage,
      response,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forge/builds/[buildId]/chat/action
 *
 * Execute a chat action (code modification)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await params;
    const body = await request.json();
    const { action, context } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Missing action' },
        { status: 400 }
      );
    }

    // Here we would integrate with the actual Forge execution system
    // For now, return a confirmation that the action was received

    // In a full implementation, this would:
    // 1. Create a new micro-workstream for the modification
    // 2. Execute the agent with the specific change request
    // 3. Return the result

    return NextResponse.json({
      success: true,
      buildId,
      action,
      status: 'queued',
      message: `Action "${action.type}" has been queued for execution`,
      estimatedTime: '30 seconds',
    });
  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
