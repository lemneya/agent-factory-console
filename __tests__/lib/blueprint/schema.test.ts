/**
 * AFC-1.7: Blueprint Schema Validation Unit Tests
 *
 * Tests for validateBlueprintSpec, computeSpecHash, canonicalizeJson
 */

import {
  validateBlueprintSpec,
  computeSpecHash,
  canonicalizeJson,
  SCHEMA_VERSION,
  SIZE_CAPS,
  VALID_DOMAINS,
  BlueprintSpec,
} from '@/lib/blueprint/schema';

describe('AFC-1.7: Blueprint Schema Validation', () => {
  describe('canonicalizeJson', () => {
    it('sorts object keys alphabetically', () => {
      const input = { z: 1, a: 2, m: 3 };
      const result = canonicalizeJson(input);
      expect(result).toBe('{"a":2,"m":3,"z":1}');
    });

    it('handles nested objects', () => {
      const input = { b: { z: 1, a: 2 }, a: 1 };
      const result = canonicalizeJson(input);
      expect(result).toBe('{"a":1,"b":{"a":2,"z":1}}');
    });

    it('preserves array order', () => {
      const input = { items: [3, 1, 2] };
      const result = canonicalizeJson(input);
      expect(result).toBe('{"items":[3,1,2]}');
    });

    it('handles arrays of objects', () => {
      const input = { items: [{ z: 1, a: 2 }, { b: 3 }] };
      const result = canonicalizeJson(input);
      expect(result).toBe('{"items":[{"a":2,"z":1},{"b":3}]}');
    });
  });

  describe('computeSpecHash', () => {
    it('produces consistent hash for same input', () => {
      const spec: BlueprintSpec = {
        blueprint_id: 'TEST',
        title: 'Test Blueprint',
        modules: [],
      };

      const hash1 = computeSpecHash(spec);
      const hash2 = computeSpecHash(spec);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex
    });

    it('produces same hash regardless of key order', () => {
      const spec1 = { blueprint_id: 'TEST', title: 'Test', modules: [] };
      const spec2 = { title: 'Test', modules: [], blueprint_id: 'TEST' };

      const hash1 = computeSpecHash(spec1 as BlueprintSpec);
      const hash2 = computeSpecHash(spec2 as BlueprintSpec);

      expect(hash1).toBe(hash2);
    });

    it('produces different hash for different content', () => {
      const spec1: BlueprintSpec = {
        blueprint_id: 'TEST1',
        title: 'Test Blueprint',
        modules: [],
      };
      const spec2: BlueprintSpec = {
        blueprint_id: 'TEST2',
        title: 'Test Blueprint',
        modules: [],
      };

      const hash1 = computeSpecHash(spec1);
      const hash2 = computeSpecHash(spec2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validateBlueprintSpec', () => {
    const validSpec: BlueprintSpec = {
      blueprint_id: 'TEST-001',
      title: 'Test Blueprint',
      description: 'A test blueprint',
      modules: [
        {
          module_id: 'MOD-001',
          title: 'Test Module',
          domains: ['BACKEND', 'FRONTEND'],
          spec_items: [
            {
              spec_id: 'SPEC-001',
              must: 'Implement feature X',
              acceptance: ['Test passes', 'Code reviewed'],
            },
          ],
        },
      ],
    };

    it('validates a correct spec', () => {
      const result = validateBlueprintSpec(validSpec);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.specIds).toContain('SPEC-001');
      expect(result.specHash).toBeDefined();
      expect(result.specHash).toHaveLength(64);
    });

    it('rejects null input', () => {
      const result = validateBlueprintSpec(null);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Blueprint spec must be a non-null object');
    });

    it('rejects non-object input', () => {
      const result = validateBlueprintSpec('not an object');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Blueprint spec must be a non-null object');
    });

    it('requires blueprint_id', () => {
      const spec = { ...validSpec, blueprint_id: '' };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('blueprint_id is required and must be a non-empty string');
    });

    it('requires title', () => {
      const spec = { ...validSpec, title: '' };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('title is required and must be a non-empty string');
    });

    it('requires modules array', () => {
      const spec = { ...validSpec, modules: 'not an array' };
      const result = validateBlueprintSpec(spec as unknown as BlueprintSpec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('modules is required and must be an array');
    });

    it('validates module_id uniqueness', () => {
      const spec = {
        ...validSpec,
        modules: [
          { ...validSpec.modules[0], module_id: 'DUP' },
          { ...validSpec.modules[0], module_id: 'DUP' },
        ],
      };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate module_id: DUP');
    });

    it('validates spec_id uniqueness', () => {
      const spec = {
        ...validSpec,
        modules: [
          {
            ...validSpec.modules[0],
            spec_items: [
              { spec_id: 'DUP', must: 'Test', acceptance: [] },
              { spec_id: 'DUP', must: 'Test', acceptance: [] },
            ],
          },
        ],
      };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate spec_id: DUP');
    });

    it('validates domain values', () => {
      const spec = {
        ...validSpec,
        modules: [
          {
            ...validSpec.modules[0],
            domains: ['INVALID_DOMAIN'],
          },
        ],
      };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid domain'))).toBe(true);
    });

    it('validates all valid domains', () => {
      for (const domain of VALID_DOMAINS) {
        const spec = {
          ...validSpec,
          modules: [
            {
              ...validSpec.modules[0],
              domains: [domain],
            },
          ],
        };
        const result = validateBlueprintSpec(spec);
        expect(result.valid).toBe(true);
      }
    });

    it('enforces max modules limit', () => {
      const modules = Array.from({ length: 51 }, (_, i) => ({
        module_id: `MOD-${i}`,
        title: `Module ${i}`,
        domains: ['BACKEND'] as const,
        spec_items: [{ spec_id: `SPEC-${i}`, must: 'Test', acceptance: [] }],
      }));

      const spec = { ...validSpec, modules };
      const result = validateBlueprintSpec(spec, { maxModules: 50 });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Too many modules'))).toBe(true);
    });

    it('enforces max spec items limit', () => {
      const spec_items = Array.from({ length: 501 }, (_, i) => ({
        spec_id: `SPEC-${i}`,
        must: 'Test',
        acceptance: [],
      }));

      const spec = {
        ...validSpec,
        modules: [{ ...validSpec.modules[0], spec_items }],
      };
      const result = validateBlueprintSpec(spec, { maxSpecItems: 500 });

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Too many spec_items'))).toBe(true);
    });

    it('enforces max JSON size limit', () => {
      const largeDescription = 'x'.repeat(1024 * 1024 + 1); // > 1MB
      const spec = { ...validSpec, description: largeDescription };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum size'))).toBe(true);
    });

    it('validates interfaces structure', () => {
      const spec = {
        ...validSpec,
        modules: [
          {
            ...validSpec.modules[0],
            interfaces: [{ name: '', path: '/test' }],
          },
        ],
      };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('interfaces[0].name'))).toBe(true);
    });

    it('validates owned_paths_hint structure', () => {
      const spec = {
        ...validSpec,
        modules: [
          {
            ...validSpec.modules[0],
            owned_paths_hint: {
              BACKEND: 'not an array',
            },
          },
        ],
      };
      const result = validateBlueprintSpec(spec as unknown as BlueprintSpec);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('owned_paths_hint.BACKEND must be an array'))).toBe(
        true
      );
    });

    it('warns about unknown module dependencies', () => {
      const spec = {
        ...validSpec,
        modules: [
          {
            ...validSpec.modules[0],
            depends_on_modules: ['UNKNOWN_MODULE'],
          },
        ],
      };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(true); // Warning, not error
      expect(result.warnings.some(w => w.includes('unknown module_id'))).toBe(true);
    });

    it('collects all spec_ids', () => {
      const spec = {
        ...validSpec,
        modules: [
          {
            ...validSpec.modules[0],
            spec_items: [
              { spec_id: 'SPEC-001', must: 'Test 1', acceptance: [] },
              { spec_id: 'SPEC-002', must: 'Test 2', acceptance: [] },
            ],
          },
          {
            module_id: 'MOD-002',
            title: 'Module 2',
            domains: ['QA'] as const,
            spec_items: [{ spec_id: 'SPEC-003', must: 'Test 3', acceptance: [] }],
          },
        ],
      };
      const result = validateBlueprintSpec(spec);

      expect(result.valid).toBe(true);
      expect(result.specIds).toEqual(['SPEC-001', 'SPEC-002', 'SPEC-003']);
    });
  });

  describe('Constants', () => {
    it('has correct schema version', () => {
      expect(SCHEMA_VERSION).toBe('1.0');
    });

    it('has reasonable size caps', () => {
      expect(SIZE_CAPS.maxModules).toBe(50);
      expect(SIZE_CAPS.maxSpecItems).toBe(500);
      expect(SIZE_CAPS.maxJsonSizeBytes).toBe(1024 * 1024);
    });

    it('has all expected domains', () => {
      expect(VALID_DOMAINS).toContain('FRONTEND');
      expect(VALID_DOMAINS).toContain('BACKEND');
      expect(VALID_DOMAINS).toContain('DEVOPS');
      expect(VALID_DOMAINS).toContain('QA');
      expect(VALID_DOMAINS).toContain('ALGO');
      expect(VALID_DOMAINS).toContain('INTEGRATION');
      expect(VALID_DOMAINS).toHaveLength(6);
    });
  });
});
