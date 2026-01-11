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

/**
 * Claim the next available task for a worker
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

  // Build the query for available tasks
  // Priority: higher priority first, then oldest first
  const whereClause: {
    status: string;
    workerId: null;
    runId?: string;
    run?: { status: string };
  } = {
    status: TaskStatus.TODO,
    workerId: null,
    run: { status: 'ACTIVE' },
  };

  if (runId) {
    whereClause.runId = runId;
  }

  // Find and claim the next task atomically using a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Find the next available task
    const task = await tx.task.findFirst({
      where: whereClause,
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

    // Claim the task
    const claimedTask = await tx.task.update({
      where: { id: task.id },
      data: {
        workerId,
        status: TaskStatus.DOING,
        startedAt: new Date(),
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
        lastHeartbeat: new Date(),
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
        },
      },
    });

    return claimedTask;
  });

  return result;
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
  const updatedTask = await prisma.$transaction(async (tx) => {
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
        action:
          status === 'DONE'
            ? WorkerLogAction.TASK_COMPLETED
            : WorkerLogAction.TASK_FAILED,
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

  const result = await prisma.$transaction(async (tx) => {
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
  const [totalPending, totalInProgress, totalCompleted, totalFailed] =
    await Promise.all([
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

  const byRun = runs.map((run) => ({
    runId: run.id,
    runName: run.name,
    pending: run.tasks.filter((t) => t.status === TaskStatus.TODO).length,
    inProgress: run.tasks.filter((t) => t.status === TaskStatus.DOING).length,
    completed: run.tasks.filter((t) => t.status === TaskStatus.DONE).length,
    failed: run.tasks.filter((t) => t.status === 'FAILED').length,
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
