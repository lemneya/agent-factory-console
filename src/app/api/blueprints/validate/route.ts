/**
 * AFC-1.7: Blueprint Validation API
 *
 * POST /api/blueprints/validate - Validate a blueprint spec JSON
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateBlueprintSpec } from '@/lib/blueprint';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { specJson } = body;

    if (!specJson) {
      return NextResponse.json(
        { error: { message: 'specJson is required', code: 'VALIDATION_ERROR' } },
        { status: 400 }
      );
    }

    const result = validateBlueprintSpec(specJson);

    return NextResponse.json({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      specIds: result.specIds,
      specHash: result.specHash,
    });
  } catch (error) {
    console.error('Error validating blueprint spec:', error);
    return NextResponse.json(
      { error: { message: 'Failed to validate blueprint spec', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
