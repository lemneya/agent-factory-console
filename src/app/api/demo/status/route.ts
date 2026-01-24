/**
 * GET /api/demo/status
 *
 * Returns demo mode status for client-side checks.
 * This allows the UI to know if it should bypass auth.
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const isDemoMode = process.env.DEMO_MODE === '1';

  return NextResponse.json({
    demoMode: isDemoMode,
  });
}
