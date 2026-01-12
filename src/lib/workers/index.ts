/**
 * Worker Module for Agent B Implementation
 *
 * Central export for all worker-related functionality
 */

// Types
export * from './types';

// Service functions
export {
  registerWorker,
  updateWorker,
  getWorker,
  getWorkers,
  recordHeartbeat,
  deregisterWorker,
  markStaleWorkersOffline,
  getWorkerStats,
  getWorkerLogs,
} from './service';

// Queue functions
export {
  claimTask,
  completeTask,
  releaseTask,
  renewLease, // AFC-1.1
  getQueueStats,
  getPendingTasks,
  getInProgressTasks,
} from './queue';
