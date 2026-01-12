/**
 * AFC-1.7: Blueprint Versions API Routes
 *
 * GET /api/blueprints/[id]/versions - List versions for a blueprint
 * POST /api/blueprints/[id]/versions - Create a new version
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateBlueprintSpec, computeSpecHash, BlueprintSpec } from '@/lib/blueprint';

// Dynamic import for Prisma
async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;

    // Verify blueprint exists
    const blueprint = await prisma.blueprint.findUnique({
      where: { id },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: { message: 'Blueprint not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    const versions = await prisma.blueprintVersion.findMany({
      where: { blueprintId: id },
      include: {
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ data: versions });
  } catch (error) {
    console.error('Error fetching blueprint versions:', error);
    return NextResponse.json(
      { error: { message: 'Failed to fetch blueprint versions', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const prisma = await getPrisma();
    const { id } = await params;
    const body = await request.json();

    const { specJson } = body;

    if (!specJson) {
      return NextResponse.json(
        { error: { message: 'specJson is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    // Verify blueprint exists
    const blueprint = await prisma.blueprint.findUnique({
      where: { id },
    });

    if (!blueprint) {
      return NextResponse.json(
        { error: { message: 'Blueprint not found', code: 'NOT_FOUND' } },
        { status: 404 }
      );
    }

    // Validate the spec JSON
    const validation = validateBlueprintSpec(specJson);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid blueprint spec',
            code: 'VALIDATION_ERROR',
            details: validation.errors,
          },
        },
        { status: 400 }
      );
    }

    // Get next version number
    const latestVersion = await prisma.blueprintVersion.findFirst({
      where: { blueprintId: id },
      orderBy: { version: 'desc' },
    });

    const nextVersion = (latestVersion?.version ?? 0) + 1;
    const specHash = computeSpecHash(specJson as BlueprintSpec);

    const version = await prisma.blueprintVersion.create({
      data: {
        blueprintId: id,
        version: nextVersion,
        schemaVersion: '1.0',
        specJson,
        specHash,
      },
    });

    return NextResponse.json(
      {
        data: version,
        validation: {
          warnings: validation.warnings,
          specIds: validation.specIds,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating blueprint version:', error);
    return NextResponse.json(
      { error: { message: 'Failed to create blueprint version', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
