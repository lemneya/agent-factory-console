/**
 * POST /api/demo/seed
 *
 * Creates demo data for Zenflow UI preview:
 * - A demo Project
 * - A demo Run with Tasks
 * - One Task set to BLOCKED_HITL with sample hitlJson
 *
 * Only works when DEMO_MODE=1
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEMO_USER_EMAIL = 'demo@agent-factory.dev';
const DEMO_PROJECT_NAME = 'demo-zenflow-preview';

export async function POST() {
  // Only allow in demo mode
  if (process.env.DEMO_MODE !== '1') {
    return NextResponse.json({ error: 'Demo mode not enabled' }, { status: 403 });
  }

  try {
    // Find or create demo user
    let user = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: DEMO_USER_EMAIL,
          name: 'Demo User',
        },
      });
    }

    // Find or create demo project
    let project = await prisma.project.findFirst({
      where: {
        userId: user.id,
        repoName: DEMO_PROJECT_NAME,
      },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          userId: user.id,
          repoName: DEMO_PROJECT_NAME,
          repoFullName: `demo/${DEMO_PROJECT_NAME}`,
          description: 'Demo project for Zenflow UI preview',
          htmlUrl: 'https://github.com/demo/demo-zenflow-preview',
          lastUpdated: new Date(),
        },
      });
    }

    // Create a new run
    const run = await prisma.run.create({
      data: {
        projectId: project.id,
        name: `Zenflow Demo Run ${new Date().toISOString().slice(0, 16)}`,
        status: 'ACTIVE',
        ralphMode: true,
      },
    });

    // Sample HITL data with questions and a patch
    const sampleHitlJson = {
      questions: [
        {
          id: 'q1',
          type: 'choice',
          question: 'Which authentication provider should we use for the API?',
          options: ['OAuth 2.0 with JWT', 'API Keys', 'Session-based auth'],
          context: 'The API will be consumed by both web clients and mobile apps.',
          answered: false,
        },
        {
          id: 'q2',
          type: 'text',
          question: 'What should be the rate limit for unauthenticated requests?',
          placeholder: 'e.g., 100 requests per minute',
          context: 'Consider DDoS protection vs. legitimate anonymous usage.',
          answered: false,
        },
        {
          id: 'q3',
          type: 'approval',
          question: 'Approve the proposed database schema changes?',
          context: 'Adding indexes on user_id and created_at columns for performance.',
          answered: false,
        },
      ],
      patches: [
        {
          id: 'p1',
          filename: 'src/api/auth/middleware.ts',
          language: 'typescript',
          hunks: [
            {
              oldStart: 15,
              oldLines: 8,
              newStart: 15,
              newLines: 12,
              lines: [
                ' import { NextRequest, NextResponse } from "next/server";',
                ' import { verifyToken } from "./jwt";',
                ' ',
                '-export function authMiddleware(req: NextRequest) {',
                '-  const token = req.headers.get("Authorization");',
                '-  if (!token) {',
                '-    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });',
                '-  }',
                '+export async function authMiddleware(req: NextRequest) {',
                '+  const token = req.headers.get("Authorization")?.replace("Bearer ", "");',
                '+  ',
                '+  if (!token) {',
                '+    // Check for API key fallback',
                '+    const apiKey = req.headers.get("X-API-Key");',
                '+    if (!apiKey) {',
                '+      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });',
                '+    }',
                '+    return validateApiKey(apiKey);',
                '+  }',
                ' ',
                '   return verifyToken(token);',
                ' }',
              ],
            },
          ],
          status: 'pending',
          description: 'Add API key fallback to auth middleware',
        },
      ],
    };

    // Create tasks
    const tasks = await Promise.all([
      // Task 1: BLOCKED_HITL with sample data
      prisma.task.create({
        data: {
          runId: run.id,
          title: 'Implement authentication middleware',
          description: 'Set up authentication for the API endpoints',
          status: 'BLOCKED_HITL',
          priority: 1,
          hitlJson: sampleHitlJson,
          blockedReason: 'Awaiting decisions on authentication approach and schema approval',
        },
      }),
      // Task 2: TODO
      prisma.task.create({
        data: {
          runId: run.id,
          title: 'Set up database migrations',
          description: 'Create initial schema and migration files',
          status: 'TODO',
          priority: 2,
        },
      }),
      // Task 3: DOING
      prisma.task.create({
        data: {
          runId: run.id,
          title: 'Configure CI/CD pipeline',
          description: 'Set up GitHub Actions for automated testing and deployment',
          status: 'DOING',
          priority: 3,
          startedAt: new Date(),
        },
      }),
      // Task 4: DONE
      prisma.task.create({
        data: {
          runId: run.id,
          title: 'Initialize project structure',
          description: 'Create folder structure and base configuration',
          status: 'DONE',
          priority: 0,
          completedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      runId: run.id,
      projectId: project.id,
      taskCount: tasks.length,
      blockedTaskId: tasks[0].id,
      message: 'Demo data seeded successfully',
    });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json(
      { error: 'Failed to seed demo data', details: String(error) },
      { status: 500 }
    );
  }
}
