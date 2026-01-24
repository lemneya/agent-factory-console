/**
 * POST /api/forge/build
 * Start a new multi-agent build from a spec
 */

import { NextRequest, NextResponse } from 'next/server';
import { decomposeSpec, calculateParallelization, validateDecomposition } from '@/lib/forge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spec, techStack, dryRun = true } = body;

    if (!spec || typeof spec !== 'string') {
      return NextResponse.json(
        { error: 'spec is required and must be a string' },
        { status: 400 }
      );
    }

    // Decompose the spec
    const decomposed = await decomposeSpec(spec, techStack);

    // Validate
    const errors = validateDecomposition(decomposed);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid decomposition', details: errors },
        { status: 400 }
      );
    }

    // Calculate parallelization stats
    const stats = calculateParallelization(decomposed);

    if (dryRun) {
      // Return plan without executing
      return NextResponse.json({
        dryRun: true,
        decomposition: decomposed,
        parallelization: stats,
        message: `Ready to execute ${decomposed.workstreams.length} workstreams in ${decomposed.executionWaves.length} waves`,
      });
    }

    // TODO: For actual execution, we would:
    // 1. Create a build record in the database
    // 2. Start the orchestrator in the background
    // 3. Return a build ID for status polling

    return NextResponse.json({
      message: 'Full execution not yet implemented. Use dryRun=true to preview.',
      decomposition: decomposed,
      parallelization: stats,
    });
  } catch (error) {
    console.error('Build error:', error);
    return NextResponse.json(
      { error: 'Failed to process build request', details: String(error) },
      { status: 500 }
    );
  }
}
