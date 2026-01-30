/**
 * AFC-C2-STREAM-0: Deterministic 30-second Swarm Simulation
 *
 * - 20 agents in 5x4 grid
 * - State updates every 500ms
 * - Progress updates every 2s
 * - Artifacts generated at ~10s, 20s, 28s
 * - Stop/abort supported
 */

import { C2EventType, C2AgentState, C2ArtifactType } from '@prisma/client';
import { publishToSession, createC2Event } from './c2-pubsub';
import prisma from './prisma';

// Active simulations map: sessionId -> AbortController
const activeSimulations = new Map<string, AbortController>();

// Simulation configuration
const SIM_DURATION_MS = 30000; // 30 seconds
const STATE_UPDATE_INTERVAL_MS = 500;
const PROGRESS_UPDATE_INTERVAL_MS = 2000;
const AGENT_COUNT = 20;

// Artifact generation times (ms from start)
const ARTIFACT_TIMES = [10000, 20000, 28000];

// Deterministic agent state progression
const STATE_SEQUENCE: C2AgentState[] = [
  'IDLE',
  'THINKING',
  'WORKING',
  'WORKING',
  'WORKING',
  'DONE',
];

/**
 * Get the expected agent state based on elapsed time and agent index
 */
function getAgentState(elapsedMs: number, agentIndex: number): C2AgentState {
  // Stagger agent progression based on index
  const agentDelay = agentIndex * 500; // 500ms stagger per agent
  const adjustedElapsed = Math.max(0, elapsedMs - agentDelay);

  // Each state lasts ~5 seconds (30s / 6 states)
  const stateIndex = Math.min(
    Math.floor(adjustedElapsed / 5000),
    STATE_SEQUENCE.length - 1
  );

  return STATE_SEQUENCE[stateIndex];
}

/**
 * Start a deterministic swarm simulation
 */
