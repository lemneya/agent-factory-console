import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/runs
 * Returns last run summary (latest run per project OR latest overall)
 */
export async function GET() {
  try {
    // Get latest run overall
    const latestRun = await prisma.run.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            repoName: true,
            repoFullName: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
        _count: {
          select: {
            checkpoints: true,
            iterations: true,
          },
        },
      },
    });

    if (!latestRun) {
      return NextResponse.json({ run: null });
    }

    // Calculate task stats
    const taskStats = {
      total: latestRun.tasks.length,
      todo: latestRun.tasks.filter((t) => t.status === "TODO").length,
      inProgress: latestRun.tasks.filter((t) => t.status === "IN_PROGRESS")
        .length,
      done: latestRun.tasks.filter((t) => t.status === "DONE").length,
      failed: latestRun.tasks.filter((t) => t.status === "FAILED").length,
    };

    return NextResponse.json({
      run: {
        id: latestRun.id,
        name: latestRun.name,
        status: latestRun.status,
        ralphMode: latestRun.ralphMode,
        createdAt: latestRun.createdAt,
        completedAt: latestRun.completedAt,
        project: latestRun.project,
        taskStats,
        checkpointCount: latestRun._count.checkpoints,
        iterationCount: latestRun._count.iterations,
      },
    });
  } catch (error) {
    console.error("Failed to fetch dashboard runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}
