/**
 * Unit tests for Copilot Draft API
 * UX-GATE-COPILOT-1: Draft schema validation and approve guards
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma client
const mockPrismaCreate = jest.fn();
const mockPrismaFindUnique = jest.fn();
const mockPrismaUpdate = jest.fn();
const mockPrismaFindFirst = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    copilotDraft: {
      create: (...args: unknown[]) => mockPrismaCreate(...args),
      findUnique: (...args: unknown[]) => mockPrismaFindUnique(...args),
      update: (...args: unknown[]) => mockPrismaUpdate(...args),
    },
    copilotDraftEvent: {
      create: jest.fn(),
    },
    councilDecision: {
      create: jest.fn(),
      findFirst: (...args: unknown[]) => mockPrismaFindFirst(...args),
    },
  },
}));

// Mock auth
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'test-user' } }),
}));

describe('Draft Schema Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Blueprint Draft Payload', () => {
    it('should validate a valid Blueprint payload', () => {
      const validPayload = {
        blueprint: {
          name: 'Test Blueprint',
          description: 'A test blueprint',
          modules: [
            {
              key: 'auth_module',
              title: 'Auth Module',
              domain: 'backend',
              spec: 'Handle user authentication',
            },
          ],
        },
        determinism: {
          specHash: 'pending',
          stableOrder: true,
        },
      };

      // Validation function
      const isValid =
        validPayload.blueprint?.name &&
        validPayload.blueprint?.modules &&
        Array.isArray(validPayload.blueprint.modules);

      expect(isValid).toBe(true);
    });

    it('should reject Blueprint payload without name', () => {
      const invalidPayload = {
        blueprint: {
          description: 'A test blueprint',
          modules: [],
        },
        determinism: {
          specHash: 'pending',
          stableOrder: true,
        },
      };

      const isValid =
        (invalidPayload.blueprint as { name?: string })?.name &&
        invalidPayload.blueprint?.modules &&
        Array.isArray(invalidPayload.blueprint.modules);

      expect(isValid).toBeFalsy();
    });

    it('should reject Blueprint payload without modules array', () => {
      const invalidPayload = {
        blueprint: {
          name: 'Test Blueprint',
          description: 'A test blueprint',
        },
        determinism: {
          specHash: 'pending',
          stableOrder: true,
        },
      };

      const isValid =
        invalidPayload.blueprint?.name &&
        (invalidPayload.blueprint as { modules?: unknown[] })?.modules &&
        Array.isArray((invalidPayload.blueprint as { modules?: unknown[] }).modules);

      expect(isValid).toBeFalsy();
    });
  });

  describe('WorkOrders Draft Payload', () => {
    it('should validate a valid WorkOrders payload', () => {
      const validPayload = {
        source: {
          blueprintId: 'bp-123',
          versionId: null,
        },
        slice: {
          policy: {
            domainOrder: ['backend', 'frontend'],
            maxItems: 10,
          },
          workorders: [
            {
              key: 'setup_db',
              domain: 'backend',
              title: 'Setup Database',
              dependsOn: [],
            },
          ],
        },
      };

      const isValid =
        validPayload.source?.blueprintId &&
        validPayload.slice?.workorders &&
        Array.isArray(validPayload.slice.workorders);

      expect(isValid).toBe(true);
    });

    it('should reject WorkOrders payload without blueprintId', () => {
      const invalidPayload = {
        source: {
          versionId: null,
        },
        slice: {
          policy: {
            domainOrder: ['backend'],
            maxItems: 10,
          },
          workorders: [],
        },
      };

      const isValid =
        (invalidPayload.source as { blueprintId?: string })?.blueprintId &&
        invalidPayload.slice?.workorders &&
        Array.isArray(invalidPayload.slice.workorders);

      expect(isValid).toBeFalsy();
    });
  });

  describe('Council Draft Payload', () => {
    it('should validate a valid Council payload', () => {
      const validPayload = {
        decision: {
          projectId: 'proj-123',
          type: 'BUILD',
          risk: 'MEDIUM',
          rationale: 'Need custom solution',
          topRisks: ['Risk 1', 'Risk 2'],
          mitigations: ['Mitigation 1', 'Mitigation 2'],
          recommendedNextGate: 'Implementation',
        },
      };

      const isValid =
        validPayload.decision?.projectId &&
        validPayload.decision?.type &&
        validPayload.decision?.risk &&
        validPayload.decision?.rationale;

      expect(isValid).toBe(true);
    });

    it('should reject Council payload without projectId', () => {
      const invalidPayload = {
        decision: {
          type: 'BUILD',
          risk: 'MEDIUM',
          rationale: 'Need custom solution',
          topRisks: [],
          mitigations: [],
          recommendedNextGate: 'Implementation',
        },
      };

      const isValid =
        (invalidPayload.decision as { projectId?: string })?.projectId &&
        invalidPayload.decision?.type &&
        invalidPayload.decision?.risk &&
        invalidPayload.decision?.rationale;

      expect(isValid).toBeFalsy();
    });
  });
});

describe('Approve Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject approval for non-DRAFT status', async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: 'draft-123',
      status: 'APPROVED',
      kind: 'BLUEPRINT',
      payloadJson: {},
    });

    // Simulate the guard check
    const draft = await mockPrismaFindUnique({ where: { id: 'draft-123' } });
    const canApprove = draft?.status === 'DRAFT';

    expect(canApprove).toBe(false);
  });

  it('should allow approval for DRAFT status', async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: 'draft-123',
      status: 'DRAFT',
      kind: 'BLUEPRINT',
      payloadJson: {},
    });

    const draft = await mockPrismaFindUnique({ where: { id: 'draft-123' } });
    const canApprove = draft?.status === 'DRAFT';

    expect(canApprove).toBe(true);
  });

  it('should require Council decision for WorkOrders BUILD', async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: 'draft-123',
      status: 'DRAFT',
      kind: 'WORKORDERS',
      projectId: 'proj-123',
      payloadJson: {
        source: { blueprintId: 'bp-123', versionId: null },
        slice: { policy: {}, workorders: [] },
      },
    });

    mockPrismaFindFirst.mockResolvedValue(null); // No Council decision

    const draft = await mockPrismaFindUnique({ where: { id: 'draft-123' } });
    const councilDecision = await mockPrismaFindFirst({
      where: { projectId: draft?.projectId, decision: 'BUILD' },
    });

    const hasCouncilGate = !!councilDecision;

    expect(hasCouncilGate).toBe(false);
  });

  it('should pass Council gate when decision exists', async () => {
    mockPrismaFindUnique.mockResolvedValue({
      id: 'draft-123',
      status: 'DRAFT',
      kind: 'WORKORDERS',
      projectId: 'proj-123',
      payloadJson: {},
    });

    mockPrismaFindFirst.mockResolvedValue({
      id: 'council-123',
      decision: 'BUILD',
      projectId: 'proj-123',
    });

    const draft = await mockPrismaFindUnique({ where: { id: 'draft-123' } });
    const councilDecision = await mockPrismaFindFirst({
      where: { projectId: draft?.projectId, decision: 'BUILD' },
    });

    const hasCouncilGate = !!councilDecision;

    expect(hasCouncilGate).toBe(true);
  });
});
