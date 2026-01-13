import { NextRequest, NextResponse } from 'next/server';

interface RouteHealthRequest {
  path: string;
}

interface RouteHealthResponse {
  path: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

/**
 * POST /api/preview/route-health
 * Checks the health of a route by fetching it from the preview URL
 * Does NOT forward cookies/auth - this is health check only
 */
export async function POST(request: NextRequest): Promise<NextResponse<RouteHealthResponse>> {
  try {
    const body = (await request.json()) as RouteHealthRequest;
    const { path } = body;

    // Validate path starts with /
    if (!path || !path.startsWith('/')) {
      return NextResponse.json(
        {
          path: path || '',
          status: 400,
          ok: false,
          latencyMs: 0,
          error: 'Path must start with /',
        },
        { status: 400 }
      );
    }

    // Get preview URL from environment
    const previewUrl = process.env.NEXT_PUBLIC_PREVIEW_URL;
    if (!previewUrl) {
      return NextResponse.json(
        {
          path,
          status: 503,
          ok: false,
          latencyMs: 0,
          error: 'NEXT_PUBLIC_PREVIEW_URL not configured',
        },
        { status: 503 }
      );
    }

    // Build full URL
    const fullUrl = `${previewUrl.replace(/\/$/, '')}${path}`;

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const startTime = Date.now();
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        signal: controller.signal,
        // Do NOT forward cookies/auth - this is health check only
        credentials: 'omit',
        headers: {
          'User-Agent': 'AFC-Route-Health-Check/1.0',
        },
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      return NextResponse.json({
        path,
        status: response.status,
        ok: response.ok,
        latencyMs,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json({
          path,
          status: 408,
          ok: false,
          latencyMs,
          error: 'Request timeout (5s)',
        });
      }

      return NextResponse.json({
        path,
        status: 0,
        ok: false,
        latencyMs,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        path: '',
        status: 500,
        ok: false,
        latencyMs: 0,
        error: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 500 }
    );
  }
}
