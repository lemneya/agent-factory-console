/**
 * Worker Service for Agent B Implementation
 *
 * Handles worker registration, lifecycle, and task execution
 */

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  RegisterWorkerInput,
  UpdateWorkerInput,
  WorkerStatus,
  WorkerLogAction,
  WorkerWithTask,
  WorkerStats,
  STALE_WORKER_THRESHOLD_MS,
} from './types';

export class WorkerServiceError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'WorkerServiceError';
  }
}

export class WorkerNotFoundError extends WorkerServiceError {
  constructor(workerId: string) {
    super(`Worker not found: ${workerId}`, 'getWorker');
    this.name = 'WorkerNotFoundError';
  }
}

/**
 * Register a new worker
 */
export async function registerWorker(input: RegisterWorkerInput) {
  try {
    const { name, type = 'AGENT', capabilities = [], metadata } = input;

    const worker = await prisma.worker.create({
      data: {
        name,
        type,
        capabilities,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        status: WorkerStatus.IDLE,
        lastHeartbeat: new Date(),
      },
    });

    // Log registration
    await prisma.workerLog.create({
      data: {
        workerId: worker.id,
        action: WorkerLogAction.REGISTERED,
        details: { name, type, capabilities },
      },
    });

    return worker;
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to register worker "${input.name}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      'registerWorker',
      error
    );
  }
}

/**
 * Update worker information
 */
export async function updateWorker(workerId: string, input: UpdateWorkerInput) {
  try {
    const { name, status, capabilities, metadata } = input;

    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(capabilities && { capabilities }),
        ...(metadata !== undefined && {
          metadata: metadata as Prisma.InputJsonValue,
        }),
        updatedAt: new Date(),
      },
    });

    // Log status change if applicable
    if (status) {
      await prisma.workerLog.create({
        data: {
          workerId,
          action: WorkerLogAction.STATUS_CHANGED,
          details: { status },
        },
      });
    }

    return worker;
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to update worker ${workerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'updateWorker',
      error
    );
  }
}

/**
 * Get worker by ID with current task
 */
export async function getWorker(workerId: string): Promise<WorkerWithTask | null> {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        tasks: {
          where: { status: 'DOING' },
          take: 1,
          select: {
            id: true,
            title: true,
            status: true,
            runId: true,
          },
        },
      },
    });

    if (!worker) return null;

    return {
      ...worker,
      currentTask: worker.tasks[0] || null,
      metadata: worker.metadata as Record<string, unknown> | null,
    };
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to get worker ${workerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getWorker',
      error
    );
  }
}

/**
 * Get all workers
 */
export async function getWorkers(includeOffline = false) {
  try {
    const staleThreshold = new Date(Date.now() - STALE_WORKER_THRESHOLD_MS);

    const workers = await prisma.worker.findMany({
      where: includeOffline
        ? {}
        : {
            lastHeartbeat: { gte: staleThreshold },
          },
      include: {
        tasks: {
          where: { status: 'DOING' },
          take: 1,
          select: {
            id: true,
            title: true,
            status: true,
            runId: true,
          },
        },
      },
      orderBy: { lastHeartbeat: 'desc' },
    });

    return workers.map(worker => ({
      ...worker,
      currentTask: worker.tasks[0] || null,
      metadata: worker.metadata as Record<string, unknown> | null,
    }));
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to get workers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getWorkers',
      error
    );
  }
}

/**
 * Record worker heartbeat
 */
export async function recordHeartbeat(workerId: string) {
  try {
    const worker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        lastHeartbeat: new Date(),
        // If worker was offline, set to idle (unless busy)
        status: undefined, // Don't change status on heartbeat
      },
    });

    // Log heartbeat (throttled - only log every 10th heartbeat to reduce noise)
    const logCount = await prisma.workerLog.count({
      where: {
        workerId,
        action: WorkerLogAction.HEARTBEAT,
        createdAt: { gte: new Date(Date.now() - 60000) }, // Last minute
      },
    });

    if (logCount < 6) {
      // Max 6 heartbeat logs per minute
      await prisma.workerLog.create({
        data: {
          workerId,
          action: WorkerLogAction.HEARTBEAT,
        },
      });
    }

    return worker;
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to record heartbeat for worker ${workerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'recordHeartbeat',
      error
    );
  }
}

