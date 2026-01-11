/**
 * Task Queue Service for Agent B Implementation
 *
 * Handles task claiming, completion, and queue management
 */

import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import {
  ClaimTaskInput,
  CompleteTaskInput,
  TaskStatus,
  WorkerStatus,
  WorkerLogAction,
  QueueStats,
} from './types';

// AFC-1.1: Lease duration in milliseconds (60 seconds)
const LEASE_DURATION_MS = 60 * 1000;

/**
 * Claim the next available task for a worker
 * AFC-1.1: Now supports lease-based claiming with self-healing
 */
export async function claimTask(input: ClaimTaskInput) {
  const { workerId, runId } = input;

  // Verify worker exists and is available
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
  });

  if (!worker) {
    throw new Error('Worker not found');
  }

  if (worker.status === WorkerStatus.OFFLINE) {
    throw new Error('Worker is offline');
  }

  // Check if worker already has a task in progress
  const existingTask = await prisma.task.findFirst({
    where: {
      workerId,
      status: TaskStatus.DOING,
    },
  });

  if (existingTask) {
    throw new Error('Worker already has a task in progress');
  }

  const now = new Date();

  // Find and claim the next task atomically using a transaction
  const result = await prisma.$transaction(async tx => {
    // AFC-1.1: Find available task
    // A task is claimable if:
    // 1. status='TODO' OR
    // 2. status='DOING' AND leaseExpiresAt < now() (lease expired)
    const task = await tx.task.findFirst({
      where: {
        run: { status: 'ACTIVE' },
        ...(runId && { runId }),
        OR: [
          // Unclaimed tasks
          { status: TaskStatus.TODO, workerId: null },
          // Expired lease tasks (AFC-1.1: self-healing)
          {
            status: TaskStatus.DOING,
            leaseExpiresAt: { lt: now },
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        run: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                repoName: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      return null;
    }

    // AFC-1.1: Calculate lease expiry
    const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS);

    // Claim the task with lease fields
    const claimedTask = await tx.task.update({
      where: { id: task.id },
      data: {
        workerId,
        status: TaskStatus.DOING,
        startedAt: new Date(),
        // AFC-1.1: Lease fields
        claimedBy: workerId,
        claimedAt: now,
        leaseExpiresAt,
        attempts: { increment: 1 },
      },
      include: {
        run: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                repoName: true,
              },
            },
          },
        },
      },
    });

    // Update worker status to busy
    await tx.worker.update({
      where: { id: workerId },
      data: {
        status: WorkerStatus.BUSY,
        currentTaskId: task.id,
        lastHeartbeat: now,
      },
    });

    // Log the claim
    await tx.workerLog.create({
      data: {
        workerId,
        taskId: task.id,
        action: WorkerLogAction.TASK_CLAIMED,
        details: {
          taskTitle: task.title,
          runId: task.runId,
          leaseExpiresAt: leaseExpiresAt.toISOString(),
          attempts: claimedTask.attempts,
        },
      },
    });

    return claimedTask;
  });

  return result;
}

/**
 * AFC-1.1: Renew the lease for a task
 * Should be called every 20-30s while worker is processing
 */
export async function renewLease(workerId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.workerId !== workerId || task.claimedBy !== workerId) {
    throw new Error('Task is not assigned to this worker');
  }

  if (task.status !== TaskStatus.DOING) {
    throw new Error('Task is not in progress');
  }

  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + LEASE_DURATION_MS);

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      leaseExpiresAt,
    },
  });

  // Also update worker heartbeat
  await prisma.worker.update({
    where: { id: workerId },
    data: { lastHeartbeat: now },
  });

  return updatedTask;
}

/**
 * Complete a task
 */
