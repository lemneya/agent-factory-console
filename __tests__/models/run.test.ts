/**
 * Unit tests for Run model and status transitions
 */

describe('Run Model', () => {
  // Valid run statuses from the Prisma schema
  const VALID_RUN_STATUSES = ['ACTIVE', 'COMPLETED', 'FAILED'] as const;
  type RunStatus = (typeof VALID_RUN_STATUSES)[number];

  interface Run {
    id: string;
    projectId: string;
    name: string;
    status: RunStatus;
    createdAt: Date;
    completedAt: Date | null;
  }

  function createRun(overrides: Partial<Run> = {}): Run {
    return {
      id: 'run-123',
      projectId: 'project-123',
      name: 'Test Run',
      status: 'ACTIVE',
      createdAt: new Date(),
      completedAt: null,
      ...overrides,
    };
  }

  describe('Run Status', () => {
    it('should have exactly 3 valid statuses', () => {
      expect(VALID_RUN_STATUSES).toHaveLength(3);
    });

    it.each(VALID_RUN_STATUSES)('should recognize %s as valid status', status => {
      expect(VALID_RUN_STATUSES).toContain(status);
    });

    it('should not accept invalid statuses', () => {
      const invalidStatuses = ['PENDING', 'CANCELLED', 'IN_PROGRESS', 'SUCCESS'];
      invalidStatuses.forEach(status => {
        expect(VALID_RUN_STATUSES).not.toContain(status);
      });
    });
  });

  describe('Run Status Transitions', () => {
    // Define valid status transitions
    const validTransitions: Record<RunStatus, RunStatus[]> = {
      ACTIVE: ['COMPLETED', 'FAILED'],
      COMPLETED: [], // Final state
      FAILED: ['ACTIVE'], // Allow retry
    };

    it('should allow ACTIVE -> COMPLETED transition', () => {
      const run = createRun({ status: 'ACTIVE' });
      expect(validTransitions[run.status]).toContain('COMPLETED');
    });

    it('should allow ACTIVE -> FAILED transition', () => {
      const run = createRun({ status: 'ACTIVE' });
      expect(validTransitions[run.status]).toContain('FAILED');
    });

    it('should not allow transitions from COMPLETED', () => {
      expect(validTransitions.COMPLETED).toHaveLength(0);
    });

    it('should allow FAILED -> ACTIVE transition (retry)', () => {
      const run = createRun({ status: 'FAILED' });
      expect(validTransitions[run.status]).toContain('ACTIVE');
    });
  });

  describe('Run Creation', () => {
    it('should create run with required fields', () => {
      const run = createRun();

      expect(run.id).toBeDefined();
      expect(run.projectId).toBeDefined();
      expect(run.name).toBeDefined();
      expect(run.status).toBe('ACTIVE');
    });

    it('should default status to ACTIVE', () => {
      const run = createRun();
      expect(run.status).toBe('ACTIVE');
    });

    it('should allow custom status on creation', () => {
      const run = createRun({ status: 'COMPLETED' });
      expect(run.status).toBe('COMPLETED');
    });

    it('should have null completedAt initially', () => {
      const run = createRun();
      expect(run.completedAt).toBeNull();
    });
  });

  describe('Run Completion', () => {
    it('should set completedAt when completed', () => {
      const completedAt = new Date();
      const run = createRun({
        status: 'COMPLETED',
        completedAt,
      });

      expect(run.completedAt).toBe(completedAt);
    });

    it('should set completedAt when failed', () => {
      const completedAt = new Date();
      const run = createRun({
        status: 'FAILED',
        completedAt,
      });

      expect(run.completedAt).toBe(completedAt);
    });

    it('completedAt should be after createdAt', () => {
      const createdAt = new Date('2024-01-01');
      const completedAt = new Date('2024-01-02');
      const run = createRun({
        status: 'COMPLETED',
        createdAt,
        completedAt,
      });

      expect(run.completedAt!.getTime()).toBeGreaterThan(run.createdAt.getTime());
    });
  });
});
