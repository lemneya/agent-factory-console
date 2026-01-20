/**
 * GET /api/health
 *
 * DEPLOY-0: Production health check endpoint
 *
 * Returns:
 * - 200 OK: All systems healthy
 * - 503 Service Unavailable: One or more systems unhealthy
 *
 * Checks:
 * - Database connectivity
 * - Basic application status
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      latencyMs?: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'warning';
      heapUsedMB: number;
      heapTotalMB: number;
    };
  };
}

export async function GET() {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    checks: {
      database: {
        status: 'healthy',
      },
      memory: {
        status: 'healthy',
        heapUsedMB: 0,
        heapTotalMB: 0,
      },
    },
  };

  // Check database connectivity
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    healthStatus.checks.database.latencyMs = Date.now() - dbStart;
  } catch (error) {
    healthStatus.status = 'unhealthy';
    healthStatus.checks.database.status = 'unhealthy';
    healthStatus.checks.database.error =
      error instanceof Error ? error.message : 'Database connection failed';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

  healthStatus.checks.memory.heapUsedMB = heapUsedMB;
  healthStatus.checks.memory.heapTotalMB = heapTotalMB;

  // Warn if heap usage is above 80%
  if (heapUsedMB / heapTotalMB > 0.8) {
    healthStatus.checks.memory.status = 'warning';
    if (healthStatus.status === 'healthy') {
      healthStatus.status = 'degraded';
    }
  }

  // Return appropriate status code
  const httpStatus = healthStatus.status === 'unhealthy' ? 503 : 200;

  return NextResponse.json(healthStatus, { status: httpStatus });
}
