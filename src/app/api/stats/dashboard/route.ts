import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api/auth';

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.error) return auth.error;
    const user = auth.user!;

    // Run all queries in parallel for better performance
    const [
      projectStats,
      runStats,
      taskStats,
      agentStats,
      recentActivity,
    ] = await Promise.all([
      // Project statistics
      prisma.project.aggregate({
        where: { userId: user.id },
        _count: true,
      }),

      // Run statistics by status
      prisma.run.groupBy({
        by: ['status'],
        where: {
          project: { userId: user.id },
        },
        _count: true,
      }),

      // Task statistics by status and priority
      Promise.all([
        prisma.task.groupBy({
          by: ['status'],
          where: {
            run: { project: { userId: user.id } },
          },
          _count: true,
        }),
        prisma.task.groupBy({
          by: ['priority'],
          where: {
            run: { project: { userId: user.id } },
          },
          _count: true,
        }),
      ]),

      // Agent statistics
      Promise.all([
        prisma.agent.count({
          where: { userId: user.id },
        }),
        prisma.agent.count({
          where: { userId: user.id, isActive: true },
        }),
      ]),

      // Recent activity (GitHub events)
      prisma.gitHubEvent.findMany({
        where: {
          project: { userId: user.id },
        },
        orderBy: { receivedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          eventType: true,
          action: true,
          repositoryName: true,
          senderUsername: true,
          senderAvatarUrl: true,
          receivedAt: true,
        },
      }),
    ]);

    // Process run stats
    const runStatusCounts = runStats.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      { ACTIVE: 0, COMPLETED: 0, FAILED: 0 } as Record<string, number>
    );

    // Process task stats
    const [taskStatusGroups, taskPriorityGroups] = taskStats;

    const taskStatusCounts = taskStatusGroups.reduce(
      (acc, item) => {
        acc[item.status] = item._count;
        return acc;
      },
      { TODO: 0, DOING: 0, DONE: 0, BLOCKED: 0 } as Record<string, number>
    );

    const taskPriorityCounts = taskPriorityGroups.reduce(
      (acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      },
      { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 } as Record<string, number>
    );

    const totalTasks = Object.values(taskStatusCounts).reduce((a, b) => a + b, 0);
    const totalRuns = Object.values(runStatusCounts).reduce((a, b) => a + b, 0);

    // Process agent stats
    const [totalAgents, activeAgents] = agentStats;

    return NextResponse.json({
      projects: {
        total: projectStats._count,
      },
      runs: {
        total: totalRuns,
        active: runStatusCounts.ACTIVE,
        completed: runStatusCounts.COMPLETED,
        failed: runStatusCounts.FAILED,
      },
      tasks: {
        total: totalTasks,
        byStatus: taskStatusCounts,
        byPriority: taskPriorityCounts,
      },
      agents: {
        total: totalAgents,
        active: activeAgents,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
