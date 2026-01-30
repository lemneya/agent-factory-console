import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/council/decisions - List all Council decisions with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const decision = searchParams.get('decision');
    // maintenanceRisk param accepted but not used (field doesn't exist in schema)
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = {};

    if (projectId) {
      where.projectId = projectId;
    }
    if (decision && ['ADOPT', 'ADAPT', 'BUILD'].includes(decision)) {
      where.decision = decision;
    }
    // Note: maintenanceRisk filter is accepted but not applied since field doesn't exist in current schema
    // This allows the API to gracefully handle the parameter without error

    const [decisions, total] = await Promise.all([
      prisma.councilDecision.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.councilDecision.count({ where }),
    ]);

    return NextResponse.json({
      decisions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching Council decisions:', error);
    return NextResponse.json({ error: 'Failed to fetch Council decisions' }, { status: 500 });
  }
}
