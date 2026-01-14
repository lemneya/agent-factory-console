import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/assets/[id]/versions - List all versions for an asset
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    const versions = await prisma.assetVersion.findMany({
      where: { assetId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { projectAssets: true, tasks: true },
        },
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching asset versions:', error);
    return NextResponse.json({ error: 'Failed to fetch asset versions' }, { status: 500 });
  }
}

// POST /api/assets/[id]/versions - Create a new version for an asset
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      version,
      stackCompat,
      source,
      installRecipe,
      interfacesRef,
      boundariesRef,
      proofPack,
      status,
    } = body;

    // Validate required fields
    if (!version || !stackCompat || !source || !installRecipe) {
      return NextResponse.json(
        { error: 'Missing required fields: version, stackCompat, source, installRecipe' },
        { status: 400 }
      );
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Check for existing version
    const existingVersion = await prisma.assetVersion.findUnique({
      where: {
        assetId_version: {
          assetId: id,
          version,
        },
      },
    });

    if (existingVersion) {
      return NextResponse.json(
        { error: `Version "${version}" already exists for this asset` },
        { status: 409 }
      );
    }

    // Create new version
    const assetVersion = await prisma.assetVersion.create({
      data: {
        assetId: id,
        version,
        stackCompat,
        source,
        installRecipe,
        interfacesRef,
        boundariesRef,
        proofPack,
        status: status || 'ACTIVE',
      },
      include: {
        asset: true,
      },
    });

    return NextResponse.json(assetVersion, { status: 201 });
  } catch (error) {
    console.error('Error creating asset version:', error);
    return NextResponse.json({ error: 'Failed to create asset version' }, { status: 500 });
  }
}
