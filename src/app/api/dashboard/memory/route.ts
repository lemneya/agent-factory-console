import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/memory
 * Returns Memory Insights: top 3 memory keys + hit counts
 */
export async function GET() {
  try {
    // Get recent memory usage aggregates (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get top 3 most accessed memory items
    const topMemoryItems = await prisma.memoryItem.findMany({
      where: {
        accessCount: { gt: 0 },
      },
      orderBy: { accessCount: "desc" },
      take: 3,
      select: {
        id: true,
        summary: true,
        category: true,
        scope: true,
        accessCount: true,
        lastAccessed: true,
        project: {
          select: {
            repoName: true,
          },
        },
      },
    });

    // Get recent memory use count
    const recentUseCount = await prisma.memoryUse.count({
      where: {
        usedAt: { gte: sevenDaysAgo },
      },
    });

    // Get total memory items count
    const totalMemoryItems = await prisma.memoryItem.count();

    // Get memory by category breakdown
    const categoryBreakdown = await prisma.memoryItem.groupBy({
      by: ["category"],
      _count: { id: true },
    });

    return NextResponse.json({
      topMemoryItems,
      recentUseCount,
      totalMemoryItems,
      categoryBreakdown: categoryBreakdown.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch dashboard memory:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory insights" },
      { status: 500 }
    );
  }
}
