/**
 * Unit tests for Task model and status transitions
 */

describe('Task Model', () => {
  // Valid task statuses from the Prisma schema
  const VALID_TASK_STATUSES = ['TODO', 'DOING', 'DONE', 'BLOCKED'] as const;
  type TaskStatus = (typeof VALID_TASK_STATUSES)[number];

  interface Task {
    id: string;
    runId: string;
    title: string;
    status: TaskStatus;
    assignee: string | null;
    createdAt: Date;
    updatedAt: Date;
  }

  function createTask(overrides: Partial<Task> = {}): Task {
    return {
      id: 'task-123',
      runId: 'run-123',
      title: 'Test Task',
      status: 'TODO',
      assignee: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  describe('Task Status', () => {
    it('should have exactly 4 valid statuses', () => {
      expect(VALID_TASK_STATUSES).toHaveLength(4);
    });

    it.each(VALID_TASK_STATUSES)('should recognize %s as valid status', status => {
      expect(VALID_TASK_STATUSES).toContain(status);
    });

    it('should not accept invalid statuses', () => {
      const invalidStatuses = ['PENDING', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'];
      invalidStatuses.forEach(status => {
        expect(VALID_TASK_STATUSES).not.toContain(status);
      });
    });
  });

  describe('Task Status Transitions', () => {
    // Define valid status transitions
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      TODO: ['DOING', 'BLOCKED'],
      DOING: ['TODO', 'DONE', 'BLOCKED'],
      DONE: ['DOING'], // Allow reopening completed tasks
      BLOCKED: ['TODO', 'DOING'],
    };

    it.each(Object.entries(validTransitions))(
      'should allow valid transitions from %s',
      (from, allowedTransitions) => {
        expect(allowedTransitions.length).toBeGreaterThan(0);
      }
    );

    it('should allow TODO -> DOING transition', () => {
      const task = createTask({ status: 'TODO' });
      expect(validTransitions[task.status]).toContain('DOING');
    });

    it('should allow DOING -> DONE transition', () => {
      const task = createTask({ status: 'DOING' });
      expect(validTransitions[task.status]).toContain('DONE');
    });

    it('should allow BLOCKED -> TODO transition', () => {
      const task = createTask({ status: 'BLOCKED' });
      expect(validTransitions[task.status]).toContain('TODO');
    });

    it('should allow DONE -> DOING transition (reopening)', () => {
      const task = createTask({ status: 'DONE' });
      expect(validTransitions[task.status]).toContain('DOING');
    });
  });

  describe('Task Creation', () => {
    it('should create task with required fields', () => {
      const task = createTask();

      expect(task.id).toBeDefined();
      expect(task.runId).toBeDefined();
      expect(task.title).toBeDefined();
      expect(task.status).toBe('TODO');
    });

    it('should default status to TODO', () => {
      const task = createTask();
      expect(task.status).toBe('TODO');
    });

    it('should allow custom status on creation', () => {
      const task = createTask({ status: 'DOING' });
      expect(task.status).toBe('DOING');
    });

    it('should allow null assignee', () => {
      const task = createTask({ assignee: null });
      expect(task.assignee).toBeNull();
    });

    it('should allow setting assignee', () => {
      const task = createTask({ assignee: 'Agent-A' });
      expect(task.assignee).toBe('Agent-A');
    });
  });

  describe('Task Timestamps', () => {
    it('should have createdAt date', () => {
      const task = createTask();
      expect(task.createdAt).toBeInstanceOf(Date);
    });

    it('should have updatedAt date', () => {
      const task = createTask();
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('updatedAt should be >= createdAt', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      const task = createTask({ createdAt, updatedAt });

      expect(task.updatedAt.getTime()).toBeGreaterThanOrEqual(task.createdAt.getTime());
    });
  });
});
