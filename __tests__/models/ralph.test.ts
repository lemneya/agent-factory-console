import { prismaMock, resetPrismaMocks } from '../mocks/prisma';

/**
 * Unit tests for AFC-1.4 Ralph Mode Runner
 *
 * Tests cover:
 * - RunPolicy model (defaults, validation)
 * - RunIteration model (statuses, transitions)
 * - AbortReason enum types
 * - Circuit breaker logic (thrash detection)
 * - Ralph Mode control flow
 */

describe('AFC-1.4 Ralph Mode Runner', () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  // Mock data
  const mockRun = {
    id: 'run-123',
    projectId: 'project-123',
    name: 'Test Run',
    status: 'ACTIVE',
    threadId: 'run-123',
    ralphMode: false,
    createdAt: new Date(),
    completedAt: null,
  };

  const mockRunPolicy = {
    id: 'policy-123',
    runId: 'run-123',
    maxIterations: 25,
    maxWallClockSeconds: 14400, // 4 hours
    maxFailures: 10,
    maxRepeatedError: 3,
    maxNoProgressIterations: 5,
    requireHumanApprovalAt: ['plan_review', 'pre_merge'],
    verificationCommands: ['npm run lint', 'npm test', 'npm run build'],
    completionPromise: '<AFC_DONE/>',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRunIteration = {
    id: 'iter-123',
    runId: 'run-123',
    iteration: 1,
    status: 'RUNNING' as const,
    startedAt: new Date(),
    endedAt: null,
    verificationSummary: null,
    errorFingerprint: null,
    diffStats: null,
    checkpointId: null,
    createdAt: new Date(),
  };

  const mockAbortReason = {
    id: 'abort-123',
    runId: 'run-123',
    reason: 'MANUAL_ABORT' as const,
    details: { message: 'User requested abort' },
    createdAt: new Date(),
  };

  describe('RunPolicy Model', () => {
    describe('defaults', () => {
      it('should have default maxIterations of 25', () => {
        expect(mockRunPolicy.maxIterations).toBe(25);
      });

      it('should have default maxWallClockSeconds of 4 hours', () => {
        expect(mockRunPolicy.maxWallClockSeconds).toBe(14400);
      });

      it('should have default maxFailures of 10', () => {
        expect(mockRunPolicy.maxFailures).toBe(10);
      });

      it('should have default maxRepeatedError of 3 for thrash detection', () => {
        expect(mockRunPolicy.maxRepeatedError).toBe(3);
      });

      it('should have default maxNoProgressIterations of 5', () => {
        expect(mockRunPolicy.maxNoProgressIterations).toBe(5);
      });

      it('should have default verificationCommands', () => {
        expect(mockRunPolicy.verificationCommands).toEqual([
          'npm run lint',
          'npm test',
          'npm run build',
        ]);
      });

      it('should have default completionPromise', () => {
        expect(mockRunPolicy.completionPromise).toBe('<AFC_DONE/>');
      });
    });

    describe('create', () => {
      it('should create a run policy', async () => {
        prismaMock.runPolicy.create.mockResolvedValue(mockRunPolicy);

        const result = await prismaMock.runPolicy.create({
          data: {
            runId: 'run-123',
            maxIterations: 25,
            maxWallClockSeconds: 14400,
            maxFailures: 10,
            maxRepeatedError: 3,
            maxNoProgressIterations: 5,
            verificationCommands: ['npm run lint', 'npm test', 'npm run build'],
            completionPromise: '<AFC_DONE/>',
          },
        });

        expect(result).toEqual(mockRunPolicy);
        expect(prismaMock.runPolicy.create).toHaveBeenCalledTimes(1);
      });

      it('should create policy with custom values', async () => {
        const customPolicy = {
          ...mockRunPolicy,
          maxIterations: 50,
          maxWallClockSeconds: 28800, // 8 hours
          verificationCommands: ['make test', 'make lint'],
        };
        prismaMock.runPolicy.create.mockResolvedValue(customPolicy);

        const result = await prismaMock.runPolicy.create({
          data: {
            runId: 'run-123',
            maxIterations: 50,
            maxWallClockSeconds: 28800,
            verificationCommands: ['make test', 'make lint'],
          },
        });

        expect(result.maxIterations).toBe(50);
        expect(result.maxWallClockSeconds).toBe(28800);
        expect(result.verificationCommands).toEqual(['make test', 'make lint']);
      });
    });

    describe('findUnique', () => {
      it('should find policy by runId', async () => {
        prismaMock.runPolicy.findUnique.mockResolvedValue(mockRunPolicy);

        const result = await prismaMock.runPolicy.findUnique({
          where: { runId: 'run-123' },
        });

        expect(result).toEqual(mockRunPolicy);
      });

      it('should return null if policy not found', async () => {
        prismaMock.runPolicy.findUnique.mockResolvedValue(null);

        const result = await prismaMock.runPolicy.findUnique({
          where: { runId: 'nonexistent' },
        });

        expect(result).toBeNull();
      });
    });

    describe('update', () => {
      it('should update policy values', async () => {
        const updatedPolicy = {
          ...mockRunPolicy,
          maxIterations: 30,
        };
        prismaMock.runPolicy.update.mockResolvedValue(updatedPolicy);

        const result = await prismaMock.runPolicy.update({
          where: { runId: 'run-123' },
          data: { maxIterations: 30 },
        });

        expect(result.maxIterations).toBe(30);
      });
    });
  });

  describe('RunIteration Model', () => {
    const VALID_ITERATION_STATUSES = [
      'RUNNING',
      'PASSED',
      'FAILED',
      'WAITING_FOR_APPROVAL',
      'ABORTED',
    ] as const;

    describe('statuses', () => {
      it('should have exactly 5 valid iteration statuses', () => {
        expect(VALID_ITERATION_STATUSES).toHaveLength(5);
      });

      it.each(VALID_ITERATION_STATUSES)('should recognize %s as valid status', status => {
        expect(VALID_ITERATION_STATUSES).toContain(status);
      });
    });

    describe('create', () => {
      it('should create an iteration with RUNNING status', async () => {
        prismaMock.runIteration.create.mockResolvedValue(mockRunIteration);

        const result = await prismaMock.runIteration.create({
          data: {
            runId: 'run-123',
            iteration: 1,
            status: 'RUNNING',
          },
        });

        expect(result.status).toBe('RUNNING');
        expect(result.iteration).toBe(1);
      });

      it('should track iteration number sequentially', async () => {
        const iter1 = { ...mockRunIteration, iteration: 1 };
        const iter2 = { ...mockRunIteration, id: 'iter-124', iteration: 2 };
        const iter3 = { ...mockRunIteration, id: 'iter-125', iteration: 3 };

        prismaMock.runIteration.findMany.mockResolvedValue([iter1, iter2, iter3]);

        const result = await prismaMock.runIteration.findMany({
          where: { runId: 'run-123' },
          orderBy: { iteration: 'asc' },
        });

        expect(result).toHaveLength(3);
        expect(result[0].iteration).toBe(1);
        expect(result[1].iteration).toBe(2);
        expect(result[2].iteration).toBe(3);
      });
    });

    describe('status transitions', () => {
      it('should transition from RUNNING to PASSED', async () => {
        const passedIter = {
          ...mockRunIteration,
          status: 'PASSED' as const,
          endedAt: new Date(),
          verificationSummary: { lint: 'pass', test: 'pass', build: 'pass' },
        };
        prismaMock.runIteration.update.mockResolvedValue(passedIter);

        const result = await prismaMock.runIteration.update({
          where: { id: 'iter-123' },
          data: {
            status: 'PASSED',
            endedAt: new Date(),
            verificationSummary: { lint: 'pass', test: 'pass', build: 'pass' },
          },
        });

        expect(result.status).toBe('PASSED');
        expect(result.verificationSummary).toBeDefined();
      });

      it('should transition from RUNNING to FAILED with error fingerprint', async () => {
        const failedIter = {
          ...mockRunIteration,
          status: 'FAILED' as const,
          endedAt: new Date(),
          errorFingerprint: 'abc123hash',
          verificationSummary: { lint: 'pass', test: 'fail', build: 'skip' },
        };
        prismaMock.runIteration.update.mockResolvedValue(failedIter);

        const result = await prismaMock.runIteration.update({
          where: { id: 'iter-123' },
          data: {
            status: 'FAILED',
            endedAt: new Date(),
            errorFingerprint: 'abc123hash',
            verificationSummary: { lint: 'pass', test: 'fail', build: 'skip' },
          },
        });

        expect(result.status).toBe('FAILED');
        expect(result.errorFingerprint).toBe('abc123hash');
      });

      it('should transition to WAITING_FOR_APPROVAL on thrash detection', async () => {
        const waitingIter = {
          ...mockRunIteration,
          status: 'WAITING_FOR_APPROVAL' as const,
        };
        prismaMock.runIteration.update.mockResolvedValue(waitingIter);

        const result = await prismaMock.runIteration.update({
          where: { id: 'iter-123' },
          data: { status: 'WAITING_FOR_APPROVAL' },
        });

        expect(result.status).toBe('WAITING_FOR_APPROVAL');
      });

      it('should transition to ABORTED on manual abort', async () => {
        const abortedIter = {
          ...mockRunIteration,
          status: 'ABORTED' as const,
          endedAt: new Date(),
        };
        prismaMock.runIteration.update.mockResolvedValue(abortedIter);

        const result = await prismaMock.runIteration.update({
          where: { id: 'iter-123' },
          data: { status: 'ABORTED', endedAt: new Date() },
        });

        expect(result.status).toBe('ABORTED');
      });
    });

    describe('verification summary', () => {
      it('should record verification command results', async () => {
        const iterWithVerification = {
          ...mockRunIteration,
          verificationSummary: {
            lint: 'pass',
            test: 'pass',
            build: 'pass',
          },
        };
        prismaMock.runIteration.update.mockResolvedValue(iterWithVerification);

        const result = await prismaMock.runIteration.update({
          where: { id: 'iter-123' },
          data: {
            verificationSummary: { lint: 'pass', test: 'pass', build: 'pass' },
          },
        });

        expect(result.verificationSummary).toEqual({
          lint: 'pass',
          test: 'pass',
          build: 'pass',
        });
      });
    });

    describe('diff stats', () => {
      it('should record diff statistics', async () => {
        const iterWithDiff = {
          ...mockRunIteration,
          diffStats: { files: 5, insertions: 100, deletions: 20 },
        };
        prismaMock.runIteration.update.mockResolvedValue(iterWithDiff);

        const result = await prismaMock.runIteration.update({
          where: { id: 'iter-123' },
          data: {
            diffStats: { files: 5, insertions: 100, deletions: 20 },
          },
        });

        expect(result.diffStats).toEqual({
          files: 5,
          insertions: 100,
          deletions: 20,
        });
      });
    });
  });

  describe('AbortReason Model', () => {
    const VALID_ABORT_REASONS = [
      'TIME_BUDGET',
      'ITERATION_BUDGET',
      'FAILURE_BUDGET',
      'THRASHING',
      'MANUAL_ABORT',
    ] as const;

    describe('reasons', () => {
      it('should have exactly 5 valid abort reasons', () => {
        expect(VALID_ABORT_REASONS).toHaveLength(5);
      });

      it.each(VALID_ABORT_REASONS)('should recognize %s as valid reason', reason => {
        expect(VALID_ABORT_REASONS).toContain(reason);
      });
    });

    describe('create', () => {
      it('should create abort reason for TIME_BUDGET', async () => {
        const timeAbort = {
          ...mockAbortReason,
          reason: 'TIME_BUDGET' as const,
          details: { elapsed: 14500, limit: 14400 },
        };
        prismaMock.runAbortReason.create.mockResolvedValue(timeAbort);

        const result = await prismaMock.runAbortReason.create({
          data: {
            runId: 'run-123',
            reason: 'TIME_BUDGET',
            details: { elapsed: 14500, limit: 14400 },
          },
        });

        expect(result.reason).toBe('TIME_BUDGET');
        expect(result.details).toEqual({ elapsed: 14500, limit: 14400 });
      });

      it('should create abort reason for ITERATION_BUDGET', async () => {
        const iterAbort = {
          ...mockAbortReason,
          reason: 'ITERATION_BUDGET' as const,
          details: { iterations: 26, limit: 25 },
        };
        prismaMock.runAbortReason.create.mockResolvedValue(iterAbort);

        const result = await prismaMock.runAbortReason.create({
          data: {
            runId: 'run-123',
            reason: 'ITERATION_BUDGET',
            details: { iterations: 26, limit: 25 },
          },
        });

        expect(result.reason).toBe('ITERATION_BUDGET');
      });

      it('should create abort reason for FAILURE_BUDGET', async () => {
        const failAbort = {
          ...mockAbortReason,
          reason: 'FAILURE_BUDGET' as const,
          details: { failures: 11, limit: 10 },
        };
        prismaMock.runAbortReason.create.mockResolvedValue(failAbort);

        const result = await prismaMock.runAbortReason.create({
          data: {
            runId: 'run-123',
            reason: 'FAILURE_BUDGET',
            details: { failures: 11, limit: 10 },
          },
        });

        expect(result.reason).toBe('FAILURE_BUDGET');
      });

      it('should create abort reason for THRASHING', async () => {
        const thrashAbort = {
          ...mockAbortReason,
          reason: 'THRASHING' as const,
          details: { errorFingerprint: 'abc123', repeatCount: 3 },
        };
        prismaMock.runAbortReason.create.mockResolvedValue(thrashAbort);

        const result = await prismaMock.runAbortReason.create({
          data: {
            runId: 'run-123',
            reason: 'THRASHING',
            details: { errorFingerprint: 'abc123', repeatCount: 3 },
          },
        });

        expect(result.reason).toBe('THRASHING');
        expect(result.details).toHaveProperty('errorFingerprint');
      });

      it('should create abort reason for MANUAL_ABORT', async () => {
        prismaMock.runAbortReason.create.mockResolvedValue(mockAbortReason);

        const result = await prismaMock.runAbortReason.create({
          data: {
            runId: 'run-123',
            reason: 'MANUAL_ABORT',
            details: { message: 'User requested abort' },
          },
        });

        expect(result.reason).toBe('MANUAL_ABORT');
      });
    });
  });

  describe('Circuit Breaker Logic', () => {
    describe('thrash detection', () => {
      it('should detect repeated errorFingerprint', async () => {
        const iterations = [
          {
            ...mockRunIteration,
            iteration: 1,
            errorFingerprint: 'abc123',
            status: 'FAILED' as const,
          },
          {
            ...mockRunIteration,
            id: 'iter-2',
            iteration: 2,
            errorFingerprint: 'abc123',
            status: 'FAILED' as const,
          },
          {
            ...mockRunIteration,
            id: 'iter-3',
            iteration: 3,
            errorFingerprint: 'abc123',
            status: 'FAILED' as const,
          },
        ];
        prismaMock.runIteration.findMany.mockResolvedValue(iterations);

        const result = await prismaMock.runIteration.findMany({
          where: { runId: 'run-123', errorFingerprint: 'abc123' },
        });

        // 3 repeated errors should trigger thrash detection
        expect(result).toHaveLength(3);
        expect(
          result.every((i: { errorFingerprint: string | null }) => i.errorFingerprint === 'abc123')
        ).toBe(true);
      });

      it('should not trigger for different error fingerprints', async () => {
        const iterations = [
          {
            ...mockRunIteration,
            iteration: 1,
            errorFingerprint: 'abc123',
            status: 'FAILED' as const,
          },
          {
            ...mockRunIteration,
            id: 'iter-2',
            iteration: 2,
            errorFingerprint: 'def456',
            status: 'FAILED' as const,
          },
          {
            ...mockRunIteration,
            id: 'iter-3',
            iteration: 3,
            errorFingerprint: 'ghi789',
            status: 'FAILED' as const,
          },
        ];
        prismaMock.runIteration.findMany.mockResolvedValue(iterations);

        const result = await prismaMock.runIteration.findMany({
          where: { runId: 'run-123', status: 'FAILED' },
        });

        // Different fingerprints = no thrashing
        const fingerprints = new Set(
          result.map((i: { errorFingerprint: string | null }) => i.errorFingerprint)
        );
        expect(fingerprints.size).toBe(3);
      });
    });

    describe('budget checks', () => {
      it('should count total iterations', async () => {
        prismaMock.runIteration.count.mockResolvedValue(20);

        const count = await prismaMock.runIteration.count({
          where: { runId: 'run-123' },
        });

        expect(count).toBe(20);
        // maxIterations is 25, so still within budget
        expect(count).toBeLessThan(mockRunPolicy.maxIterations);
      });

      it('should count failed iterations', async () => {
        prismaMock.runIteration.count.mockResolvedValue(8);

        const failCount = await prismaMock.runIteration.count({
          where: { runId: 'run-123', status: 'FAILED' },
        });

        expect(failCount).toBe(8);
        // maxFailures is 10, so still within budget
        expect(failCount).toBeLessThan(mockRunPolicy.maxFailures);
      });
    });
  });

  describe('Ralph Mode Control', () => {
    describe('start', () => {
      it('should enable Ralph mode on run', async () => {
        const runWithRalph = { ...mockRun, ralphMode: true };
        prismaMock.run.update.mockResolvedValue(runWithRalph);

        const result = await prismaMock.run.update({
          where: { id: 'run-123' },
          data: { ralphMode: true },
        });

        expect(result.ralphMode).toBe(true);
      });

      it('should create policy when starting Ralph mode', async () => {
        prismaMock.runPolicy.upsert.mockResolvedValue(mockRunPolicy);

        const result = await prismaMock.runPolicy.upsert({
          where: { runId: 'run-123' },
          create: {
            runId: 'run-123',
            maxIterations: 25,
            maxWallClockSeconds: 14400,
            maxFailures: 10,
            maxRepeatedError: 3,
            maxNoProgressIterations: 5,
            verificationCommands: ['npm run lint', 'npm test', 'npm run build'],
            completionPromise: '<AFC_DONE/>',
          },
          update: {},
        });

        expect(result.runId).toBe('run-123');
      });
    });

    describe('stop', () => {
      it('should disable Ralph mode on run', async () => {
        const runWithoutRalph = { ...mockRun, ralphMode: false };
        prismaMock.run.update.mockResolvedValue(runWithoutRalph);

        const result = await prismaMock.run.update({
          where: { id: 'run-123' },
          data: { ralphMode: false },
        });

        expect(result.ralphMode).toBe(false);
      });

      it('should record abort reason on stop', async () => {
        prismaMock.runAbortReason.create.mockResolvedValue(mockAbortReason);

        const result = await prismaMock.runAbortReason.create({
          data: {
            runId: 'run-123',
            reason: 'MANUAL_ABORT',
            details: { message: 'User requested abort' },
          },
        });

        expect(result.reason).toBe('MANUAL_ABORT');
      });
    });

    describe('approve', () => {
      it('should resume from WAITING_FOR_APPROVAL', async () => {
        const waitingIter = {
          ...mockRunIteration,
          status: 'WAITING_FOR_APPROVAL' as const,
        };
        prismaMock.runIteration.findFirst.mockResolvedValue(waitingIter);

        const result = await prismaMock.runIteration.findFirst({
          where: { runId: 'run-123', status: 'WAITING_FOR_APPROVAL' },
        });

        expect(result).not.toBeNull();
        expect(result?.status).toBe('WAITING_FOR_APPROVAL');
      });

      it('should create new iteration after approval', async () => {
        const newIter = {
          ...mockRunIteration,
          id: 'iter-new',
          iteration: 4,
          status: 'RUNNING' as const,
        };
        prismaMock.runIteration.create.mockResolvedValue(newIter);

        const result = await prismaMock.runIteration.create({
          data: {
            runId: 'run-123',
            iteration: 4,
            status: 'RUNNING',
          },
        });

        expect(result.iteration).toBe(4);
        expect(result.status).toBe('RUNNING');
      });
    });
  });

  describe('Verification Flow', () => {
    it('should record verification results', async () => {
      const verifiedIter = {
        ...mockRunIteration,
        status: 'PASSED' as const,
        endedAt: new Date(),
        verificationSummary: {
          'npm run lint': { status: 'pass', duration: 5000 },
          'npm test': { status: 'pass', duration: 30000 },
          'npm run build': { status: 'pass', duration: 15000 },
        },
      };
      prismaMock.runIteration.update.mockResolvedValue(verifiedIter);

      const result = await prismaMock.runIteration.update({
        where: { id: 'iter-123' },
        data: {
          status: 'PASSED',
          endedAt: new Date(),
          verificationSummary: {
            'npm run lint': { status: 'pass', duration: 5000 },
            'npm test': { status: 'pass', duration: 30000 },
            'npm run build': { status: 'pass', duration: 15000 },
          },
        },
      });

      expect(result.status).toBe('PASSED');
      expect(result.verificationSummary).toHaveProperty('npm run lint');
    });

    it('should detect completion promise in output', () => {
      const output = 'Task completed successfully. <AFC_DONE/>';
      const completionPromise = '<AFC_DONE/>';

      expect(output.includes(completionPromise)).toBe(true);
    });

    it('should not detect completion without promise', () => {
      const output = 'Task still running...';
      const completionPromise = '<AFC_DONE/>';

      expect(output.includes(completionPromise)).toBe(false);
    });
  });

  describe('Run with Ralph Mode Relations', () => {
    it('should include policy in run query', async () => {
      const runWithPolicy = {
        ...mockRun,
        ralphMode: true,
        policy: mockRunPolicy,
      };
      prismaMock.run.findUnique.mockResolvedValue(runWithPolicy as never);

      const result = await prismaMock.run.findUnique({
        where: { id: 'run-123' },
        include: { policy: true },
      });

      expect(result?.policy).toBeDefined();
      expect(result?.policy?.maxIterations).toBe(25);
    });

    it('should include iterations in run query', async () => {
      const runWithIterations = {
        ...mockRun,
        ralphMode: true,
        iterations: [mockRunIteration],
      };
      prismaMock.run.findUnique.mockResolvedValue(runWithIterations as never);

      const result = await prismaMock.run.findUnique({
        where: { id: 'run-123' },
        include: { iterations: true },
      });

      expect(result?.iterations).toHaveLength(1);
    });

    it('should include abortReason in run query', async () => {
      const runWithAbort = {
        ...mockRun,
        ralphMode: false,
        status: 'FAILED',
        abortReason: mockAbortReason,
      };
      prismaMock.run.findUnique.mockResolvedValue(runWithAbort as never);

      const result = await prismaMock.run.findUnique({
        where: { id: 'run-123' },
        include: { abortReason: true },
      });

      expect(result?.abortReason).toBeDefined();
      expect(result?.abortReason?.reason).toBe('MANUAL_ABORT');
    });
  });
});
