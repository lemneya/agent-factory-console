import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/projects/[id]/assets - List all assets attached to a project
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectAssets = await prisma.projectAsset.findMany({
      where: { projectId: id },
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projectAssets);
  } catch (error) {
    console.error('Error fetching project assets:', error);
    return NextResponse.json({ error: 'Failed to fetch project assets' }, { status: 500 });
  }
}
