/**
 * AFC-1.7: Blueprint JSON Schema Validation
 *
 * Validates BlueprintVersion.specJson against the v1.0 schema.
 * Enforces:
 * - Unique spec_id across all modules
 * - Size caps (max modules, max spec_items, max JSON size)
 * - Required fields and structure
 */

import { createHash } from 'crypto';

// Schema version
export const SCHEMA_VERSION = '1.0';

// Size caps (configurable)
export const SIZE_CAPS = {
  maxModules: 50,
  maxSpecItems: 500,
  maxJsonSizeBytes: 1024 * 1024, // 1MB
};

// Valid domains
export const VALID_DOMAINS = [
  'FRONTEND',
  'BACKEND',
  'DEVOPS',
  'QA',
  'ALGO',
  'INTEGRATION',
] as const;

export type BlueprintDomain = (typeof VALID_DOMAINS)[number];

// Blueprint spec interfaces
export interface SpecItem {
  spec_id: string;
  must: string;
  acceptance: string[];
  domain?: BlueprintDomain; // Optional domain tag for spec item
}

export interface InterfaceDefinition {
  name: string;
  path: string;
  description?: string;
}

export interface OwnedPathsHint {
  FRONTEND?: string[];
  BACKEND?: string[];
  DEVOPS?: string[];
  QA?: string[];
  ALGO?: string[];
  INTEGRATION?: string[];
}

export interface BlueprintModule {
  module_id: string;
  title: string;
  domains: BlueprintDomain[];
  spec_items: SpecItem[];
  interfaces?: InterfaceDefinition[];
  owned_paths_hint?: OwnedPathsHint;
  assets_hint?: string[];
  depends_on_modules?: string[];
}

export interface BlueprintSpec {
  blueprint_id: string;
  title: string;
  description?: string;
  modules: BlueprintModule[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  specIds: string[];
  specHash?: string;
}

/**
 * Canonicalize JSON for deterministic hashing
 * Sorts keys alphabetically at all levels
 */
export function canonicalizeJson(obj: unknown): string {
  return JSON.stringify(obj, (_, value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .sort()
        .reduce(
          (sorted, key) => {
            sorted[key] = value[key];
            return sorted;
          },
          {} as Record<string, unknown>
        );
    }
    return value;
  });
}

/**
 * Compute SHA-256 hash of canonical JSON
 */
