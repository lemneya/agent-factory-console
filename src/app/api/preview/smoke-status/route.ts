import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface TestStatus {
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  passedCount: number;
  totalCount: number;
}

interface SmokeStatus {
  status: 'PASS' | 'FAIL' | 'UNKNOWN';
  message: string;
  updatedAt: string | null;
  tests: {
    'nav-smoke': TestStatus;
    'auth-cta': TestStatus;
    'happy-path': TestStatus;
  };
}

const DEFAULT_STATUS: SmokeStatus = {
  status: 'UNKNOWN',
  message: 'No smoke status file found yet.',
  updatedAt: null,
  tests: {
    'nav-smoke': { status: 'UNKNOWN', passedCount: 0, totalCount: 0 },
    'auth-cta': { status: 'UNKNOWN', passedCount: 0, totalCount: 0 },
    'happy-path': { status: 'UNKNOWN', passedCount: 0, totalCount: 0 },
  },
};

/**
 * GET /api/preview/smoke-status
 * Returns the latest smoke test status from evidence/preview/SMOKE_STATUS.json
 */
export async function GET(): Promise<NextResponse<SmokeStatus>> {
  try {
    // Try to read the smoke status file from the evidence folder
    const filePath = join(process.cwd(), 'evidence', 'preview', 'SMOKE_STATUS.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const status = JSON.parse(fileContent) as SmokeStatus;
    return NextResponse.json(status);
  } catch {
    // File doesn't exist or is invalid - return default status
    return NextResponse.json(DEFAULT_STATUS);
  }
}
