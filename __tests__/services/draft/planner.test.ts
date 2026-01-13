/**
 * Unit tests for planDraftActions
 *
 * Tests the draft planning logic that generates DraftPlan objects
 * describing what operations will be performed when a draft is approved.
 */

// Mock Prisma before importing the module
jest.mock('@/lib/prisma', () => ({
  getPrisma: jest.fn(() => null),
}));

import { planDraftActions, DraftKind } from '@/services/draft/planner';

describe('planDraftActions', () => {
  describe('BLUEPRINT drafts', () => {
    it('should generate CREATE operations for Blueprint and BlueprintVersion', async () => {
      const draft = {
        id: 'draft-123',
        kind: 'BLUEPRINT' as DraftKind,
        payloadJson: JSON.stringify({
          blueprint: {
            name: 'Test Blueprint',
            description: 'A test blueprint',
            modules: [
              { key: 'auth', title: 'Auth Module', domain: 'auth', spec: 'spec1' },
              { key: 'data', title: 'Data Module', domain: 'data', spec: 'spec2' },
            ],
          },
          determinism: {
            specHash: 'hash-abc123',
            stableOrder: true,
          },
        }),
        projectId: 'project-1',
      };

      const plan = await planDraftActions(draft);

      expect(plan.draftId).toBe('draft-123');
      expect(plan.kind).toBe('BLUEPRINT');
      expect(plan.operations).toHaveLength(2);

      // First operation: Create Blueprint
      expect(plan.operations[0].op).toBe('CREATE');
      expect(plan.operations[0].model).toBe('Blueprint');
      expect(plan.operations[0].summary).toContain('Test Blueprint');
      expect(plan.operations[0].fieldsPreview.moduleCount).toBe(2);

      // Second operation: Create BlueprintVersion
      expect(plan.operations[1].op).toBe('CREATE');
      expect(plan.operations[1].model).toBe('BlueprintVersion');
      expect(plan.operations[1].fieldsPreview.specHash).toBe('hash-abc123');

      // Checks
      expect(plan.checks.councilRequired).toBe(false);
      expect(plan.checks.willCreateCount['Blueprint']).toBe(1);
      expect(plan.checks.willCreateCount['BlueprintVersion']).toBe(1);
    });

    it('should handle missing blueprint payload gracefully', async () => {
      const draft = {
        id: 'draft-456',
        kind: 'BLUEPRINT' as DraftKind,
        payloadJson: JSON.stringify({}),
        projectId: null,
      };

      const plan = await planDraftActions(draft);

      expect(plan.operations).toHaveLength(1);
      expect(plan.operations[0].warnings).toContain('Blueprint payload is missing from draft');
    });
  });

  describe('COUNCIL drafts', () => {
    it('should generate CREATE operation for CouncilDecision', async () => {
      const draft = {
        id: 'draft-789',
        kind: 'COUNCIL' as DraftKind,
        payloadJson: JSON.stringify({
          council: {
            projectId: 'project-1',
            type: 'BUILD',
            risk: 'MEDIUM',
            rationale: 'This is a test rationale for the council decision',
            risks: ['Risk 1', 'Risk 2'],
            mitigations: ['Mitigation 1', 'Mitigation 2'],
          },
        }),
        projectId: 'project-1',
      };

      const plan = await planDraftActions(draft);

      expect(plan.draftId).toBe('draft-789');
      expect(plan.kind).toBe('COUNCIL');
      expect(plan.operations).toHaveLength(1);

      // Create CouncilDecision
      expect(plan.operations[0].op).toBe('CREATE');
      expect(plan.operations[0].model).toBe('CouncilDecision');
      expect(plan.operations[0].summary).toContain('BUILD');
      expect(plan.operations[0].summary).toContain('MEDIUM');
      expect(plan.operations[0].fieldsPreview.risksCount).toBe(2);
      expect(plan.operations[0].fieldsPreview.mitigationsCount).toBe(2);

      // Checks
      expect(plan.checks.councilRequired).toBe(false);
      expect(plan.checks.willCreateCount['CouncilDecision']).toBe(1);
    });

    it('should handle missing council payload gracefully', async () => {
      const draft = {
        id: 'draft-abc',
        kind: 'COUNCIL' as DraftKind,
        payloadJson: JSON.stringify({}),
        projectId: null,
      };

      const plan = await planDraftActions(draft);

      expect(plan.operations).toHaveLength(1);
      expect(plan.operations[0].warnings).toContain('Council payload is missing from draft');
    });
  });

  describe('WORKORDERS drafts', () => {
    it('should generate CREATE operation for WorkOrders', async () => {
      const draft = {
        id: 'draft-wo-1',
        kind: 'WORKORDERS' as DraftKind,
        payloadJson: JSON.stringify({
          source: {
            blueprintId: 'bp-123',
            versionId: 'v-456',
          },
          slice: {
            policy: {
              domainOrder: ['auth', 'data', 'api'],
              maxItems: 10,
            },
          },
        }),
        projectId: 'project-1',
      };

      const plan = await planDraftActions(draft);

      expect(plan.draftId).toBe('draft-wo-1');
      expect(plan.kind).toBe('WORKORDERS');

      // Should have slice API call and WorkOrder creation
      expect(plan.operations.length).toBeGreaterThanOrEqual(1);

      // Check for CALL_API operation (slicer)
      const sliceOp = plan.operations.find(op => op.op === 'CALL_API');
      if (sliceOp) {
        expect(sliceOp.model).toBe('BlueprintSlicer');
      }

      // Check for CREATE WorkOrder operation
      const createOp = plan.operations.find(op => op.model === 'WorkOrder');
      expect(createOp).toBeDefined();
      expect(createOp?.op).toBe('CREATE');

      // Checks - Council should be required for WorkOrders if projectId is present
      expect(plan.checks.councilRequired).toBe(true);
    });

    it('should warn about missing blueprint reference', async () => {
      const draft = {
        id: 'draft-wo-2',
        kind: 'WORKORDERS' as DraftKind,
        payloadJson: JSON.stringify({
          source: {},
          slice: null,
        }),
        projectId: 'project-1',
      };

      const plan = await planDraftActions(draft);

      const workOrderOp = plan.operations.find(op => op.model === 'WorkOrder');
      expect(workOrderOp?.warnings).toContain('WorkOrders draft missing blueprint ref.');
      expect(plan.checks.councilRequired).toBe(true);
    });
  });

  describe('Plan determinism', () => {
    it('should produce identical plans for the same input', async () => {
      const draft = {
        id: 'draft-det-1',
        kind: 'BLUEPRINT' as DraftKind,
        payloadJson: JSON.stringify({
          blueprint: {
            name: 'Deterministic Blueprint',
            description: 'Testing determinism',
            modules: [{ key: 'mod1', title: 'Module 1', domain: 'core', spec: 'spec' }],
          },
          determinism: { specHash: 'fixed-hash', stableOrder: true },
        }),
        projectId: 'project-det',
      };

      const plan1 = await planDraftActions(draft);
      const plan2 = await planDraftActions(draft);

      // Plans should be identical
      expect(plan1.operations.length).toBe(plan2.operations.length);
      expect(plan1.operations[0].summary).toBe(plan2.operations[0].summary);
      expect(plan1.checks).toEqual(plan2.checks);
    });
  });
});
