/**
 * POST /api/test/seed/project - Seed a project for E2E testing
 * AFC-RUNNER-UX-3: Test seed endpoint for project with repo binding
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  // Guard: Only allow in test/CI/dev environments
  const allowSeed =
    process.env.NODE_ENV === 'test' ||
    process.env.CI === 'true' ||
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  if (!allowSeed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { repoName, repoFullName, description, htmlUrl, repoOwner, baseBranch } = body;

    if (!repoName || !repoFullName || !htmlUrl) {
      return NextResponse.json(
        { error: 'repoName, repoFullName, and htmlUrl are required' },
        { status: 400 }
      );
    }

    // Create a test user if needed (demo mode)
    let userId = 'test-user-id';
    const existingUser = await prisma.user.findFirst({
      where: { email: 'test@example.com' },
    });

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      userId = newUser.id;
    } else {
      userId = existingUser.id;
    }

    const project = await prisma.project.create({
      data: {
        userId,
        repoName,
        repoFullName,
        description,
        htmlUrl,
        lastUpdated: new Date(),
        repoOwner: repoOwner || null,
        baseBranch: baseBranch || 'main',
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error seeding project:', error);
    return NextResponse.json({ error: 'Failed to seed project' }, { status: 500 });
  }
}
