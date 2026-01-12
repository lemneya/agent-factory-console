import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/projects/[id]/assets/detach - Detach an asset version from a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { assetVersionId, projectAssetId } = body;

    // Validate - need either assetVersionId or projectAssetId
    if (!assetVersionId && !projectAssetId) {
      return NextResponse.json(
        { error: 'Missing required field: assetVersionId or projectAssetId' },
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

    // Find the project asset to delete
    let projectAsset;
    if (projectAssetId) {
      projectAsset = await prisma.projectAsset.findFirst({
        where: {
          id: projectAssetId,
          projectId: id,
        },
      });
    } else {
      projectAsset = await prisma.projectAsset.findUnique({
        where: {
          projectId_assetVersionId: {
            projectId: id,
            assetVersionId,
          },
        },
      });
    }

    if (!projectAsset) {
      return NextResponse.json(
        { error: 'Asset is not attached to this project' },
        { status: 404 }
      );
    }

    // Delete the project asset
    await prisma.projectAsset.delete({
      where: { id: projectAsset.id },
    });

    return NextResponse.json({ message: 'Asset detached successfully' });
  } catch (error) {
    console.error('Error detaching asset from project:', error);
    return NextResponse.json({ error: 'Failed to detach asset from project' }, { status: 500 });
  }
}
