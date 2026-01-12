/**
 * AFC-1.7: Slicer Unit Tests
 *
 * Tests for sliceBlueprintToWorkOrders determinism and correctness
 */

import {
  sliceBlueprintToWorkOrders,
  toWorkOrderCreateInput,
  DEFAULT_OWNED_PATHS,
} from '@/lib/blueprint/slicer';
import { BlueprintSpec } from '@/lib/blueprint/schema';

describe('AFC-1.7: Slicer Algorithm', () => {
  const sampleSpec: BlueprintSpec = {
    blueprint_id: 'TEST-BP',
    title: 'Test Blueprint',
    modules: [
      {
        module_id: 'AUTH',
        title: 'Authentication Module',
        domains: ['BACKEND', 'FRONTEND', 'QA'],
        spec_items: [
          {
            spec_id: 'AUTH-001',
            must: 'Implement login endpoint',
            acceptance: ['Returns JWT on success', '401 on invalid credentials'],
          },
          {
            spec_id: 'AUTH-002',
            must: 'Implement logout endpoint',
            acceptance: ['Invalidates session'],
          },
        ],
        interfaces: [{ name: 'AuthDTO', path: 'types/auth.ts' }],
        owned_paths_hint: {
          BACKEND: ['src/app/api/auth/**'],
          FRONTEND: ['src/app/login/**'],
          QA: ['tests/auth/**'],
        },
        assets_hint: ['auth-shell'],
      },
      {
        module_id: 'USERS',
        title: 'User Management',
        domains: ['BACKEND', 'FRONTEND'],
        spec_items: [
          {
            spec_id: 'USER-001',
            must: 'CRUD for users',
            acceptance: ['All CRUD operations work'],
          },
        ],
        depends_on_modules: ['AUTH'],
      },
    ],
  };

  describe('sliceBlueprintToWorkOrders', () => {
    it('generates WorkOrders for each domain in each module', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, {
        projectId: 'proj-1',
      });

      expect(result.errors).toHaveLength(0);
      expect(result.workOrders).toHaveLength(5); // AUTH: 3 domains, USERS: 2 domains
    });

    it('generates deterministic keys', () => {
      const result1 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });
      const result2 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      expect(result1.workOrders.map(wo => wo.key)).toEqual(result2.workOrders.map(wo => wo.key));
    });

    it('generates deterministic specHash', () => {
      const result1 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });
      const result2 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      expect(result1.specHash).toBe(result2.specHash);
      expect(result1.specHash).toHaveLength(64);
    });

    it('generates deterministic order', () => {
      const result1 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });
      const result2 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      for (let i = 0; i < result1.workOrders.length; i++) {
        expect(result1.workOrders[i].key).toBe(result2.workOrders[i].key);
        expect(result1.workOrders[i].domain).toBe(result2.workOrders[i].domain);
        expect(result1.workOrders[i].moduleId).toBe(result2.workOrders[i].moduleId);
      }
    });

    it('generates correct key format', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      // Keys should be: {blueprint_id}-{domain_short}-{seq}
      const keyPattern = /^TEST-BP-(BE|UI|QA|DO|AL|IN)-\d{3}$/;
      for (const wo of result.workOrders) {
        expect(wo.key).toMatch(keyPattern);
      }
    });

    it('assigns correct domains', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const domains = result.workOrders.map(wo => wo.domain);
      expect(domains).toContain('BACKEND');
      expect(domains).toContain('FRONTEND');
      expect(domains).toContain('QA');
    });

    it('includes spec IDs from module', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authBackend).toBeDefined();
      expect(authBackend!.specIds).toContain('AUTH-001');
      expect(authBackend!.specIds).toContain('AUTH-002');
    });

    it('uses owned_paths_hint when provided', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authBackend!.ownedPaths).toContain('src/app/api/auth/**');
    });

    it('uses default owned paths when no hint', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const usersBackend = result.workOrders.find(
        wo => wo.moduleId === 'USERS' && wo.domain === 'BACKEND'
      );

      expect(usersBackend!.ownedPaths).toEqual(DEFAULT_OWNED_PATHS.BACKEND);
    });

    it('includes interfaces from module', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authBackend!.interfaces).toHaveLength(1);
      expect(authBackend!.interfaces[0].name).toBe('AuthDTO');
    });

    it('includes assets_hint', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authBackend!.assetsToUse).toContain('auth-shell');
    });

    it('generates acceptance checks from spec items', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authBackend!.acceptanceChecks).toContain('Returns JWT on success');
      expect(authBackend!.acceptanceChecks).toContain('401 on invalid credentials');
      expect(authBackend!.acceptanceChecks).toContain('Invalidates session');
    });

    it('generates memory hints', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authBackend!.memoryHints).toContain('AUTH-001');
      expect(authBackend!.memoryHints).toContain('AUTH-002');
      expect(authBackend!.memoryHints).toContain('AUTH');
      expect(authBackend!.memoryHints).toContain('domain:BACKEND');
      expect(authBackend!.memoryHints).toContain('interface:AuthDTO');
    });
  });

  describe('Default Dependencies', () => {
    it('FRONTEND depends on BACKEND', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authFrontend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'FRONTEND'
      );
      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(authFrontend!.dependsOnKeys).toContain(authBackend!.key);
    });

    it('QA depends on FRONTEND and BACKEND', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authQA = result.workOrders.find(wo => wo.moduleId === 'AUTH' && wo.domain === 'QA');
      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );
      const authFrontend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'FRONTEND'
      );

      expect(authQA!.dependsOnKeys).toContain(authBackend!.key);
      expect(authQA!.dependsOnKeys).toContain(authFrontend!.key);
    });

    it('BACKEND has no default dependencies', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      // Only cross-module deps, no intra-module deps for BACKEND
      const intraModuleDeps = authBackend!.dependsOnKeys.filter(key => key.includes('AUTH'));
      expect(intraModuleDeps).toHaveLength(0);
    });
  });

  describe('Cross-Module Dependencies', () => {
    it('adds dependencies based on depends_on_modules', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const usersBackend = result.workOrders.find(
        wo => wo.moduleId === 'USERS' && wo.domain === 'BACKEND'
      );
      const authBackend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'BACKEND'
      );

      expect(usersBackend!.dependsOnKeys).toContain(authBackend!.key);
    });

    it('adds same-domain dependency from dependent module', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      const usersFrontend = result.workOrders.find(
        wo => wo.moduleId === 'USERS' && wo.domain === 'FRONTEND'
      );
      const authFrontend = result.workOrders.find(
        wo => wo.moduleId === 'AUTH' && wo.domain === 'FRONTEND'
      );

      expect(usersFrontend!.dependsOnKeys).toContain(authFrontend!.key);
    });
  });

  describe('Dependency Graph', () => {
    it('builds correct dependency graph', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      expect(result.dependencyGraph).toBeInstanceOf(Map);
      expect(result.dependencyGraph.size).toBe(result.workOrders.length);

      for (const wo of result.workOrders) {
        expect(result.dependencyGraph.has(wo.key)).toBe(true);
        expect(result.dependencyGraph.get(wo.key)).toEqual(wo.dependsOnKeys);
      }
    });

    it('sorts dependencies for determinism', () => {
      const result1 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });
      const result2 = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });

      for (const wo of result1.workOrders) {
        const wo2 = result2.workOrders.find(w => w.key === wo.key);
        expect(wo.dependsOnKeys).toEqual(wo2!.dependsOnKeys);
      }
    });
  });

  describe('Error Handling', () => {
    it('returns errors for invalid spec', () => {
      const invalidSpec = { blueprint_id: '', title: '', modules: [] };
      const result = sliceBlueprintToWorkOrders(invalidSpec as BlueprintSpec, {
        projectId: 'proj-1',
      });

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.workOrders).toHaveLength(0);
      expect(result.specHash).toBe('');
    });

    it('returns empty workOrders for spec with no modules', () => {
      const emptySpec: BlueprintSpec = {
        blueprint_id: 'EMPTY',
        title: 'Empty Blueprint',
        modules: [],
      };
      const result = sliceBlueprintToWorkOrders(emptySpec, { projectId: 'proj-1' });

      expect(result.errors).toHaveLength(0);
      expect(result.workOrders).toHaveLength(0);
      expect(result.specHash).toHaveLength(64);
    });
  });

  describe('toWorkOrderCreateInput', () => {
    it('converts WorkOrderData to Prisma create input', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });
      const woData = result.workOrders[0];

      const createInput = toWorkOrderCreateInput(woData, 'version-1', 'proj-1', 'run-1');

      expect(createInput.project).toEqual({ connect: { id: 'proj-1' } });
      expect(createInput.run).toEqual({ connect: { id: 'run-1' } });
      expect(createInput.blueprintVersion).toEqual({ connect: { id: 'version-1' } });
      expect(createInput.key).toBe(woData.key);
      expect(createInput.title).toBe(woData.title);
      expect(createInput.domain).toBe(woData.domain);
      expect(createInput.status).toBe('PLANNED');
    });

    it('handles optional runId', () => {
      const result = sliceBlueprintToWorkOrders(sampleSpec, { projectId: 'proj-1' });
      const woData = result.workOrders[0];

      const createInput = toWorkOrderCreateInput(woData, 'version-1', 'proj-1');

      expect(createInput.run).toBeUndefined();
    });
  });

  describe('Domain Short Codes', () => {
    it('uses correct short codes in keys', () => {
      const allDomainsSpec: BlueprintSpec = {
        blueprint_id: 'ALL',
        title: 'All Domains',
        modules: [
          {
            module_id: 'MOD',
            title: 'Module',
            domains: ['FRONTEND', 'BACKEND', 'DEVOPS', 'QA', 'ALGO', 'INTEGRATION'],
            spec_items: [{ spec_id: 'S1', must: 'Test', acceptance: [] }],
          },
        ],
      };

      const result = sliceBlueprintToWorkOrders(allDomainsSpec, { projectId: 'proj-1' });

      const keys = result.workOrders.map(wo => wo.key);
      expect(keys.some(k => k.includes('-UI-'))).toBe(true); // FRONTEND
      expect(keys.some(k => k.includes('-BE-'))).toBe(true); // BACKEND
      expect(keys.some(k => k.includes('-DO-'))).toBe(true); // DEVOPS
      expect(keys.some(k => k.includes('-QA-'))).toBe(true); // QA
      expect(keys.some(k => k.includes('-AL-'))).toBe(true); // ALGO
      expect(keys.some(k => k.includes('-IN-'))).toBe(true); // INTEGRATION
    });
  });
});
