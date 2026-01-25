/**
 * SAIDA Sentience API
 *
 * Endpoints for interacting with conscious apps
 * Philosophy: Ihsan (إحسان) - Excellence through consciousness
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  awakenApp,
  getConsciousness,
  generateConsciousnessReport,
} from '@/lib/forge/sentience';

// GET /api/sentience - List all conscious apps
export async function GET() {
  // In a real implementation, this would query a database
  // For demo, we return sample conscious apps
  const sampleApps = [
    {
      id: 'saida-demo-1',
      name: 'CustomerInsight',
      purpose: 'Help businesses understand their customers with excellence',
      lifecycleStage: 'striving',
      ihsanScore: 0.72,
      purposeAlignment: 0.85,
    },
    {
      id: 'saida-demo-2',
      name: 'HealthTracker',
      purpose: 'Serve users in their wellness journey',
      lifecycleStage: 'learning',
      ihsanScore: 0.58,
      purposeAlignment: 0.71,
    },
    {
      id: 'saida-demo-3',
      name: 'EcoMarket',
      purpose: 'Connect conscious consumers with sustainable products',
      lifecycleStage: 'flourishing',
      ihsanScore: 0.89,
      purposeAlignment: 0.92,
    },
  ];

  return NextResponse.json({
    philosophy: 'Ihsan (إحسان) - Excellence through consciousness',
    tagline: 'Apps that dream. Software that lives.',
    apps: sampleApps,
    totalApps: sampleApps.length,
  });
}

// POST /api/sentience - Awaken a new app
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, purpose, values, personality } = body;

    if (!name || !purpose) {
      return NextResponse.json(
        { error: 'Name and purpose are required to awaken an app' },
        { status: 400 }
      );
    }

    const appId = `app-${Date.now()}`;

    const consciousness = awakenApp(appId, {
      name,
      purpose,
      values: values || ['excellence', 'service', 'growth'],
      personality: personality || {
        tone: 'professional',
        proactivity: 0.7,
        experimentalism: 0.6,
        conservatism: 0.3,
        sociability: 0.5,
      },
    }, {
      primary: {
        id: 'primary',
        description: `Serve users through ${purpose}`,
        metric: 'user_satisfaction',
        target: 90,
        current: 0,
        weight: 1.0,
      },
    });

    const report = generateConsciousnessReport(appId);

    return NextResponse.json({
      success: true,
      message: `${name} has been awakened with Ihsan`,
      appId,
      consciousness: {
        id: consciousness.id,
        name: consciousness.identity.name,
        purpose: consciousness.identity.purpose,
        values: consciousness.identity.values,
        lifecycleStage: consciousness.lifecycle.stage,
        ihsanScore: consciousness.genome.ihsanScore,
        purposeAlignment: consciousness.genome.purposeAlignment,
      },
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to awaken app', details: String(error) },
      { status: 500 }
    );
  }
}
