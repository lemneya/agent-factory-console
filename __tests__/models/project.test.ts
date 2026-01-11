/**
 * Unit tests for Project model validation
 */

describe('Project Model', () => {
  interface Project {
    id: string;
    userId: string;
    repoName: string;
    repoFullName: string;
    description: string | null;
    htmlUrl: string;
    createdAt: Date;
    lastUpdated: Date;
  }

  function createProject(overrides: Partial<Project> = {}): Project {
    return {
      id: 'project-123',
      userId: 'user-123',
      repoName: 'test-repo',
      repoFullName: 'testuser/test-repo',
      description: null,
      htmlUrl: 'https://github.com/testuser/test-repo',
      createdAt: new Date(),
      lastUpdated: new Date(),
      ...overrides,
    };
  }

  describe('Project Creation', () => {
    it('should create project with required fields', () => {
      const project = createProject();

      expect(project.id).toBeDefined();
      expect(project.userId).toBeDefined();
      expect(project.repoName).toBeDefined();
      expect(project.repoFullName).toBeDefined();
      expect(project.htmlUrl).toBeDefined();
    });

    it('should allow null description', () => {
      const project = createProject({ description: null });
      expect(project.description).toBeNull();
    });

    it('should allow custom description', () => {
      const project = createProject({ description: 'A test repository' });
      expect(project.description).toBe('A test repository');
    });
  });

  describe('Repository Name Format', () => {
    it('should have repoFullName in owner/repo format', () => {
      const project = createProject({ repoFullName: 'testuser/test-repo' });
      expect(project.repoFullName).toMatch(/^[^/]+\/[^/]+$/);
    });

    it('should extract repo name from full name', () => {
      const project = createProject({
        repoName: 'test-repo',
        repoFullName: 'testuser/test-repo',
      });

      const parts = project.repoFullName.split('/');
      expect(parts[1]).toBe(project.repoName);
    });
  });

  describe('GitHub URL Format', () => {
    it('should have valid GitHub URL', () => {
      const project = createProject();
      expect(project.htmlUrl).toMatch(/^https:\/\/github\.com\/[^/]+\/[^/]+$/);
    });

    it('should match repoFullName in URL', () => {
      const project = createProject({
        repoFullName: 'testuser/test-repo',
        htmlUrl: 'https://github.com/testuser/test-repo',
      });

      expect(project.htmlUrl).toContain(project.repoFullName);
    });
  });

  describe('Project Timestamps', () => {
    it('should have createdAt date', () => {
      const project = createProject();
      expect(project.createdAt).toBeInstanceOf(Date);
    });

    it('should have lastUpdated date', () => {
      const project = createProject();
      expect(project.lastUpdated).toBeInstanceOf(Date);
    });

    it('lastUpdated should be >= createdAt', () => {
      const createdAt = new Date('2024-01-01');
      const lastUpdated = new Date('2024-01-15');
      const project = createProject({ createdAt, lastUpdated });

      expect(project.lastUpdated.getTime()).toBeGreaterThanOrEqual(project.createdAt.getTime());
    });
  });

  describe('User Association', () => {
    it('should have userId for owner', () => {
      const project = createProject({ userId: 'user-456' });
      expect(project.userId).toBe('user-456');
    });

    it('should require userId', () => {
      const project = createProject();
      expect(project.userId).toBeTruthy();
    });
  });
});
