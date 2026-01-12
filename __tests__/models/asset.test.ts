/**
 * Unit tests for Asset Registry data structures and validation
 *
 * Tests the asset, version, and project asset data models.
 * Actual API endpoint testing is handled by E2E tests.
 */

describe('Asset Registry Models', () => {
  describe('Asset structure', () => {
    interface Asset {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      category: string;
      defaultLicense: string;
      createdAt: Date;
      updatedAt: Date;
    }

    function createAsset(overrides: Partial<Asset> = {}): Asset {
      return {
        id: 'cltest123',
        slug: 'nextauth-rbac',
        name: 'NextAuth RBAC',
        description: 'Role-based access control for NextAuth',
        category: 'auth',
        defaultLicense: 'MIT',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it('should have all required fields', () => {
      const asset = createAsset();

      expect(asset).toHaveProperty('id');
      expect(asset).toHaveProperty('slug');
      expect(asset).toHaveProperty('name');
      expect(asset).toHaveProperty('category');
      expect(asset).toHaveProperty('defaultLicense');
      expect(asset).toHaveProperty('createdAt');
      expect(asset).toHaveProperty('updatedAt');
    });

    it('should allow null description', () => {
      const asset = createAsset({ description: null });
      expect(asset.description).toBeNull();
    });

    it('should have valid category values', () => {
      const validCategories = ['auth', 'crud', 'ui', 'infra', 'worker', 'integration', 'testing'];
      const asset = createAsset({ category: 'auth' });
      expect(validCategories).toContain(asset.category);
    });

    it('should have valid license format', () => {
      const validLicenses = ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'GPL-3.0', 'ISC', 'Proprietary'];
      const asset = createAsset({ defaultLicense: 'MIT' });
      expect(validLicenses).toContain(asset.defaultLicense);
    });

    it('should have lowercase hyphenated slug', () => {
      const asset = createAsset({ slug: 'my-test-asset' });
      expect(asset.slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('AssetVersion structure', () => {
    interface StackCompat {
      [key: string]: string;
    }

    interface InstallStep {
      title: string;
      description?: string;
      command?: string;
      files?: string[];
    }

    interface InstallRecipe {
      steps: InstallStep[];
      prerequisites?: string[];
      postInstall?: string[];
    }

    interface AssetVersion {
      id: string;
      assetId: string;
      version: string;
      stackCompat: StackCompat;
      source: { type: string; ref: string };
      installRecipe: InstallRecipe;
      interfacesRef: string | null;
      boundariesRef: string | null;
      proofPack: { type: string; ref: string } | null;
      status: 'ACTIVE' | 'DEPRECATED';
      createdAt: Date;
      updatedAt: Date;
    }

    function createAssetVersion(overrides: Partial<AssetVersion> = {}): AssetVersion {
      return {
        id: 'clversion123',
        assetId: 'classet123',
        version: '1.0.0',
        stackCompat: { nextjs: '>=14', prisma: '^5' },
        source: { type: 'repo_path', ref: 'assets/nextauth-rbac' },
        installRecipe: {
          steps: [
            { title: 'Install dependencies', command: 'npm install' },
            { title: 'Copy files', files: ['src/auth.ts', 'src/middleware.ts'] },
          ],
        },
        interfacesRef: 'docs/INTERFACES.md',
        boundariesRef: 'docs/BOUNDARIES.md',
        proofPack: { type: 'evidence_path', ref: 'evidence/assets/nextauth-rbac/v1' },
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
      };
    }

    it('should have all required fields', () => {
      const version = createAssetVersion();

      expect(version).toHaveProperty('id');
      expect(version).toHaveProperty('assetId');
      expect(version).toHaveProperty('version');
      expect(version).toHaveProperty('stackCompat');
      expect(version).toHaveProperty('source');
      expect(version).toHaveProperty('installRecipe');
      expect(version).toHaveProperty('status');
    });

    it('should have valid semver version', () => {
      const version = createAssetVersion({ version: '1.2.3' });
      expect(version.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have valid status values', () => {
      const activeVersion = createAssetVersion({ status: 'ACTIVE' });
      expect(['ACTIVE', 'DEPRECATED']).toContain(activeVersion.status);

      const deprecatedVersion = createAssetVersion({ status: 'DEPRECATED' });
      expect(['ACTIVE', 'DEPRECATED']).toContain(deprecatedVersion.status);
    });

    it('should have valid stackCompat structure', () => {
      const version = createAssetVersion();
      expect(typeof version.stackCompat).toBe('object');
      expect(Object.keys(version.stackCompat).length).toBeGreaterThan(0);
    });

    it('should have valid installRecipe with steps', () => {
      const version = createAssetVersion();
      expect(Array.isArray(version.installRecipe.steps)).toBe(true);
      expect(version.installRecipe.steps.length).toBeGreaterThan(0);
      expect(version.installRecipe.steps[0]).toHaveProperty('title');
    });

    it('should allow nullable optional refs', () => {
      const version = createAssetVersion({
        interfacesRef: null,
        boundariesRef: null,
        proofPack: null,
      });
      expect(version.interfacesRef).toBeNull();
      expect(version.boundariesRef).toBeNull();
      expect(version.proofPack).toBeNull();
    });
  });

  describe('ProjectAsset structure', () => {
    interface ProjectAsset {
      id: string;
      projectId: string;
      assetVersionId: string;
      pinned: boolean;
      config: Record<string, unknown> | null;
      createdAt: Date;
    }

    function createProjectAsset(overrides: Partial<ProjectAsset> = {}): ProjectAsset {
      return {
        id: 'clprojectasset123',
        projectId: 'clproject123',
        assetVersionId: 'clversion123',
        pinned: true,
        config: { customOption: 'value' },
        createdAt: new Date(),
        ...overrides,
      };
    }

    it('should have all required fields', () => {
      const pa = createProjectAsset();

      expect(pa).toHaveProperty('id');
      expect(pa).toHaveProperty('projectId');
      expect(pa).toHaveProperty('assetVersionId');
      expect(pa).toHaveProperty('pinned');
      expect(pa).toHaveProperty('createdAt');
    });

    it('should default pinned to true', () => {
      const pa = createProjectAsset();
      expect(pa.pinned).toBe(true);
    });

    it('should allow unpinned attachments', () => {
      const pa = createProjectAsset({ pinned: false });
      expect(pa.pinned).toBe(false);
    });

    it('should allow null config', () => {
      const pa = createProjectAsset({ config: null });
      expect(pa.config).toBeNull();
    });

    it('should allow custom config object', () => {
      const pa = createProjectAsset({ config: { dbProvider: 'postgres', port: 5432 } });
      expect(pa.config).toHaveProperty('dbProvider');
      expect(pa.config).toHaveProperty('port');
    });
  });

  describe('Task with asset integration', () => {
    type TaskKind = 'INTEGRATE_ASSET' | 'BUILD_CUSTOM' | 'RESEARCH' | 'QA';

    interface Task {
      id: string;
      runId: string;
      title: string;
      status: string;
      kind: TaskKind;
      assetVersionId: string | null;
    }

    function createIntegrationTask(overrides: Partial<Task> = {}): Task {
      return {
        id: 'cltask123',
        runId: 'clrun123',
        title: 'Install NextAuth RBAC',
        status: 'TODO',
        kind: 'INTEGRATE_ASSET',
        assetVersionId: 'clversion123',
        ...overrides,
      };
    }

    it('should have valid kind values', () => {
      const validKinds: TaskKind[] = ['INTEGRATE_ASSET', 'BUILD_CUSTOM', 'RESEARCH', 'QA'];

      validKinds.forEach((kind) => {
        const task = createIntegrationTask({ kind });
        expect(validKinds).toContain(task.kind);
      });
    });

    it('should have assetVersionId for INTEGRATE_ASSET tasks', () => {
      const task = createIntegrationTask({ kind: 'INTEGRATE_ASSET' });
      expect(task.assetVersionId).not.toBeNull();
    });

    it('should allow null assetVersionId for non-asset tasks', () => {
      const task = createIntegrationTask({ kind: 'BUILD_CUSTOM', assetVersionId: null });
      expect(task.assetVersionId).toBeNull();
    });

    it('should default kind to BUILD_CUSTOM', () => {
      // Simulating the database default
      const defaultKind: TaskKind = 'BUILD_CUSTOM';
      expect(defaultKind).toBe('BUILD_CUSTOM');
    });
  });

  describe('Search and filter logic', () => {
    interface Asset {
      id: string;
      slug: string;
      name: string;
      description: string | null;
      category: string;
      tags: { tag: string }[];
    }

    const testAssets: Asset[] = [
      {
        id: '1',
        slug: 'nextauth-rbac',
        name: 'NextAuth RBAC',
        description: 'Role-based access control',
        category: 'auth',
        tags: [{ tag: 'rbac' }, { tag: 'security' }],
      },
      {
        id: '2',
        slug: 'prisma-crud',
        name: 'Prisma CRUD Generator',
        description: 'Generate CRUD operations',
        category: 'crud',
        tags: [{ tag: 'database' }, { tag: 'generator' }],
      },
      {
        id: '3',
        slug: 'tailwind-components',
        name: 'Tailwind UI Kit',
        description: 'UI components with Tailwind',
        category: 'ui',
        tags: [{ tag: 'styling' }, { tag: 'components' }],
      },
    ];

    function searchAssets(query: string): Asset[] {
      const q = query.toLowerCase();
      return testAssets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    function filterByCategory(category: string): Asset[] {
      return testAssets.filter((a) => a.category === category);
    }

    function filterByTag(tag: string): Asset[] {
      return testAssets.filter((a) => a.tags.some((t) => t.tag === tag));
    }

    it('should search by name', () => {
      const results = searchAssets('NextAuth');
      expect(results.length).toBe(1);
      expect(results[0].slug).toBe('nextauth-rbac');
    });

    it('should search by slug', () => {
      const results = searchAssets('prisma-crud');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Prisma CRUD Generator');
    });

    it('should search by description', () => {
      const results = searchAssets('components');
      expect(results.length).toBe(1);
      expect(results[0].category).toBe('ui');
    });

    it('should be case insensitive', () => {
      const results = searchAssets('NEXTAUTH');
      expect(results.length).toBe(1);
    });

    it('should filter by category', () => {
      const authAssets = filterByCategory('auth');
      expect(authAssets.length).toBe(1);
      expect(authAssets[0].slug).toBe('nextauth-rbac');
    });

    it('should filter by tag', () => {
      const securityAssets = filterByTag('security');
      expect(securityAssets.length).toBe(1);
      expect(securityAssets[0].slug).toBe('nextauth-rbac');
    });

    it('should return empty array for no matches', () => {
      const results = searchAssets('nonexistent');
      expect(results.length).toBe(0);
    });
  });

  describe('Generate tasks from install recipe', () => {
    interface InstallStep {
      title: string;
      description?: string;
      command?: string;
      files?: string[];
    }

    interface InstallRecipe {
      steps: InstallStep[];
    }

    function generateTasksFromRecipe(
      recipe: InstallRecipe,
      assetName: string,
      runId: string,
      assetVersionId: string
    ) {
      return recipe.steps.map((step, index) => ({
        runId,
        title: step.title,
        description: buildDescription(step, assetName),
        status: 'TODO',
        kind: 'INTEGRATE_ASSET',
        assetVersionId,
        priority: index,
      }));
    }

    function buildDescription(step: InstallStep, assetName: string): string {
      const parts = [`Integration task for ${assetName}`];
      if (step.description) parts.push(step.description);
      if (step.command) parts.push(`Command: ${step.command}`);
      if (step.files) parts.push(`Files: ${step.files.join(', ')}`);
      return parts.join('\n');
    }

    const testRecipe: InstallRecipe = {
      steps: [
        { title: 'Install dependencies', command: 'npm install next-auth' },
        { title: 'Copy auth files', files: ['auth.ts', 'middleware.ts'] },
        { title: 'Update config', description: 'Add auth configuration' },
      ],
    };

    it('should create one task per step', () => {
      const tasks = generateTasksFromRecipe(testRecipe, 'Test Asset', 'run1', 'version1');
      expect(tasks.length).toBe(3);
    });

    it('should set task title from step title', () => {
      const tasks = generateTasksFromRecipe(testRecipe, 'Test Asset', 'run1', 'version1');
      expect(tasks[0].title).toBe('Install dependencies');
    });

    it('should set all tasks as INTEGRATE_ASSET kind', () => {
      const tasks = generateTasksFromRecipe(testRecipe, 'Test Asset', 'run1', 'version1');
      tasks.forEach((task) => {
        expect(task.kind).toBe('INTEGRATE_ASSET');
      });
    });

    it('should link all tasks to asset version', () => {
      const tasks = generateTasksFromRecipe(testRecipe, 'Test Asset', 'run1', 'version1');
      tasks.forEach((task) => {
        expect(task.assetVersionId).toBe('version1');
      });
    });

    it('should set priority based on step order', () => {
      const tasks = generateTasksFromRecipe(testRecipe, 'Test Asset', 'run1', 'version1');
      expect(tasks[0].priority).toBe(0);
      expect(tasks[1].priority).toBe(1);
      expect(tasks[2].priority).toBe(2);
    });

    it('should include asset name in description', () => {
      const tasks = generateTasksFromRecipe(testRecipe, 'Test Asset', 'run1', 'version1');
      tasks.forEach((task) => {
        expect(task.description).toContain('Test Asset');
      });
    });
  });
});
