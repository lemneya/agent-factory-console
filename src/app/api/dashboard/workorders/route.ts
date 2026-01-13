import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/workorders
 * Returns top 6 active WorkOrders by updatedAt for dashboard panel
 */
export async function GET() {
  try {
    const workOrders = await prisma.workOrder.findMany({
      where: {
        status: {
          in: ["PLANNED", "READY", "IN_PROGRESS", "WAITING_FOR_APPROVAL"],
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        key: true,
        title: true,
        domain: true,
        status: true,
        updatedAt: true,
        project: {
          select: {
            repoName: true,
          },
        },
      },
    });

    return NextResponse.json({ workOrders });
  } catch (error) {
    console.error("Failed to fetch dashboard workorders:", error);
    return NextResponse.json(
      { error: "Failed to fetch workorders" },
      { status: 500 }
    );
  }
}
