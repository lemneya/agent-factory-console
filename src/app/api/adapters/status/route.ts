/**
 * AFC-ADAPTER-3: Adapter Status API
 * GET /api/adapters/status - List adapters with health status
 *
 * Query params:
 * - refresh=1: Force health probes before returning
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { probeAdapterHealth } from '@/lib/adapter-health-probe';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shouldRefresh = searchParams.get('refresh') === '1';

    // Get all adapters
    const adapters = await prisma.adapter.findMany({
      orderBy: { name: 'asc' },
    });

    // If refresh requested, probe all enabled adapters
    if (shouldRefresh) {
      const probePromises = adapters.map(async adapter => {
        if (!adapter.enabled) {
          return adapter; // Skip disabled
        }

        const result = await probeAdapterHealth({
          id: adapter.id,
          name: adapter.name,
          baseUrl: adapter.baseUrl,
          enabled: adapter.enabled,
        });

        // Update adapter in DB
        const updatedAdapter = await prisma.adapter.update({
          where: { id: adapter.id },
          data: {
            healthStatus: result.status,
            lastHealthCheckAt: new Date(),
            lastSeenAt: result.status === 'OK' ? new Date() : adapter.lastSeenAt,
            lastHealthError: result.error,
          },
        });

        return updatedAdapter;
      });

      const updatedAdapters = await Promise.all(probePromises);

      return NextResponse.json(
        updatedAdapters.map(a => ({
          id: a.id,
          name: a.name,
          baseUrl: a.baseUrl,
          enabled: a.enabled,
          healthStatus: a.healthStatus,
          lastSeenAt: a.lastSeenAt,
          lastHealthCheckAt: a.lastHealthCheckAt,
          lastHealthError: a.lastHealthError,
        }))
      );
    }

    // Return cached values
    return NextResponse.json(
      adapters.map(a => ({
        id: a.id,
        name: a.name,
        baseUrl: a.baseUrl,
        enabled: a.enabled,
        healthStatus: a.healthStatus,
        lastSeenAt: a.lastSeenAt,
        lastHealthCheckAt: a.lastHealthCheckAt,
        lastHealthError: a.lastHealthError,
      }))
    );
  } catch (error) {
    console.error('Error fetching adapter status:', error);
    return NextResponse.json({ error: 'Failed to fetch adapter status' }, { status: 500 });
  }
}
