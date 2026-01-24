/**
 * POST /api/tasks/[id]/hitl/answer
 *
 * SECURITY-0: Requires authentication and ownership verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireTaskOwnership } from '@/lib/auth-helpers';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface HITLQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'confirm';
  options?: string[];
  answer?: string;
  answeredAt?: string;
}

interface HITLData {
  questions?: HITLQuestion[];
  patches?: unknown[];
}

/**
 * POST /api/tasks/[id]/hitl/answer
 * Submit an answer to a HITL question
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // DEMO_MODE: Block writes in demo environment
  if (process.env.DEMO_MODE === '1') {
    return NextResponse.json({ error: 'Demo mode: writes disabled' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // SECURITY-0: Require authentication
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // SECURITY-0: Verify ownership (via run -> project chain)
    const ownershipResult = await requireTaskOwnership(id, userId);
    if (ownershipResult.error) return ownershipResult.error;

    const body = await request.json();
    const { questionId, answer } = body;

    if (!questionId) {
      return NextResponse.json(
        { error: 'questionId is required' },
        { status: 400 }
      );
    }

    if (answer === undefined || answer === null) {
      return NextResponse.json(
        { error: 'answer is required' },
        { status: 400 }
      );
    }

    // Get the task
    const task = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        hitlJson: true,
        status: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Parse current HITL data
    const hitlData = (task.hitlJson as HITLData) || { questions: [], patches: [] };
    const questions = hitlData.questions || [];

    // Find and update the question
    const questionIndex = questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update the answer
    questions[questionIndex] = {
      ...questions[questionIndex],
      answer: String(answer),
      answeredAt: new Date().toISOString(),
    };

    // Check if all questions are answered
    const allAnswered = questions.every((q) => q.answer !== undefined);

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        hitlJson: JSON.parse(JSON.stringify({ ...hitlData, questions })),
      },
      select: {
        id: true,
        title: true,
        status: true,
        hitlJson: true,
        blockedReason: true,
      },
    });

    return NextResponse.json({
      taskId: updatedTask.id,
      questionId,
      answer,
      allAnswered,
      hitl: updatedTask.hitlJson,
    });
  } catch (error) {
    console.error('Error answering HITL question:', error);
    return NextResponse.json(
      { error: 'Failed to submit answer' },
      { status: 500 }
    );
  }
}
