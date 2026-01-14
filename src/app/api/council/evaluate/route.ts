import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/council/evaluate - Run Council evaluation for a project/task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, taskId, decision, rationale } = body;

    // Validate required fields
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }
    if (!decision || !['ADOPT', 'ADAPT', 'BUILD'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision must be ADOPT, ADAPT, or BUILD' },
        { status: 400 }
      );
    }
    if (!rationale) {
      return NextResponse.json({ error: 'rationale is required' }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify task exists if provided
    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
    }

    // Create the Council decision
    const councilDecision = await prisma.councilDecision.create({
      data: {
        projectId,
        taskId,
        decision,
        rationale,
      },
      include: {
        project: {
          select: {
            id: true,
            repoName: true,
            repoFullName: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(councilDecision, { status: 201 });
  } catch (error) {
    console.error('Error creating Council decision:', error);
    return NextResponse.json({ error: 'Failed to create Council decision' }, { status: 500 });
  }
}
