/**
 * AFC-RUNNER-0: Runner Service Unit Tests
 *
 * Tests the runner service functions with mocked dependencies.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    executionRun: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    executionLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    workOrder: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    councilDecision: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  getGitHubAccessToken: jest.fn(),
}));

// Mock GitHub client
jest.mock('@/lib/github/client', () => ({
  createGitHubClient: jest.fn(),
}));

describe('Runner Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeWorkOrders', () => {
    it('should reject empty workOrderIds array', async () => {
      // Import after mocks are set up
      const { executeWorkOrders } = await import('@/services/runner');

      const result = await executeWorkOrders({
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
        workOrderIds: [],
        userId: 'test-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('No work orders specified');
    });

    it('should reject when GitHub access token is not found', async () => {
      const { getGitHubAccessToken } = await import('@/lib/auth');
      (getGitHubAccessToken as jest.Mock).mockResolvedValue(null);

      const { prisma } = await import('@/lib/prisma');
      // Mock work order lookup to return a valid PENDING work order
      (prisma.workOrder.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'wo-1',
          key: 'test-wo',
          domain: 'test',
          title: 'Test WorkOrder',
          spec: 'Test spec',
          status: 'PENDING',
        },
      ]);
      // Mock execution run creation
      (prisma.executionRun.create as jest.Mock).mockResolvedValue({
        id: 'run-1',
      });
      // Mock execution run update (for FAILED status)
      (prisma.executionRun.update as jest.Mock).mockResolvedValue({});
      // Mock execution log creation
      (prisma.executionLog.create as jest.Mock).mockResolvedValue({});

      const { executeWorkOrders } = await import('@/services/runner');

      const result = await executeWorkOrders({
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
        workOrderIds: ['wo-1'],
        userId: 'test-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitHub access token not found');
      // Now returns executionRunId since the run is created before token check
      expect(result.executionRunId).toBe('run-1');
    });

    it('should reject when work orders are not found', async () => {
      const { getGitHubAccessToken } = await import('@/lib/auth');
      (getGitHubAccessToken as jest.Mock).mockResolvedValue('test-token');

      const { prisma } = await import('@/lib/prisma');
      (prisma.workOrder.findMany as jest.Mock).mockResolvedValue([]);

      const { executeWorkOrders } = await import('@/services/runner');

      const result = await executeWorkOrders({
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
        workOrderIds: ['wo-1'],
        userId: 'test-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should reject work orders not in PENDING status', async () => {
      const { getGitHubAccessToken } = await import('@/lib/auth');
      (getGitHubAccessToken as jest.Mock).mockResolvedValue('test-token');

      const { prisma } = await import('@/lib/prisma');
      (prisma.workOrder.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'wo-1',
          key: 'test-wo',
          domain: 'test',
          title: 'Test WorkOrder',
          spec: 'Test spec',
          status: 'COMPLETED', // Not PENDING
        },
      ]);

      const { executeWorkOrders } = await import('@/services/runner');

      const result = await executeWorkOrders({
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
        workOrderIds: ['wo-1'],
        userId: 'test-user',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PENDING status');
    });

    it('should enforce Council Gate when projectId is provided', async () => {
      const { getGitHubAccessToken } = await import('@/lib/auth');
      (getGitHubAccessToken as jest.Mock).mockResolvedValue('test-token');

      const { prisma } = await import('@/lib/prisma');
      (prisma.workOrder.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'wo-1',
          key: 'test-wo',
          domain: 'test',
          title: 'Test WorkOrder',
          spec: 'Test spec',
          status: 'PENDING',
        },
      ]);
      // Mock execution run creation
      (prisma.executionRun.create as jest.Mock).mockResolvedValue({
        id: 'run-1',
      });
      // Mock execution run update (for FAILED status)
      (prisma.executionRun.update as jest.Mock).mockResolvedValue({});
      // Mock execution log creation
      (prisma.executionLog.create as jest.Mock).mockResolvedValue({});
      // Mock council decision to return null (no approval)
      (prisma.councilDecision.findFirst as jest.Mock).mockResolvedValue(null);

      const { executeWorkOrders } = await import('@/services/runner');

      const result = await executeWorkOrders({
        targetRepoOwner: 'test-owner',
        targetRepoName: 'test-repo',
        workOrderIds: ['wo-1'],
        userId: 'test-user',
        projectId: 'test-project',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Council Gate');
      // Now returns executionRunId since the run is created before council check
      expect(result.executionRunId).toBe('run-1');
    });
  });

  describe('getExecutionRun', () => {
    it('should return execution run with logs and workOrders', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockRun = {
        id: 'run-1',
        status: 'COMPLETED',
        workOrderIds: ['wo-1'],
        logs: [{ id: 'log-1', phase: 'CLONE', message: 'Cloning...' }],
      };
      const mockWorkOrders = [
        {
          id: 'wo-1',
          key: 'test-wo',
          title: 'Test WorkOrder',
          domain: 'test',
          status: 'PENDING',
        },
      ];
      (prisma.executionRun.findUnique as jest.Mock).mockResolvedValue(mockRun);
      (prisma.workOrder.findMany as jest.Mock).mockResolvedValue(mockWorkOrders);

      const { getExecutionRun } = await import('@/services/runner');
      const result = await getExecutionRun('run-1');

      expect(result).toEqual({
        ...mockRun,
        workOrders: mockWorkOrders,
      });
      expect(prisma.executionRun.findUnique).toHaveBeenCalledWith({
        where: { id: 'run-1' },
        include: {
          logs: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });
      expect(prisma.workOrder.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['wo-1'] } },
        select: {
          id: true,
          key: true,
          title: true,
          domain: true,
          status: true,
        },
      });
    });

    it('should return null for non-existent run', async () => {
      const { prisma } = await import('@/lib/prisma');
      (prisma.executionRun.findUnique as jest.Mock).mockResolvedValue(null);

      const { getExecutionRun } = await import('@/services/runner');
      const result = await getExecutionRun('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('listExecutionRuns', () => {
    it('should return list of execution runs', async () => {
      const { prisma } = await import('@/lib/prisma');
      const mockRuns = [
        { id: 'run-1', status: 'COMPLETED' },
        { id: 'run-2', status: 'PENDING' },
      ];
      (prisma.executionRun.findMany as jest.Mock).mockResolvedValue(mockRuns);

      const { listExecutionRuns } = await import('@/services/runner');
      const result = await listExecutionRuns();

      expect(result).toEqual(mockRuns);
    });

    it('should filter by projectId when provided', async () => {
      const { prisma } = await import('@/lib/prisma');
      (prisma.executionRun.findMany as jest.Mock).mockResolvedValue([]);

      const { listExecutionRuns } = await import('@/services/runner');
      await listExecutionRuns('test-project', 10);

      expect(prisma.executionRun.findMany).toHaveBeenCalledWith({
        where: { projectId: 'test-project' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      });
    });
  });
});
