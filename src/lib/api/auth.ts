import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error: NextResponse | null;
}

/**
 * Get the authenticated user from the session.
 * Returns the user if authenticated, or an error response if not.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to access this resource' },
        { status: 401 }
      ),
    };
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      image: session.user.image,
    },
    error: null,
  };
}

/**
 * Require authentication for an API route.
 * Returns the authenticated user or throws an error response.
 * Use this in API routes that require authentication.
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const auth = await requireAuth();
 *   if (auth.error) return auth.error;
 *   const user = auth.user;
 *   // ... rest of handler
 * }
 */
export async function requireAuth(): Promise<AuthResult> {
  return getAuthenticatedUser();
}

/**
 * Check if the user owns the specified resource.
 * Returns an error response if the user doesn't own the resource.
 */
export function checkOwnership(
  resourceUserId: string,
  currentUserId: string
): NextResponse | null {
  if (resourceUserId !== currentUserId) {
    return NextResponse.json(
      { error: 'Forbidden', message: 'You do not have permission to access this resource' },
      { status: 403 }
    );
  }
  return null;
}
