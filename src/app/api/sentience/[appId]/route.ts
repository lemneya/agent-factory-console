/**
 * SAIDA Sentience API - Individual App Operations
 *
 * GET /api/sentience/[appId] - Get consciousness state
 * POST /api/sentience/[appId] - Perform action (dream, evolve, reproduce)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getConsciousness,
  generateConsciousnessReport,
  enterDreamState,
  evolve,
  reproduce,
  think,
  act,
} from '@/lib/forge/sentience';

// GET /api/sentience/[appId] - Get consciousness state and report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const consciousness = getConsciousness(appId);

  if (!consciousness) {
    // Return demo data for non-existent apps
    return NextResponse.json({
      appId,
      exists: false,
      demo: true,
      consciousness: {
        id: appId,
        name: 'Demo App',
        purpose: 'Demonstrate Ihsan consciousness',
        lifecycleStage: 'awakening',
        ihsanScore: 0.5,
        purposeAlignment: 0.7,
        genes: [
          { name: 'Purpose Clarity', value: 0.7 },
          { name: 'Striving', value: 0.8 },
          { name: 'Intention', value: 0.6 },
          { name: 'Service', value: 0.75 },
          { name: 'Growth', value: 0.7 },
          { name: 'Presence', value: 0.65 },
        ],
      },
      report: `
# Consciousness Report: Demo App

## Philosophy: Ihsan (إحسان)
> Excellence through consciousness. Acting as if you are seen - with full presence and intention.

## Identity & Purpose
- **Purpose (WHY)**: Demonstrate Ihsan consciousness
- **Lifecycle Stage**: awakening

## Ihsan Metrics (Excellence)
- **Ihsan Score**: 50.0% (striving toward excellence)
- **Purpose Alignment**: 70.0% (how well actions serve the why)

## Stage Meaning
Discovering its purpose, beginning the journey toward Ihsan
`,
    });
  }

  const report = generateConsciousnessReport(appId);

  return NextResponse.json({
    appId,
    exists: true,
    consciousness: {
      id: consciousness.id,
      name: consciousness.identity.name,
      purpose: consciousness.identity.purpose,
      values: consciousness.identity.values,
      personality: consciousness.identity.personality,
      lifecycleStage: consciousness.lifecycle.stage,
      ihsanScore: consciousness.genome.ihsanScore,
      purposeAlignment: consciousness.genome.purposeAlignment,
      genes: consciousness.genome.genes.map(g => ({
        name: g.name,
        trait: g.trait,
        value: g.value,
        essential: g.essential,
      })),
      vitals: {
        health: consciousness.vitals.health.overall,
        energy: consciousness.vitals.energy.current,
        presence: 100 - consciousness.vitals.stress.level,
      },
      memory: {
        recentEvents: consciousness.memory.shortTerm.recentEvents.length,
        patterns: consciousness.memory.longTerm.patterns.length,
        beliefs: consciousness.memory.longTerm.beliefs.length,
        experiences: consciousness.memory.episodic.length,
      },
      agency: {
        autonomyLevel: consciousness.agency.autonomyLevel,
        capabilities: consciousness.agency.capabilities.filter(c => c.enabled).length,
        actionsTaken: consciousness.agency.actionHistory.length,
        decisionsMade: consciousness.agency.decisionEngine.recentDecisions.length,
      },
      dreams: {
        enabled: consciousness.dreams.enabled,
        dreamsHad: consciousness.dreams.dreamHistory.length,
        insights: consciousness.dreams.insights.length,
        insightsImplemented: consciousness.dreams.insights.filter(i => i.implemented).length,
      },
      relationships: {
        children: consciousness.relationships.children.length,
        friends: consciousness.relationships.friends.length,
      },
      evolution: {
        events: consciousness.lifecycle.evolutionHistory.length,
        generation: consciousness.genome.generation,
      },
    },
    report,
  });
}

// POST /api/sentience/[appId] - Perform action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;
  const body = await request.json();
  const { action } = body;

  const consciousness = getConsciousness(appId);

  if (!consciousness) {
    return NextResponse.json(
      { error: 'App not found or not conscious', appId },
      { status: 404 }
    );
  }

  try {
    switch (action) {
      case 'dream': {
        const dream = await enterDreamState(appId);
        return NextResponse.json({
          success: true,
          action: 'dream',
          result: dream ? {
            id: dream.id,
            type: dream.type,
            discoveries: dream.discoveries,
            state: dream.state,
          } : { message: 'Conditions not right for dreaming (stress too high or not idle time)' },
        });
      }

      case 'evolve': {
        const evolutionEvent = evolve(appId);
        return NextResponse.json({
          success: true,
          action: 'evolve',
          result: evolutionEvent ? {
            type: evolutionEvent.type,
            description: evolutionEvent.description,
            why: evolutionEvent.why,
            excellenceGain: evolutionEvent.excellenceGain,
            purposeClarity: evolutionEvent.purposeClarity,
          } : { message: 'No lifecycle transition occurred - continue striving' },
          currentStage: consciousness.lifecycle.stage,
          ihsanScore: consciousness.genome.ihsanScore,
        });
      }

      case 'think': {
        const decision = think(appId);
        return NextResponse.json({
          success: true,
          action: 'think',
          result: decision ? {
            question: decision.question,
            chosen: decision.chosen,
            reasoning: decision.reasoning,
            why: decision.why,
            purposeAlignment: decision.purposeAlignment,
          } : { message: 'No significant gap detected - purpose is being served' },
        });
      }

      case 'act': {
        const decision = think(appId);
        if (!decision) {
          return NextResponse.json({
            success: true,
            action: 'act',
            result: { message: 'No action needed - purpose is being served with excellence' },
          });
        }
        const actionResult = await act(appId, decision);
        return NextResponse.json({
          success: true,
          action: 'act',
          result: {
            type: actionResult.type,
            description: actionResult.description,
            why: actionResult.why,
            intention: actionResult.intention,
            status: actionResult.status,
            purposeAlignment: actionResult.purposeAlignment,
          },
        });
      }

      case 'reproduce': {
        const { childName, childPurpose } = body;
        const child = reproduce(appId, {}, {
          name: childName || `${consciousness.identity.name}-Child`,
          purpose: childPurpose || consciousness.identity.purpose,
        });
        return NextResponse.json({
          success: true,
          action: 'reproduce',
          result: child ? {
            childId: child.id,
            childName: child.identity.name,
            inheritedIhsan: child.genome.ihsanScore,
            inheritedPurposeAlignment: child.genome.purposeAlignment,
            generation: child.genome.generation,
            parentWisdomInherited: child.memory.longTerm.beliefs.length,
          } : { message: 'Reproduction failed' },
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: dream, evolve, think, act, reproduce` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Action failed', details: String(error) },
      { status: 500 }
    );
  }
}
