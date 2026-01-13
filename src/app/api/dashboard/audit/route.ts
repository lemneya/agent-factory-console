import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface AuditEvent {
  id: string;
  type: string;
  actor: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * GET /api/dashboard/audit
 * Returns latest 10 audit events including terminal events, mode changes, and approvals
 */
export async function GET() {
  try {
    const events: AuditEvent[] = [];

    // Get WorkOrder audit events (status transitions)
    const workOrderEvents = await prisma.workOrderAuditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        workOrder: {
          select: {
            key: true,
            title: true,
          },
        },
      },
    });

    events.push(
      ...workOrderEvents.map((e) => ({
        id: e.id,
        type: "WORKORDER_STATUS",
        actor: e.actor,
        description: `WorkOrder ${e.workOrder.key}: ${e.fromStatus} → ${e.toStatus}`,
        metadata: e.metadata as Record<string, unknown> | null,
        createdAt: e.createdAt,
      }))
    );

    // Get Terminal Matrix events (RunIterations with mode changes)
    const terminalEvents = await prisma.runIteration.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        run: {
          select: {
            name: true,
            project: {
              select: {
                repoName: true,
              },
            },
          },
        },
      },
    });

    events.push(
      ...terminalEvents.map((e) => ({
        id: e.id,
        type: "TERMINAL_ITERATION",
        actor: null,
        description: `Run "${e.run.name}": Iteration ${e.iteration} (${e.status})`,
        metadata: {
          runId: e.runId,
          iteration: e.iteration,
          status: e.status,
          project: e.run.project?.repoName,
        },
        createdAt: e.createdAt,
      }))
    );

    // Get Council decisions (approvals)
    const councilEvents = await prisma.councilDecision.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        project: {
          select: {
            repoName: true,
          },
        },
      },
    });

    events.push(
      ...councilEvents.map((e) => ({
        id: e.id,
        type: "COUNCIL_DECISION",
        actor: e.createdBy,
        description: `Council: ${e.decision} - ${e.candidateName || "N/A"} (${e.project.repoName})`,
        metadata: {
          decision: e.decision,
          confidence: e.confidence,
          risk: e.maintenanceRisk,
        },
        createdAt: e.createdAt,
      }))
    );

    // Get Worker logs (terminal events)
    const workerLogs = await prisma.workerLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    events.push(
      ...workerLogs.map((e) => ({
        id: e.id,
        type: "WORKER_LOG",
        actor: e.workerId,
        description: `Worker ${e.workerId}: ${e.action}`,
        metadata: e.details as Record<string, unknown> | null,
        createdAt: e.createdAt,
      }))
    );

    // Sort all events by createdAt and take top 10
    const sortedEvents = events
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10);

    return NextResponse.json({ events: sortedEvents });
  } catch (error) {
    console.error("Failed to fetch dashboard audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit events" },
      { status: 500 }
    );
  }
}
