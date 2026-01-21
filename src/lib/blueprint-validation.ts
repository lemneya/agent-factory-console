/**
 * AFC-BLUEPRINT-UI-RULE-0: Blueprint Validation
 * 
 * Enforces that blueprints include UI workstream or explicit opt-out
 */

export interface BlueprintPayload {
  workstreams?: {
    ui?: Array<{
      key: string;
      title: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  ui_opt_out?: boolean;
  ui_opt_out_reason?: string;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that a blueprint includes either:
 * - Option A: workstreams.ui exists and contains ≥ 1 UI workorder
 * - Option B: ui_opt_out=true AND ui_opt_out_reason is non-empty
 * 
 * @param payload - The blueprint payload JSON
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateBlueprintUIRequirement(
  payload: BlueprintPayload
): ValidationResult {
  // Check Option A: UI workstream present
  const hasUIWorkstream = 
    payload.workstreams?.ui && 
    Array.isArray(payload.workstreams.ui) &&
    payload.workstreams.ui.length > 0;

  if (hasUIWorkstream) {
    return { valid: true };
  }

  // Check Option B: explicit opt-out with reason
  const hasOptOut = payload.ui_opt_out === true;
  const hasOptOutReason = 
    typeof payload.ui_opt_out_reason === 'string' &&
    payload.ui_opt_out_reason.trim().length > 0;

  if (hasOptOut && hasOptOutReason) {
    return { valid: true };
  }

  // Neither condition met - validation fails
  if (hasOptOut && !hasOptOutReason) {
    return {
      valid: false,
      error: 'Blueprint has ui_opt_out=true but ui_opt_out_reason is empty. Please provide a reason for opting out of UI workstream.',
    };
  }

  return {
    valid: false,
    error: 'Blueprint must include workstreams.ui or set ui_opt_out=true with reason.',
  };
}

/**
 * Type guard to check if a value is a valid BlueprintPayload
 */
export function isBlueprintPayload(value: unknown): value is BlueprintPayload {
  return typeof value === 'object' && value !== null;
}
