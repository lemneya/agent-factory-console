import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/projects/[id]/assets/attach - Attach an asset version to a project
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { assetVersionId, config, pinned } = body;

    // Validate required fields
    if (!assetVersionId) {
      return NextResponse.json(
        { error: 'Missing required field: assetVersionId' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if asset version exists
    const assetVersion = await prisma.assetVersion.findUnique({
      where: { id: assetVersionId },
      include: { asset: true },
    });

    if (!assetVersion) {
      return NextResponse.json({ error: 'Asset version not found' }, { status: 404 });
    }

    // Check if already attached
    const existingAttachment = await prisma.projectAsset.findUnique({
      where: {
        projectId_assetVersionId: {
          projectId: id,
          assetVersionId,
        },
      },
    });

    if (existingAttachment) {
      return NextResponse.json(
        { error: 'Asset version is already attached to this project' },
        { status: 409 }
      );
    }

    // Create project asset attachment
    const projectAsset = await prisma.projectAsset.create({
      data: {
        projectId: id,
        assetVersionId,
        config: config || null,
        pinned: pinned !== undefined ? pinned : true,
      },
      include: {
        assetVersion: {
          include: {
            asset: {
              include: {
                tags: true,
              },
            },
          },
        },
        project: true,
      },
    });

    return NextResponse.json(projectAsset, { status: 201 });
  } catch (error) {
    console.error('Error attaching asset to project:', error);
    return NextResponse.json({ error: 'Failed to attach asset to project' }, { status: 500 });
  }
}
