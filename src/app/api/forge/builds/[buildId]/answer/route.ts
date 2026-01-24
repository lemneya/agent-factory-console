import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { broadcastBuildUpdate } from '../stream/route';

// POST /api/forge/builds/[buildId]/answer - Answer a HITL question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ buildId: string }> }
) {
  const { buildId } = await params;
  const session = await getServerSession(authOptions);

  try {
    const body = await request.json();
    const { questionId, answer } = body as {
      questionId: string;
      answer: string;
    };

    if (!questionId || !answer) {
      return NextResponse.json(
        { error: 'questionId and answer are required' },
        { status: 400 }
      );
    }

    // Get the question
    const question = await prisma.forgeHITLQuestion.findUnique({
      where: { id: questionId },
      include: { workstream: true },
    });

    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    if (question.buildId !== buildId) {
      return NextResponse.json(
        { error: 'Question does not belong to this build' },
        { status: 400 }
      );
    }

    if (question.answer) {
      return NextResponse.json(
        { error: 'Question already answered' },
        { status: 400 }
      );
    }

    // Update the question with answer
    const updatedQuestion = await prisma.forgeHITLQuestion.update({
      where: { id: questionId },
      data: {
        answer,
        answeredAt: new Date(),
        answeredBy: session?.user?.id,
      },
    });

    // If workstream was waiting for input, resume it
    if (question.workstreamId) {
      const workstream = await prisma.forgeWorkstream.findUnique({
        where: { id: question.workstreamId },
      });

      if (workstream?.status === 'WAITING_INPUT') {
        // Resume the workstream
        await prisma.forgeWorkstream.update({
          where: { id: question.workstreamId },
          data: { status: 'RUNNING' },
        });

        broadcastBuildUpdate(buildId, 'workstream_resumed', {
          workstreamId: question.workstreamId,
          workstreamKey: workstream.workstreamKey,
        });
      }
    }

    // Broadcast the answer
    broadcastBuildUpdate(buildId, 'question_answered', {
      questionId,
      workstreamId: question.workstreamId,
      answer,
      answeredAt: updatedQuestion.answeredAt,
    });

    return NextResponse.json({
      success: true,
      question: {
        id: updatedQuestion.id,
        answer: updatedQuestion.answer,
        answeredAt: updatedQuestion.answeredAt,
      },
    });
  } catch (error) {
    console.error('Failed to answer question:', error);
    return NextResponse.json(
      { error: 'Failed to answer question' },
      { status: 500 }
    );
  }
}