/**
 * Deregister a worker
 */
export async function deregisterWorker(workerId: string) {
  try {
    // First, release any claimed tasks
    await prisma.task.updateMany({
      where: {
        workerId,
        status: 'DOING',
      },
      data: {
        workerId: null,
        status: 'TODO',
        startedAt: null,
      },
    });

    // Log deregistration
    await prisma.workerLog.create({
      data: {
        workerId,
        action: WorkerLogAction.DEREGISTERED,
      },
    });

    // Delete the worker
    await prisma.worker.delete({
      where: { id: workerId },
    });

    return { success: true };
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to deregister worker ${workerId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'deregisterWorker',
      error
    );
  }
}

/**
 * Mark stale workers as offline
 */
export async function markStaleWorkersOffline() {
  try {
    const staleThreshold = new Date(Date.now() - STALE_WORKER_THRESHOLD_MS);

    const staleWorkers = await prisma.worker.findMany({
      where: {
        lastHeartbeat: { lt: staleThreshold },
        status: { not: WorkerStatus.OFFLINE },
      },
    });

    for (const worker of staleWorkers) {
      await prisma.worker.update({
        where: { id: worker.id },
        data: { status: WorkerStatus.OFFLINE },
      });

      // Release any tasks held by stale worker
      await prisma.task.updateMany({
        where: {
          workerId: worker.id,
          status: 'DOING',
        },
        data: {
          workerId: null,
          status: 'TODO',
          startedAt: null,
        },
      });

      await prisma.workerLog.create({
        data: {
          workerId: worker.id,
          action: WorkerLogAction.STATUS_CHANGED,
          details: { status: WorkerStatus.OFFLINE, reason: 'stale_heartbeat' },
        },
      });
    }

    return staleWorkers.length;
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to mark stale workers as offline: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'markStaleWorkersOffline',
      error
    );
  }
}

/**
 * Get worker statistics
 */
export async function getWorkerStats(): Promise<WorkerStats> {
  try {
    const staleThreshold = new Date(Date.now() - STALE_WORKER_THRESHOLD_MS);

    const [totalWorkers, activeWorkers, idleWorkers, offlineWorkers, completedLogs, failedLogs] =
      await Promise.all([
        prisma.worker.count(),
        prisma.worker.count({
          where: {
            status: WorkerStatus.BUSY,
            lastHeartbeat: { gte: staleThreshold },
          },
        }),
        prisma.worker.count({
          where: {
            status: WorkerStatus.IDLE,
            lastHeartbeat: { gte: staleThreshold },
          },
        }),
        prisma.worker.count({
          where: {
            OR: [{ status: WorkerStatus.OFFLINE }, { lastHeartbeat: { lt: staleThreshold } }],
          },
        }),
        prisma.workerLog.count({
          where: { action: WorkerLogAction.TASK_COMPLETED },
        }),
        prisma.workerLog.count({
          where: { action: WorkerLogAction.TASK_FAILED },
        }),
      ]);

    return {
      totalWorkers,
      activeWorkers,
      idleWorkers,
      offlineWorkers,
      tasksCompleted: completedLogs,
      tasksFailed: failedLogs,
    };
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to get worker statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getWorkerStats',
      error
    );
  }
}

/**
 * Get worker activity logs
 */
export async function getWorkerLogs(workerId?: string, limit = 50, offset = 0) {
  try {
    return prisma.workerLog.findMany({
      where: workerId ? { workerId } : {},
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  } catch (error) {
    throw new WorkerServiceError(
      `Failed to get worker logs${workerId ? ` for worker ${workerId}` : ''}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'getWorkerLogs',
      error
    );
  }
}
