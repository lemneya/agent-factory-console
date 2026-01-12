import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/assets - List assets with optional search and tag filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const tag = searchParams.get('tag');
    const category = searchParams.get('category');

    const where: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        slug?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
      }>;
      tags?: { some: { tag: string } };
      category?: string;
    } = {};

    // Search by query (name, slug, or description)
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filter by tag
    if (tag) {
      where.tags = { some: { tag: tag } };
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get latest version
        },
        tags: true,
        _count: {
          select: { versions: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

// POST /api/assets - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, name, description, category, defaultLicense, tags } = body;

    // Validate required fields
    if (!slug || !name || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, category' },
        { status: 400 }
      );
    }

    // Check for existing slug
    const existingAsset = await prisma.asset.findUnique({
      where: { slug },
    });

    if (existingAsset) {
      return NextResponse.json(
        { error: `Asset with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Create asset with optional tags
    const asset = await prisma.asset.create({
      data: {
        slug,
        name,
        description,
        category,
        defaultLicense: defaultLicense || 'MIT',
        tags: tags?.length
          ? {
              create: tags.map((tag: string) => ({ tag })),
            }
          : undefined,
      },
      include: {
        tags: true,
        versions: true,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 });
  }
}