export function computeSpecHash(spec: BlueprintSpec): string {
  const canonical = canonicalizeJson(spec);
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Validate a Blueprint spec JSON
 */
export function validateBlueprintSpec(
  specJson: unknown,
  options?: { maxModules?: number; maxSpecItems?: number; maxJsonSizeBytes?: number }
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const specIds: string[] = [];
  const seenSpecIds = new Set<string>();
  const seenModuleIds = new Set<string>();

  const maxModules = options?.maxModules ?? SIZE_CAPS.maxModules;
  const maxSpecItems = options?.maxSpecItems ?? SIZE_CAPS.maxSpecItems;
  const maxJsonSizeBytes = options?.maxJsonSizeBytes ?? SIZE_CAPS.maxJsonSizeBytes;

  // Check JSON size
  const jsonString = JSON.stringify(specJson);
  if (jsonString.length > maxJsonSizeBytes) {
    errors.push(
      `Blueprint JSON exceeds maximum size of ${maxJsonSizeBytes} bytes (got ${jsonString.length})`
    );
    return { valid: false, errors, warnings, specIds };
  }

  // Type guard check
  if (!specJson || typeof specJson !== 'object') {
    errors.push('Blueprint spec must be a non-null object');
    return { valid: false, errors, warnings, specIds };
  }

  const spec = specJson as Record<string, unknown>;

  // Required top-level fields
  if (typeof spec.blueprint_id !== 'string' || !spec.blueprint_id.trim()) {
    errors.push('blueprint_id is required and must be a non-empty string');
  }

  if (typeof spec.title !== 'string' || !spec.title.trim()) {
    errors.push('title is required and must be a non-empty string');
  }

  if (!Array.isArray(spec.modules)) {
    errors.push('modules is required and must be an array');
    return { valid: false, errors, warnings, specIds };
  }

  // Check module count
  if (spec.modules.length > maxModules) {
    errors.push(`Too many modules: ${spec.modules.length} (max: ${maxModules})`);
  }

  let totalSpecItems = 0;

  // Validate each module
  for (let i = 0; i < spec.modules.length; i++) {
    const mod = spec.modules[i] as Record<string, unknown>;
    const modulePrefix = `modules[${i}]`;

    // Module ID
    if (typeof mod.module_id !== 'string' || !mod.module_id.trim()) {
      errors.push(`${modulePrefix}.module_id is required and must be a non-empty string`);
    } else {
      if (seenModuleIds.has(mod.module_id)) {
        errors.push(`Duplicate module_id: ${mod.module_id}`);
      }
      seenModuleIds.add(mod.module_id);
    }

    // Module title
    if (typeof mod.title !== 'string' || !mod.title.trim()) {
      errors.push(`${modulePrefix}.title is required and must be a non-empty string`);
    }

    // Domains
    if (!Array.isArray(mod.domains) || mod.domains.length === 0) {
      errors.push(`${modulePrefix}.domains is required and must be a non-empty array`);
    } else {
      for (const domain of mod.domains) {
        if (!VALID_DOMAINS.includes(domain as BlueprintDomain)) {
          errors.push(`${modulePrefix}.domains contains invalid domain: ${domain}`);
        }
      }
    }

    // Spec items
    if (!Array.isArray(mod.spec_items)) {
      errors.push(`${modulePrefix}.spec_items is required and must be an array`);
    } else {
      totalSpecItems += mod.spec_items.length;

      for (let j = 0; j < mod.spec_items.length; j++) {
        const item = mod.spec_items[j] as Record<string, unknown>;
        const itemPrefix = `${modulePrefix}.spec_items[${j}]`;

        // Spec ID
        if (typeof item.spec_id !== 'string' || !item.spec_id.trim()) {
          errors.push(`${itemPrefix}.spec_id is required and must be a non-empty string`);
        } else {
          if (seenSpecIds.has(item.spec_id)) {
            errors.push(`Duplicate spec_id: ${item.spec_id}`);
          } else {
            seenSpecIds.add(item.spec_id);
            specIds.push(item.spec_id);
          }
        }

        // Must
        if (typeof item.must !== 'string' || !item.must.trim()) {
          errors.push(`${itemPrefix}.must is required and must be a non-empty string`);
        }

        // Acceptance
        if (!Array.isArray(item.acceptance)) {
          errors.push(`${itemPrefix}.acceptance is required and must be an array`);
        } else {
          for (let k = 0; k < item.acceptance.length; k++) {
            if (typeof item.acceptance[k] !== 'string') {
              errors.push(`${itemPrefix}.acceptance[${k}] must be a string`);
            }
          }
        }

        // Optional domain tag
        if (item.domain !== undefined && !VALID_DOMAINS.includes(item.domain as BlueprintDomain)) {
          errors.push(`${itemPrefix}.domain contains invalid domain: ${item.domain}`);
        }
      }
    }

    // Validate interfaces (optional)
    if (mod.interfaces !== undefined) {
      if (!Array.isArray(mod.interfaces)) {
        errors.push(`${modulePrefix}.interfaces must be an array if provided`);
      } else {
        for (let j = 0; j < mod.interfaces.length; j++) {
          const iface = mod.interfaces[j] as Record<string, unknown>;
          const ifacePrefix = `${modulePrefix}.interfaces[${j}]`;

          if (typeof iface.name !== 'string' || !iface.name.trim()) {
            errors.push(`${ifacePrefix}.name is required and must be a non-empty string`);
          }
          if (typeof iface.path !== 'string' || !iface.path.trim()) {
            errors.push(`${ifacePrefix}.path is required and must be a non-empty string`);
          }
        }
      }
    }

    // Validate owned_paths_hint (optional)
    if (mod.owned_paths_hint !== undefined) {
      if (typeof mod.owned_paths_hint !== 'object' || mod.owned_paths_hint === null) {
        errors.push(`${modulePrefix}.owned_paths_hint must be an object if provided`);
      } else {
        const hint = mod.owned_paths_hint as Record<string, unknown>;
        for (const domain of Object.keys(hint)) {
          if (!VALID_DOMAINS.includes(domain as BlueprintDomain)) {
            warnings.push(`${modulePrefix}.owned_paths_hint has unknown domain: ${domain}`);
          }
          if (!Array.isArray(hint[domain])) {
            errors.push(`${modulePrefix}.owned_paths_hint.${domain} must be an array`);
          }
        }
      }
    }

    // Validate assets_hint (optional)
    if (mod.assets_hint !== undefined) {
      if (!Array.isArray(mod.assets_hint)) {
        errors.push(`${modulePrefix}.assets_hint must be an array if provided`);
      }
    }

    // Validate depends_on_modules (optional)
    if (mod.depends_on_modules !== undefined) {
      if (!Array.isArray(mod.depends_on_modules)) {
        errors.push(`${modulePrefix}.depends_on_modules must be an array if provided`);
      }
    }
  }

  // Check total spec items
  if (totalSpecItems > maxSpecItems) {
    errors.push(`Too many spec_items: ${totalSpecItems} (max: ${maxSpecItems})`);
  }

  // Validate depends_on_modules references (second pass)
  for (let i = 0; i < spec.modules.length; i++) {
    const mod2 = spec.modules[i] as Record<string, unknown>;
    if (Array.isArray(mod2.depends_on_modules)) {
      for (const depId of mod2.depends_on_modules) {
        if (!seenModuleIds.has(depId as string)) {
          warnings.push(
            `modules[${i}].depends_on_modules references unknown module_id: ${depId}`
          );
        }
      }
    }
  }

  const valid = errors.length === 0;
  const result: ValidationResult = { valid, errors, warnings, specIds };

  if (valid) {
    result.specHash = computeSpecHash(spec as unknown as BlueprintSpec);
  }

  return result;
}
