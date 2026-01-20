/**
 * AFC-ADAPTER-2: Adapter Registry Seed API
 * POST /api/adapters/seed - Seed default adapter records
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const DEFAULT_ADAPTERS = [
  {
    name: 'langgraph-host',
    version: '1.0.0',
    baseUrl: process.env.LANGGRAPH_HOST_URL || 'http://localhost:8123',
    capabilities: ['graph-execution', 'checkpoint-resume', 'streaming'],
    enabled: true,
  },
];

export async function POST() {
  try {
    const results = [];

    for (const adapterData of DEFAULT_ADAPTERS) {
      const adapter = await prisma.adapter.upsert({
        where: { name: adapterData.name },
        update: {
          version: adapterData.version,
          baseUrl: adapterData.baseUrl,
          capabilities: adapterData.capabilities,
          enabled: adapterData.enabled,
        },
        create: adapterData,
      });
      results.push(adapter);
    }

    return NextResponse.json({
      message: 'Adapters seeded successfully',
      adapters: results,
    });
  } catch (error) {
    console.error('Error seeding adapters:', error);
    return NextResponse.json({ error: 'Failed to seed adapters' }, { status: 500 });
  }
}
