/**
 * AFC-1.7: Blueprint Version Publish API
 *
 * POST /api/blueprints/versions/[versionId]/publish - Publish (lock) a version
 *
 * Once published, a BlueprintVersion is immutable.
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { versionId } = await params;

    // Fetch the version
    const version = await prisma.blueprintVersion.findUnique({
      where: { id: versionId },
      include: {
        blueprint: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: { message: 'Blueprint version not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Check if already published
    if (version.publishedAt) {
      return NextResponse.json(
        { error: { message: 'Version is already published', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Publish the version
    const publishedVersion = await prisma.blueprintVersion.update({
      where: { id: versionId },
      data: {
        publishedAt: new Date(),
      },
      include: {
        blueprint: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
      },
    });

    // Update blueprint status to PUBLISHED if it was DRAFT
    if (version.blueprint.status === 'DRAFT') {
      await prisma.blueprint.update({
        where: { id: version.blueprintId },
        data: { status: 'PUBLISHED' },
      });
    }

    return NextResponse.json({
      data: publishedVersion,
      message: 'Version published successfully. It is now immutable.',
    });
  } catch (error) {
    console.error('Error publishing blueprint version:', error);
    return NextResponse.json(
      { error: { message: 'Failed to publish blueprint version', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