export async function startSimulation(sessionId: string): Promise<void> {
  // Check if already running
  if (activeSimulations.has(sessionId)) {
    throw new Error('Simulation already running for this session');
  }

  // Create abort controller for this simulation
  const abortController = new AbortController();
  activeSimulations.set(sessionId, abortController);

  const startTime = Date.now();
  let lastProgressUpdate = 0;
  let artifactIndex = 0;

  // Update session status to RUNNING
  await prisma.c2Session.update({
    where: { id: sessionId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  // Emit session start event
  publishToSession(
    sessionId,
    createC2Event(sessionId, 'SESSION_START', { startTime: new Date().toISOString() })
  );

  // Log start
  await emitLog(sessionId, 'INFO', 'Swarm simulation started');

  // Main simulation loop
  const runLoop = async () => {
    while (!abortController.signal.aborted) {
      const elapsed = Date.now() - startTime;

      // Check if simulation should end
      if (elapsed >= SIM_DURATION_MS) {
        await completeSimulation(sessionId);
        return;
      }

      // Update agent states
      for (let i = 0; i < AGENT_COUNT; i++) {
        const state = getAgentState(elapsed, i);
        publishToSession(
          sessionId,
          createC2Event(
            sessionId,
            'AGENT_STATE',
            { agentIndex: i, state },
            { agentIndex: i, agentState: state }
          )
        );
      }

      // Emit progress update every 2s
      if (elapsed - lastProgressUpdate >= PROGRESS_UPDATE_INTERVAL_MS) {
        const progress = Math.min(100, (elapsed / SIM_DURATION_MS) * 100);
        publishToSession(
          sessionId,
          createC2Event(
            sessionId,
            'PROGRESS',
            { progress },
            { progress }
          )
        );

        // Persist progress event
        await prisma.c2Event.create({
          data: {
            sessionId,
            type: 'PROGRESS',
            payload: { progress },
            progress,
          },
        });

        lastProgressUpdate = elapsed;
      }

      // Generate artifacts at specified times
      while (
        artifactIndex < ARTIFACT_TIMES.length &&
        elapsed >= ARTIFACT_TIMES[artifactIndex]
      ) {
        await generateArtifact(sessionId, artifactIndex);
        artifactIndex++;
      }

      // Wait for next state update
      await sleep(STATE_UPDATE_INTERVAL_MS);
    }

    // If we exit the loop due to abort, handle it
    if (abortController.signal.aborted) {
      await abortSimulation(sessionId);
    }
  };

  // Run the simulation loop (non-blocking)
  runLoop().catch(async (error) => {
    console.error('[C2 Simulation] Error:', error);
    await emitLog(sessionId, 'ERROR', `Simulation error: ${error.message}`);
    activeSimulations.delete(sessionId);
  });
}

/**
 * Stop a running simulation gracefully
 */
export async function stopSimulation(sessionId: string): Promise<void> {
  const controller = activeSimulations.get(sessionId);
  if (!controller) {
    throw new Error('No active simulation for this session');
  }

  controller.abort();
}

/**
 * Check if a simulation is running
 */
export function isSimulationRunning(sessionId: string): boolean {
  return activeSimulations.has(sessionId);
}

/**
 * Complete the simulation successfully
 */
async function completeSimulation(sessionId: string): Promise<void> {
  activeSimulations.delete(sessionId);

  // Update all agents to DONE state
  for (let i = 0; i < AGENT_COUNT; i++) {
    publishToSession(
      sessionId,
      createC2Event(
        sessionId,
        'AGENT_STATE',
        { agentIndex: i, state: 'DONE' },
        { agentIndex: i, agentState: 'DONE' }
      )
    );
  }

  // Emit 100% progress
  publishToSession(
    sessionId,
    createC2Event(sessionId, 'PROGRESS', { progress: 100 }, { progress: 100 })
  );

  // Emit session stop event
  publishToSession(
    sessionId,
    createC2Event(sessionId, 'SESSION_STOP', { reason: 'completed' })
  );

  await emitLog(sessionId, 'INFO', 'Swarm simulation completed successfully');

  // Update session status
  await prisma.c2Session.update({
    where: { id: sessionId },
    data: { status: 'COMPLETED', stoppedAt: new Date() },
  });
}

/**
 * Abort the simulation
 */
async function abortSimulation(sessionId: string): Promise<void> {
  activeSimulations.delete(sessionId);

  // Emit session abort event
  publishToSession(
    sessionId,
    createC2Event(sessionId, 'SESSION_ABORT', { reason: 'user_requested' })
  );

  await emitLog(sessionId, 'WARN', 'Swarm simulation aborted by user');

  // Update session status
  await prisma.c2Session.update({
    where: { id: sessionId },
    data: { status: 'ABORTED', stoppedAt: new Date() },
  });
}

/**
 * Generate an artifact at the specified index
 */
async function generateArtifact(sessionId: string, index: number): Promise<void> {
  const artifacts = [
    {
      name: 'analysis_report.md',
      type: 'DOCUMENT' as C2ArtifactType,
      content: { title: 'Analysis Report', sections: ['Overview', 'Findings', 'Recommendations'] },
    },
    {
      name: 'generated_code.ts',
      type: 'CODE' as C2ArtifactType,
      content: { language: 'typescript', lines: 150 },
    },
    {
      name: 'final_summary.json',
      type: 'REPORT' as C2ArtifactType,
      content: { status: 'success', metrics: { agents: 20, duration: '28s' } },
    },
  ];

  const artifact = artifacts[index];
  if (!artifact) return;

  // Create artifact in database
  const created = await prisma.c2Artifact.create({
    data: {
      sessionId,
      name: artifact.name,
      type: artifact.type,
      contentJson: artifact.content,
    },
  });

  // Emit artifact created event
  publishToSession(
    sessionId,
    createC2Event(
      sessionId,
      'ARTIFACT_CREATED',
      {
        artifactId: created.id,
        name: artifact.name,
        type: artifact.type,
      },
      {
        artifactId: created.id,
        artifactName: artifact.name,
        artifactType: artifact.type,
      }
    )
  );

  await emitLog(sessionId, 'INFO', `Artifact created: ${artifact.name}`);
}

/**
 * Emit a log event
 */
async function emitLog(sessionId: string, level: string, message: string): Promise<void> {
  publishToSession(
    sessionId,
    createC2Event(
      sessionId,
      'LOG',
      { level, message },
      { level, message }
    )
  );

  // Persist log event
  await prisma.c2Event.create({
    data: {
      sessionId,
      type: 'LOG',
      payload: { level, message },
      level,
      message,
    },
  });
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
