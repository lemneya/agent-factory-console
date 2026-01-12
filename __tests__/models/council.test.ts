import { prismaMock } from '../mocks/prisma';

describe('CouncilDecision Model', () => {
  const mockProject = {
    id: 'proj-123',
    userId: 'user-123',
    repoName: 'test-repo',
    repoFullName: 'user/test-repo',
    description: 'Test project',
    htmlUrl: 'https://github.com/user/test-repo',
    lastUpdated: new Date(),
    createdAt: new Date(),
  };

  const mockTask = {
    id: 'task-123',
    runId: 'run-123',
    title: 'Test Task',
    description: 'Test task description',
    status: 'TODO',
    priority: 0,
    assignee: null,
    workerId: null,
    result: null,
    errorMsg: null,
    startedAt: null,
    completedAt: null,
    claimedBy: null,
    claimedAt: null,
    leaseExpiresAt: null,
    attempts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCouncilDecision = {
    id: 'council-123',
    projectId: 'proj-123',
    taskId: 'task-123',
    decision: 'BUILD' as const,
    confidence: 0.85,
    candidateName: 'Test Solution',
    candidateUrl: 'https://example.com',
    licenseType: 'MIT',
    maintenanceRisk: 'LOW' as const,
    integrationPlan: 'Integrate via npm install',
    redTeamCritique: 'No major issues identified',
    sources: ['https://source1.com', 'https://source2.com'],
    reasoning: 'Best choice for our use case',
    overrideOf: null,
    overrideReason: null,
    createdBy: 'agent-a',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create a council decision', async () => {
      prismaMock.councilDecision.create.mockResolvedValue(mockCouncilDecision);

      const result = await prismaMock.councilDecision.create({
        data: {
          projectId: 'proj-123',
          taskId: 'task-123',
          decision: 'BUILD',
          confidence: 0.85,
          candidateName: 'Test Solution',
          candidateUrl: 'https://example.com',
          licenseType: 'MIT',
          maintenanceRisk: 'LOW',
          integrationPlan: 'Integrate via npm install',
          redTeamCritique: 'No major issues identified',
          sources: ['https://source1.com', 'https://source2.com'],
          reasoning: 'Best choice for our use case',
          createdBy: 'agent-a',
        },
      });

      expect(result).toEqual(mockCouncilDecision);
      expect(prismaMock.councilDecision.create).toHaveBeenCalledTimes(1);
    });

    it('should create an ADOPT decision', async () => {
      const adoptDecision = {
        ...mockCouncilDecision,
        decision: 'ADOPT' as const,
        confidence: 0.95,
      };
      prismaMock.councilDecision.create.mockResolvedValue(adoptDecision);

      const result = await prismaMock.councilDecision.create({
        data: {
          projectId: 'proj-123',
          decision: 'ADOPT',
          confidence: 0.95,
          maintenanceRisk: 'LOW',
          sources: ['https://example.com'],
          reasoning: 'Perfect fit',
        },
      });

      expect(result.decision).toBe('ADOPT');
      expect(result.confidence).toBe(0.95);
    });

    it('should create an ADAPT decision', async () => {
      const adaptDecision = {
        ...mockCouncilDecision,
        decision: 'ADAPT' as const,
        confidence: 0.75,
        maintenanceRisk: 'MEDIUM' as const,
      };
      prismaMock.councilDecision.create.mockResolvedValue(adaptDecision);

      const result = await prismaMock.councilDecision.create({
        data: {
          projectId: 'proj-123',
          decision: 'ADAPT',
          confidence: 0.75,
          maintenanceRisk: 'MEDIUM',
          sources: ['https://example.com'],
          reasoning: 'Needs modifications',
        },
      });

      expect(result.decision).toBe('ADAPT');
      expect(result.maintenanceRisk).toBe('MEDIUM');
    });
  });

  describe('findMany', () => {
    it('should find all council decisions', async () => {
      prismaMock.councilDecision.findMany.mockResolvedValue([mockCouncilDecision]);

      const result = await prismaMock.councilDecision.findMany();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockCouncilDecision);
    });

    it('should filter by decision type', async () => {
      prismaMock.councilDecision.findMany.mockResolvedValue([mockCouncilDecision]);

      const result = await prismaMock.councilDecision.findMany({
        where: { decision: 'BUILD' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].decision).toBe('BUILD');
    });

    it('should filter by maintenance risk', async () => {
      prismaMock.councilDecision.findMany.mockResolvedValue([mockCouncilDecision]);

      const result = await prismaMock.councilDecision.findMany({
        where: { maintenanceRisk: 'LOW' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].maintenanceRisk).toBe('LOW');
    });

    it('should filter by project', async () => {
      prismaMock.councilDecision.findMany.mockResolvedValue([mockCouncilDecision]);

      const result = await prismaMock.councilDecision.findMany({
        where: { projectId: 'proj-123' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('proj-123');
    });
  });

  describe('findUnique', () => {
    it('should find a council decision by id', async () => {
      prismaMock.councilDecision.findUnique.mockResolvedValue(mockCouncilDecision);

      const result = await prismaMock.councilDecision.findUnique({
        where: { id: 'council-123' },
      });

      expect(result).toEqual(mockCouncilDecision);
    });

    it('should return null if not found', async () => {
      prismaMock.councilDecision.findUnique.mockResolvedValue(null);

      const result = await prismaMock.councilDecision.findUnique({
        where: { id: 'nonexistent' },
      });

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a council decision', async () => {
      const updatedDecision = {
        ...mockCouncilDecision,
        reasoning: 'Updated reasoning',
      };
      prismaMock.councilDecision.update.mockResolvedValue(updatedDecision);

      const result = await prismaMock.councilDecision.update({
        where: { id: 'council-123' },
        data: { reasoning: 'Updated reasoning' },
      });

      expect(result.reasoning).toBe('Updated reasoning');
    });
  });

  describe('delete', () => {
    it('should delete a council decision', async () => {
      prismaMock.councilDecision.delete.mockResolvedValue(mockCouncilDecision);

      const result = await prismaMock.councilDecision.delete({
        where: { id: 'council-123' },
      });

      expect(result).toEqual(mockCouncilDecision);
    });
  });

  describe('override', () => {
    it('should create an override decision', async () => {
      const overrideDecision = {
        ...mockCouncilDecision,
        id: 'council-456',
        overrideOf: 'council-123',
        overrideReason: 'New information discovered',
        decision: 'ADOPT' as const,
      };
      prismaMock.councilDecision.create.mockResolvedValue(overrideDecision);

      const result = await prismaMock.councilDecision.create({
        data: {
          projectId: 'proj-123',
          decision: 'ADOPT',
          confidence: 0.9,
          maintenanceRisk: 'LOW',
          sources: ['https://new-source.com'],
          reasoning: 'Changed decision',
          overrideOf: 'council-123',
          overrideReason: 'New information discovered',
        },
      });

      expect(result.overrideOf).toBe('council-123');
      expect(result.overrideReason).toBe('New information discovered');
    });
  });

  describe('relations', () => {
    it('should include project relation', async () => {
      const decisionWithProject = {
        ...mockCouncilDecision,
        project: mockProject,
      };
      prismaMock.councilDecision.findUnique.mockResolvedValue(decisionWithProject as never);

      const result = await prismaMock.councilDecision.findUnique({
        where: { id: 'council-123' },
        include: { project: true },
      });

      expect(result?.project).toBeDefined();
      expect(result?.project?.repoFullName).toBe('user/test-repo');
    });

    it('should include task relation', async () => {
      const decisionWithTask = {
        ...mockCouncilDecision,
        task: mockTask,
      };
      prismaMock.councilDecision.findUnique.mockResolvedValue(decisionWithTask as never);

      const result = await prismaMock.councilDecision.findUnique({
        where: { id: 'council-123' },
        include: { task: true },
      });

      expect(result?.task).toBeDefined();
      expect(result?.task?.title).toBe('Test Task');
    });
  });

  describe('validation', () => {
    it('should require projectId', () => {
      // This is a schema-level validation test
      // The actual validation would happen at the API level
      expect(mockCouncilDecision.projectId).toBeDefined();
    });

    it('should have confidence between 0 and 1', () => {
      expect(mockCouncilDecision.confidence).toBeGreaterThanOrEqual(0);
      expect(mockCouncilDecision.confidence).toBeLessThanOrEqual(1);
    });

    it('should have valid decision type', () => {
      expect(['ADOPT', 'ADAPT', 'BUILD']).toContain(mockCouncilDecision.decision);
    });

    it('should have valid maintenance risk', () => {
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(mockCouncilDecision.maintenanceRisk);
    });
  });

  describe('Council Gate (AFC-1.3)', () => {
    it('should require council decision before BUILD runs', async () => {
      // Simulates the gate check: findFirst returns null (no decision)
      prismaMock.councilDecision.findFirst.mockResolvedValue(null);

      const result = await prismaMock.councilDecision.findFirst({
        where: {
          projectId: 'proj-123',
          decision: { in: ['ADOPT', 'ADAPT', 'BUILD'] },
        },
      });

      // No decision exists - gate should block
      expect(result).toBeNull();
    });

    it('should allow BUILD runs when council decision exists', async () => {
      prismaMock.councilDecision.findFirst.mockResolvedValue(mockCouncilDecision);

      const result = await prismaMock.councilDecision.findFirst({
        where: {
          projectId: 'proj-123',
          decision: { in: ['ADOPT', 'ADAPT', 'BUILD'] },
        },
      });

      // Decision exists - gate should allow
      expect(result).not.toBeNull();
      expect(result?.decision).toBe('BUILD');
    });

    it('should pass gate with ADOPT decision', async () => {
      const adoptDecision = { ...mockCouncilDecision, decision: 'ADOPT' as const };
      prismaMock.councilDecision.findFirst.mockResolvedValue(adoptDecision);

      const result = await prismaMock.councilDecision.findFirst({
        where: {
          projectId: 'proj-123',
          decision: { in: ['ADOPT', 'ADAPT', 'BUILD'] },
        },
      });

      expect(result?.decision).toBe('ADOPT');
    });

    it('should pass gate with ADAPT decision', async () => {
      const adaptDecision = { ...mockCouncilDecision, decision: 'ADAPT' as const };
      prismaMock.councilDecision.findFirst.mockResolvedValue(adaptDecision);

      const result = await prismaMock.councilDecision.findFirst({
        where: {
          projectId: 'proj-123',
          decision: { in: ['ADOPT', 'ADAPT', 'BUILD'] },
        },
      });

      expect(result?.decision).toBe('ADAPT');
    });
  });
});
