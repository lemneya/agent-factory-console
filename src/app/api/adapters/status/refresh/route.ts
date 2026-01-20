/**
 * AFC-ADAPTER-3: Adapter Status Refresh API
 * POST /api/adapters/status/refresh - Probe all enabled adapters
 *
 * Returns summary: { ok, unreachable, skipped }
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { probeAdapterHealth } from '@/lib/adapter-health-probe';

export async function POST() {
  try {
    // Get all adapters
    const adapters = await prisma.adapter.findMany({
      orderBy: { name: 'asc' },
    });

    let ok = 0;
    let unreachable = 0;
    let skipped = 0;

    // Probe all adapters in parallel
    const probePromises = adapters.map(async adapter => {
      if (!adapter.enabled) {
        skipped++;
        return;
      }

      const result = await probeAdapterHealth({
        id: adapter.id,
        name: adapter.name,
        baseUrl: adapter.baseUrl,
        enabled: adapter.enabled,
      });

      // Update adapter in DB
      await prisma.adapter.update({
        where: { id: adapter.id },
        data: {
          healthStatus: result.status,
          lastHealthCheckAt: new Date(),
          lastSeenAt: result.status === 'OK' ? new Date() : adapter.lastSeenAt,
          lastHealthError: result.error,
        },
      });

      if (result.status === 'OK') {
        ok++;
      } else {
        unreachable++;
      }
    });

    await Promise.all(probePromises);

    return NextResponse.json({
      ok,
      unreachable,
      skipped,
      total: adapters.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error refreshing adapter status:', error);
    return NextResponse.json({ error: 'Failed to refresh adapter status' }, { status: 500 });
  }
}