export async function completeTask(input: CompleteTaskInput) {
  const { workerId, taskId, result, status = 'DONE', errorMsg } = input;

  // Verify the task is assigned to this worker
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.workerId !== workerId) {
    throw new Error('Task is not assigned to this worker');
  }

  if (task.status !== TaskStatus.DOING) {
    throw new Error('Task is not in progress');
  }

  // Complete the task in a transaction
  const updatedTask = await prisma.$transaction(async tx => {
    // Update the task
    const completed = await tx.task.update({
      where: { id: taskId },
      data: {
        status,
        result: (result ?? undefined) as Prisma.InputJsonValue | undefined,
        errorMsg: errorMsg ?? undefined,
        completedAt: new Date(),
      },
      include: {
        run: {
          select: {
            id: true,
            name: true,
            project: {
              select: {
                id: true,
                repoName: true,
              },
            },
          },
        },
      },
    });

    // Update worker status back to idle
    await tx.worker.update({
      where: { id: workerId },
      data: {
        status: WorkerStatus.IDLE,
        currentTaskId: null,
        lastHeartbeat: new Date(),
      },
    });

    // Log the completion
    await tx.workerLog.create({
      data: {
        workerId,
        taskId,
        action: status === 'DONE' ? WorkerLogAction.TASK_COMPLETED : WorkerLogAction.TASK_FAILED,
        details: {
          taskTitle: task.title,
          status,
          ...(errorMsg && { errorMsg }),
        },
      },
    });

    return completed;
  });

  return updatedTask;
}

/**
 * Release a task back to the queue
 */
export async function releaseTask(workerId: string, taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  if (task.workerId !== workerId) {
    throw new Error('Task is not assigned to this worker');
  }

  const result = await prisma.$transaction(async tx => {
    // Release the task
    const releasedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        workerId: null,
        status: TaskStatus.TODO,
        startedAt: null,
      },
    });

    // Update worker status
    await tx.worker.update({
      where: { id: workerId },
      data: {
        status: WorkerStatus.IDLE,
        currentTaskId: null,
        lastHeartbeat: new Date(),
      },
    });

    // Log the release
    await tx.workerLog.create({
      data: {
        workerId,
        taskId,
        action: WorkerLogAction.TASK_RELEASED,
        details: { taskTitle: task.title },
      },
    });

    return releasedTask;
  });

  return result;
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  // Get overall counts
  const [totalPending, totalInProgress, totalCompleted, totalFailed] = await Promise.all([
    prisma.task.count({ where: { status: TaskStatus.TODO } }),
    prisma.task.count({ where: { status: TaskStatus.DOING } }),
    prisma.task.count({ where: { status: TaskStatus.DONE } }),
    prisma.task.count({ where: { status: 'FAILED' } }),
  ]);

  // Get counts by run
  const runs = await prisma.run.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      tasks: {
        select: {
          status: true,
        },
      },
    },
  });

  const byRun = runs.map(run => ({
    runId: run.id,
    runName: run.name,
    pending: run.tasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: run.tasks.filter(t => t.status === TaskStatus.DOING).length,
    completed: run.tasks.filter(t => t.status === TaskStatus.DONE).length,
    failed: run.tasks.filter(t => t.status === 'FAILED').length,
  }));

  return {
    totalPending,
    totalInProgress,
    totalCompleted,
    totalFailed,
    byRun,
  };
}

/**
 * Get pending tasks for a specific run
 */
export async function getPendingTasks(runId?: string, limit = 50) {
  return prisma.task.findMany({
    where: {
      status: TaskStatus.TODO,
      workerId: null,
      ...(runId && { runId }),
      run: { status: 'ACTIVE' },
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: limit,
    include: {
      run: {
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              repoName: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Get tasks in progress
 */
export async function getInProgressTasks(workerId?: string) {
  return prisma.task.findMany({
    where: {
      status: TaskStatus.DOING,
      ...(workerId && { workerId }),
    },
    include: {
      worker: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
      run: {
        select: {
          id: true,
          name: true,
          project: {
            select: {
              id: true,
              repoName: true,
            },
          },
        },
      },
    },
    orderBy: { startedAt: 'asc' },
  });
}
