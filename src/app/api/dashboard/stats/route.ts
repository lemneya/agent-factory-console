import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/stats
 * Returns Factory Status counters for the dashboard
 */
export async function GET() {
  try {
    // Council decision counts by type
    const [adoptCount, adaptCount, buildCount] = await Promise.all([
      prisma.councilDecision.count({ where: { decision: "ADOPT" } }),
      prisma.councilDecision.count({ where: { decision: "ADAPT" } }),
      prisma.councilDecision.count({ where: { decision: "BUILD" } }),
    ]);

    // Open PRs count
    const prOpenCount = await prisma.pullRequest.count({
      where: { state: "open" },
    });

    // Workers online (heartbeat within last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const workersOnline = await prisma.worker.count({
      where: {
        lastHeartbeat: { gte: fiveMinutesAgo },
        status: { not: "OFFLINE" },
      },
    });

    // Runs active and queued
    const [runsActive, runsQueued] = await Promise.all([
      prisma.run.count({ where: { status: "ACTIVE" } }),
      prisma.run.count({ where: { status: "QUEUED" } }),
    ]);

    // Council blocks (BUILD decisions with high risk that might block)
    const councilBlocks = await prisma.councilDecision.count({
      where: {
        decision: "BUILD",
        maintenanceRisk: "HIGH",
      },
    });

    // Last webhook received
    const lastWebhook = await prisma.gitHubEvent.findFirst({
      orderBy: { receivedAt: "desc" },
      select: { receivedAt: true },
    });

    return NextResponse.json({
      adoptCount,
      adaptCount,
      buildCount,
      prOpenCount,
      workersOnline,
      runsActive,
      runsQueued,
      councilBlocks,
      lastWebhookReceivedAt: lastWebhook?.receivedAt || null,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
