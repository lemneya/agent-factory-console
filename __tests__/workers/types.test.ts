/**
 * Tests for Worker Types
 *
 * Unit tests for the worker type definitions and constants
 */

import {
  WorkerStatus,
  WorkerType,
  TaskStatus,
  WorkerLogAction,
  HEARTBEAT_TIMEOUT_MS,
  STALE_WORKER_THRESHOLD_MS,
} from '@/lib/workers/types';

describe('WorkerStatus', () => {
  it('should have all expected status values', () => {
    expect(WorkerStatus.IDLE).toBe('IDLE');
    expect(WorkerStatus.BUSY).toBe('BUSY');
    expect(WorkerStatus.OFFLINE).toBe('OFFLINE');
    expect(WorkerStatus.ERROR).toBe('ERROR');
  });

  it('should have exactly 4 status values', () => {
    const statuses = Object.keys(WorkerStatus);
    expect(statuses).toHaveLength(4);
  });
});

describe('WorkerType', () => {
  it('should have all expected type values', () => {
    expect(WorkerType.AGENT).toBe('AGENT');
    expect(WorkerType.HUMAN).toBe('HUMAN');
    expect(WorkerType.SYSTEM).toBe('SYSTEM');
  });

  it('should have exactly 3 type values', () => {
    const types = Object.keys(WorkerType);
    expect(types).toHaveLength(3);
  });
});

describe('TaskStatus', () => {
  it('should have all expected status values', () => {
    expect(TaskStatus.TODO).toBe('TODO');
    expect(TaskStatus.DOING).toBe('DOING');
    expect(TaskStatus.DONE).toBe('DONE');
    expect(TaskStatus.BLOCKED).toBe('BLOCKED');
    expect(TaskStatus.FAILED).toBe('FAILED');
  });

  it('should have exactly 5 status values', () => {
    const statuses = Object.keys(TaskStatus);
    expect(statuses).toHaveLength(5);
  });
});

describe('WorkerLogAction', () => {
  it('should have all expected action values', () => {
    expect(WorkerLogAction.REGISTERED).toBe('REGISTERED');
    expect(WorkerLogAction.HEARTBEAT).toBe('HEARTBEAT');
    expect(WorkerLogAction.TASK_CLAIMED).toBe('TASK_CLAIMED');
    expect(WorkerLogAction.TASK_COMPLETED).toBe('TASK_COMPLETED');
    expect(WorkerLogAction.TASK_FAILED).toBe('TASK_FAILED');
    expect(WorkerLogAction.TASK_RELEASED).toBe('TASK_RELEASED');
    expect(WorkerLogAction.STATUS_CHANGED).toBe('STATUS_CHANGED');
    expect(WorkerLogAction.DEREGISTERED).toBe('DEREGISTERED');
  });

  it('should have exactly 8 action values', () => {
    const actions = Object.keys(WorkerLogAction);
    expect(actions).toHaveLength(8);
  });
});

describe('Timeout Constants', () => {
  it('should have reasonable heartbeat timeout', () => {
    expect(HEARTBEAT_TIMEOUT_MS).toBe(30000); // 30 seconds
    expect(HEARTBEAT_TIMEOUT_MS).toBeGreaterThan(0);
    expect(HEARTBEAT_TIMEOUT_MS).toBeLessThan(60000); // Less than 1 minute
  });

  it('should have reasonable stale worker threshold', () => {
    expect(STALE_WORKER_THRESHOLD_MS).toBe(120000); // 2 minutes
    expect(STALE_WORKER_THRESHOLD_MS).toBeGreaterThan(HEARTBEAT_TIMEOUT_MS);
  });

  it('should have stale threshold greater than heartbeat timeout', () => {
    // Stale threshold should be at least 2x heartbeat timeout
    // to allow for missed heartbeats before marking offline
    expect(STALE_WORKER_THRESHOLD_MS).toBeGreaterThanOrEqual(HEARTBEAT_TIMEOUT_MS * 2);
  });
});

describe('Worker status transitions', () => {
  const validTransitions = [
    { from: 'IDLE', to: 'BUSY', valid: true },
    { from: 'BUSY', to: 'IDLE', valid: true },
    { from: 'IDLE', to: 'OFFLINE', valid: true },
    { from: 'BUSY', to: 'OFFLINE', valid: true },
    { from: 'OFFLINE', to: 'IDLE', valid: true },
    { from: 'ERROR', to: 'IDLE', valid: true },
  ];

  it.each(validTransitions)('should recognize transition from $from to $to', ({ from, to }) => {
    // Verify both statuses exist
    expect(Object.values(WorkerStatus)).toContain(from);
    expect(Object.values(WorkerStatus)).toContain(to);
  });
});

describe('Task status transitions', () => {
  const validTaskStatuses = ['TODO', 'DOING', 'DONE', 'BLOCKED', 'FAILED'];

  it.each(validTaskStatuses)('should have %s as valid task status', status => {
    expect(Object.values(TaskStatus)).toContain(status);
  });

  it('should include FAILED as a terminal status', () => {
    // FAILED is added in AFC-1 for worker task failures
    expect(TaskStatus.FAILED).toBe('FAILED');
  });
});
