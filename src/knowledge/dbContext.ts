/**
 * DB Context Reader for Copilot
 * UX-GATE-COPILOT-0: Read-only database context retrieval
 *
 * HARD RULE: This module MUST NOT write to any tables.
 * It may only READ: projects, runs, council decisions, workorders, logs.
 */

import { PrismaClient } from '@prisma/client';

export interface DBSource {
  type: 'DB';
  ref: string; // e.g., "Project:<id>" or "Run:<id>"
  title: string;
  snippet: string;
}

export interface DBContext {
  context: string; // Compact JSON context string
  sources: DBSource[];
}

// Singleton Prisma client
let prisma: PrismaClient | null = null;

function getPrisma(): PrismaClient | null {
  if (!prisma) {
    try {
      prisma = new PrismaClient();
    } catch {
      console.warn('Could not initialize Prisma client');
      return null;
    }
  }
  return prisma;
}

/**
 * Get project context (read-only)
 */
async function getProjectContext(projectId: string): Promise<{
  context: Record<string, unknown>;
  sources: DBSource[];
}> {
  const db = getPrisma();
  if (!db) {
    return { context: {}, sources: [] };
  }

  try {
    // Get project record
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        repoName: true,
        repoFullName: true,
        description: true,
        createdAt: true,
        lastUpdated: true,
      },
    });

    if (!project) {
      return { context: {}, sources: [] };
    }

    // Get last 5 runs
    const runs = await db.run.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        status: true,
        ralphMode: true,
        createdAt: true,
        completedAt: true,
      },
    });

    // Get latest council decision
    const councilDecision = await db.councilDecision.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        decision: true,
        confidence: true,
        candidateName: true,
        reasoning: true,
        createdAt: true,
      },
    });

    // Get last 5 workorders (tasks)
    const workorders = await db.task.findMany({
      where: { run: { projectId } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    const sources: DBSource[] = [
      {
        type: 'DB',
        ref: `Project:${project.id}`,
        title: `Project: ${project.repoName}`,
        snippet: project.description || 'No description',
      },
    ];

    if (runs.length > 0) {
      sources.push({
        type: 'DB',
        ref: `Runs:${projectId}`,
        title: `Recent Runs (${runs.length})`,
        snippet: runs.map(r => `${r.name}: ${r.status}`).join(', '),
      });
    }

    if (councilDecision) {
      sources.push({
        type: 'DB',
        ref: `CouncilDecision:${councilDecision.id}`,
        title: `Council Decision: ${councilDecision.decision}`,
        snippet: councilDecision.reasoning?.slice(0, 100) || 'No reasoning',
      });
    }

    return {
      context: {
        project: {
          name: project.repoName,
          description: project.description,
          lastUpdated: project.lastUpdated,
        },
        recentRuns: runs.map(r => ({
          name: r.name,
          status: r.status,
          ralphMode: r.ralphMode,
        })),
        latestCouncilDecision: councilDecision
          ? {
              decision: councilDecision.decision,
              confidence: councilDecision.confidence,
              candidate: councilDecision.candidateName,
            }
          : null,
        recentWorkorders: workorders.map(w => ({
          title: w.title,
          status: w.status,
        })),
      },
      sources,
    };
  } catch (error) {
    console.error('Error fetching project context:', error);
    return { context: {}, sources: [] };
  }
}

/**
 * Get run context (read-only)
 */
async function getRunContext(runId: string): Promise<{
  context: Record<string, unknown>;
  sources: DBSource[];
}> {
  const db = getPrisma();
  if (!db) {
    return { context: {}, sources: [] };
  }

  try {
    // Get run record
    const run = await db.run.findUnique({
      where: { id: runId },
      select: {
        id: true,
        name: true,
        status: true,
        ralphMode: true,
        threadId: true,
        createdAt: true,
        completedAt: true,
        project: {
          select: {
            repoName: true,
          },
        },
      },
    });

    if (!run) {
      return { context: {}, sources: [] };
    }

    // Get last checkpoint
    const checkpoint = await db.runCheckpoint.findFirst({
      where: { runId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        nextNode: true,
        createdAt: true,
      },
    });

    // Get last 20 logs
    const logs = await db.workerLog.findMany({
      where: { taskId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        action: true,
        details: true,
        createdAt: true,
      },
    });

    // Get Ralph policy if present
    const policy = await db.runPolicy.findUnique({
      where: { runId },
      select: {
        maxIterations: true,
        maxWallClockSeconds: true,
        maxFailures: true,
      },
    });

    // Get last iteration status
    const lastIteration = await db.runIteration.findFirst({
      where: { runId },
      orderBy: { iteration: 'desc' },
      select: {
        iteration: true,
        status: true,
        startedAt: true,
        endedAt: true,
      },
    });

    const sources: DBSource[] = [
      {
        type: 'DB',
        ref: `Run:${run.id}`,
        title: `Run: ${run.name}`,
        snippet: `Status: ${run.status}, Ralph Mode: ${run.ralphMode}`,
      },
    ];

    if (checkpoint) {
      sources.push({
        type: 'DB',
        ref: `Checkpoint:${checkpoint.id}`,
        title: 'Last Checkpoint',
        snippet: `Status: ${checkpoint.status}, Next: ${checkpoint.nextNode || 'N/A'}`,
      });
    }

    return {
      context: {
        run: {
          name: run.name,
          status: run.status,
          ralphMode: run.ralphMode,
          project: run.project.repoName,
        },
        lastCheckpoint: checkpoint
          ? {
              status: checkpoint.status,
              nextNode: checkpoint.nextNode,
            }
          : null,
        ralphPolicy: policy,
        lastIteration: lastIteration
          ? {
              iteration: lastIteration.iteration,
              status: lastIteration.status,
            }
          : null,
        recentLogsCount: logs.length,
      },
      sources,
    };
  } catch (error) {
    console.error('Error fetching run context:', error);
    return { context: {}, sources: [] };
  }
}

/**
 * Get DB context for Copilot
 * Returns compact JSON context string and sources
 *
 * @param demoMode - If true, do not query DB
 * @param projectId - Optional project ID for scoped context
 * @param runId - Optional run ID for scoped context
 */
export async function getDBContext(
  demoMode: boolean,
  projectId?: string | null,
  runId?: string | null
): Promise<DBContext> {
  // Demo mode: no DB access
  if (demoMode) {
    return {
      context: JSON.stringify({ note: 'Demo mode - DB context not available' }),
      sources: [],
    };
  }

  const allContext: Record<string, unknown> = {};
  const allSources: DBSource[] = [];

  // Get project context if provided
  if (projectId) {
    const { context, sources } = await getProjectContext(projectId);
    allContext.project = context;
    allSources.push(...sources);
  }

  // Get run context if provided
  if (runId) {
    const { context, sources } = await getRunContext(runId);
    allContext.run = context;
    allSources.push(...sources);
  }

  // Truncate context if too large (max 4000 chars)
  let contextStr = JSON.stringify(allContext, null, 2);
  if (contextStr.length > 4000) {
    contextStr = contextStr.slice(0, 4000) + '... (truncated)';
  }

  return {
    context: contextStr,
    sources: allSources,
  };
}

/**
 * Check if DB is available
 */
export async function isDBAvailable(): Promise<boolean> {
  const db = getPrisma();
  if (!db) return false;

  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
