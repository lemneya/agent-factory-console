import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

interface CommandResult {
  cmd: string;
  exitCode: number;
  stdoutPath?: string;
  stderrPath?: string;
  duration?: number;
}

interface VerifyResultPayload {
  iteration: number;
  commandResults: CommandResult[];
  passed: boolean;
  errorFingerprint?: string;
  diffStats?: { files: number; insertions: number; deletions: number };
  completionTokenFound?: boolean;
}

// POST /api/runs/[id]/verify-result - Record verification result for an iteration
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body: VerifyResultPayload = await request.json();

    const { iteration, commandResults, passed, errorFingerprint, completionTokenFound } = body;

    // Validate required fields
    if (iteration === undefined || !Array.isArray(commandResults) || passed === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: iteration, commandResults, passed' },
        { status: 400 }
      );
    }

    // Check run exists and is in Ralph mode
    const run = await prisma.run.findUnique({
      where: { id },
      include: {
        policy: true,
        iterations: { orderBy: { iterationNumber: 'desc' } },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (!run.ralphMode) {
      return NextResponse.json({ error: 'Run is not in Ralph Mode' }, { status: 409 });
    }

    // Build verification summary
    const verificationSummary = {
      commands: commandResults.map(r => ({
        cmd: r.cmd,
        passed: r.exitCode === 0,
        exitCode: r.exitCode,
        duration: r.duration,
      })),
      allPassed: passed,
      completionTokenFound: completionTokenFound || false,
    };

    // Calculate error fingerprint if not provided and there was a failure
    let fingerprint = errorFingerprint;
    if (!passed && !fingerprint) {
      const failedCmd = commandResults.find(r => r.exitCode !== 0);
      if (failedCmd) {
        fingerprint = crypto
          .createHash('md5')
          .update(`${failedCmd.cmd}:${failedCmd.exitCode}`)
          .digest('hex')
          .substring(0, 8);
      }
    }

    // Find the iteration to update
    const iterationToUpdate = await prisma.runIteration.findFirst({
      where: {
        runId: id,
        iterationNumber: iteration,
      },
    });

    if (!iterationToUpdate) {
      return NextResponse.json({ error: 'Iteration not found' }, { status: 404 });
    }

    // Update iteration record
    const updatedIteration = await prisma.runIteration.update({
      where: {
        id: iterationToUpdate.id,
      },
      data: {
        status: passed ? 'PASSED' : 'FAILED',
        inputJson: verificationSummary as any,
      },
    });

    // Check circuit breakers and determine next action
    const policy = run.policy;
    const iterations = run.iterations;

    let nextAction: 'continue' | 'wait_approval' | 'abort' | 'complete' = 'continue';
    let abortReason: string | null = null;

    if (passed && completionTokenFound) {
      // Success! Run is complete
      nextAction = 'complete';
    } else if (!passed && policy) {
      // Check circuit breakers
      const failedIterations = iterations.filter(i => i.status === 'FAILED');
      const totalFailures = failedIterations.length + 1; // +1 for current

      // Check repeated error (thrashing)
      // const maxRepeatedError = 3;
      const maxNoProgressIterations = 5;

      // Note: errorFingerprint is not in schema, using inputJson/outputJson if needed
      // For now, skipping repeated error check if field is missing

      // Check max failures
      const maxFailures = 10;
      if (totalFailures >= maxFailures) {
        nextAction = 'abort';
        abortReason = `Max failures reached: ${totalFailures}/${maxFailures}`;
      }

      // Check iteration budget
      if (iteration >= policy.maxIterations) {
        nextAction = 'abort';
        abortReason = `Max iterations reached: ${iteration}/${policy.maxIterations}`;
      }

      // Check no progress iterations
      const recentIterations = iterations.slice(0, maxNoProgressIterations);
      const allFailed = recentIterations.every(i => i.status === 'FAILED');
      if (allFailed && recentIterations.length >= maxNoProgressIterations) {
        nextAction = 'wait_approval';
        abortReason = `No progress in last ${maxNoProgressIterations} iterations`;
      }
    }

    // Handle next action
    if (nextAction === 'complete') {
      await prisma.run.update({
        where: { id },
        data: { status: 'COMPLETED', completedAt: new Date(), ralphMode: false },
      });
    } else if (nextAction === 'abort') {
      await prisma.runAbortReason.create({
        data: {
          runId: id,
          reason: abortReason || 'Max budget reached',
          code: iteration >= (policy?.maxIterations || 25) ? 'MAX_ITERATIONS' : 'SYSTEM_ERROR',
        },
      });
      await prisma.run.update({
        where: { id },
        data: { status: 'FAILED', completedAt: new Date(), ralphMode: false },
      });
    } else if (nextAction === 'wait_approval') {
      await prisma.runIteration.update({
        where: { id: updatedIteration.id },
        data: { status: 'WAITING_FOR_APPROVAL' },
      });
    } else if (nextAction === 'continue' && !passed) {
      // Create next iteration
      await prisma.runIteration.create({
        data: {
          runId: id,
          iterationNumber: iteration + 1,
          status: 'RUNNING',
        },
      });
    }

    return NextResponse.json({
      iteration: updatedIteration,
      nextAction,
      abortReason,
      runStatus:
        nextAction === 'complete' ? 'COMPLETED' : nextAction === 'abort' ? 'FAILED' : 'ACTIVE',
    });
  } catch (error) {
    console.error('Error recording verify result:', error);
    return NextResponse.json({ error: 'Failed to record verify result' }, { status: 500 });
  }
}
