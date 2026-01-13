import { NextRequest, NextResponse } from 'next/server';

interface RouteHealthRequest {
  path: string;
  baseUrl?: string; // Optional custom base URL (for preset support)
}

interface RouteHealthResponse {
  path: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  redirected?: boolean;
  redirectUrl?: string;
  error?: string;
}

/**
 * POST /api/preview/route-health
 * Checks the health of a route by fetching it from the preview URL
 * Does NOT forward cookies/auth - this is health check only
 *
 * Supports:
 * - Custom baseUrl for preset support
 * - Redirect detection (returns redirected: true if 3xx)
 * - 5s timeout
 */
export async function POST(request: NextRequest): Promise<NextResponse<RouteHealthResponse>> {
  try {
    const body = (await request.json()) as RouteHealthRequest;
    const { path, baseUrl } = body;

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

    // Use custom baseUrl if provided, otherwise fall back to env
    const previewUrl = baseUrl || process.env.NEXT_PUBLIC_PREVIEW_URL;
    if (!previewUrl) {
      return NextResponse.json(
        {
          path,
          status: 503,
          ok: false,
          latencyMs: 0,
          error: 'No preview URL configured',
        },
        { status: 503 }
      );
    }

    // Build full URL
    const fullUrl = `${previewUrl.replace(/\/$/, '')}${path}`;

    // Fetch with timeout and redirect: 'manual' to detect redirects
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const startTime = Date.now();
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        signal: controller.signal,
        // Do NOT forward cookies/auth - this is health check only
        credentials: 'omit',
        // Use 'manual' to detect redirects without following them
        redirect: 'manual',
        headers: {
          'User-Agent': 'AFC-Route-Health-Check/1.0',
        },
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      // Check if this is a redirect (3xx status)
      const isRedirect = response.status >= 300 && response.status < 400;
      const redirectUrl = isRedirect ? response.headers.get('location') || undefined : undefined;

      // For redirects, we consider it "ok" but flag it
      // 301/302/307/308 are common auth redirects
      const isAuthRedirect =
        isRedirect &&
        redirectUrl &&
        (redirectUrl.includes('/login') ||
          redirectUrl.includes('/signin') ||
          redirectUrl.includes('/auth') ||
          redirectUrl.includes('/api/auth'));

      return NextResponse.json({
        path,
        status: response.status,
        ok: response.ok || (isRedirect && !isAuthRedirect),
        latencyMs,
        redirected: isRedirect,
        redirectUrl: redirectUrl,
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
