/**
 * Prisma Client Mock for unit testing
 *
 * This mock provides a way to test API routes that depend on Prisma
 * without needing an actual database connection.
 */

import { PrismaClient } from '@prisma/client';

// Mock data types matching the Prisma schema
export const mockUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  emailVerified: null,
  image: 'https://example.com/avatar.png',
};

export const mockProject = {
  id: 'project-123',
  userId: 'user-123',
  repoName: 'test-repo',
  repoFullName: 'testuser/test-repo',
  description: 'A test repository',
  htmlUrl: 'https://github.com/testuser/test-repo',
  createdAt: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-15'),
  user: mockUser,
  runs: [],
  _count: { runs: 0, events: 0 },
};

export const mockRun = {
  id: 'run-123',
  projectId: 'project-123',
  name: 'Test Run',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-10'),
  completedAt: null,
  project: {
    id: 'project-123',
    repoName: 'test-repo',
    repoFullName: 'testuser/test-repo',
  },
  tasks: [],
  _count: { tasks: 0 },
};

export const mockTask = {
  id: 'task-123',
  runId: 'run-123',
  title: 'Test Task',
  status: 'TODO',
  assignee: null,
  createdAt: new Date('2024-01-10'),
  updatedAt: new Date('2024-01-10'),
  run: {
    id: 'run-123',
    name: 'Test Run',
    status: 'ACTIVE',
    project: {
      id: 'project-123',
      repoName: 'test-repo',
    },
  },
};

export const mockGitHubEvent = {
  id: 'event-123',
  deliveryId: 'delivery-123',
  eventType: 'push',
  action: null,
  repositoryId: null,
  repositoryName: 'testuser/test-repo',
  senderUsername: 'testuser',
  senderAvatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
  payload: {},
  createdAt: new Date('2024-01-10'),
};

// Create mock Prisma client
type MockPrismaClient = {
  [K in keyof PrismaClient]: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    upsert: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
};

export const prismaMock = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  run: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  gitHubEvent: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  repository: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  pullRequest: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  issue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  councilDecision: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  asset: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  assetVersion: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  projectAsset: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  // AFC-1.4: Ralph Mode mocks
  runPolicy: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  runIteration: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  runAbortReason: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  runCheckpoint: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
} as unknown as MockPrismaClient;

// Reset all mocks helper
export function resetPrismaMocks() {
  Object.values(prismaMock).forEach(model => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach(method => {
        if (typeof method === 'function' && 'mockReset' in method) {
          (method as jest.Mock).mockReset();
        }
      });
    }
  });
}
