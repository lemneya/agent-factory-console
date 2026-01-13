'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SignedOutCTAProps {
  title?: string;
  reason?: string;
  returnUrl?: string;
}

export function SignedOutCTA({
  title = 'Sign in required',
  reason = 'Sign in with GitHub to access this page.',
  returnUrl,
}: SignedOutCTAProps) {
  const router = useRouter();
  const showDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

  const handleViewDemoData = () => {
    // Set demo mode cookie
    document.cookie = 'afc_demo=1; path=/; max-age=86400';
    // Navigate to current page with demo param
    const currentPath = window.location.pathname;
    router.push(`${currentPath}?demo=1`);
    router.refresh();
  };

  const handleDevBypass = () => {
    // Set demo mode cookie for dev bypass
    document.cookie = 'afc_demo=1; path=/; max-age=86400';
    router.push('/runs?demo=1');
    router.refresh();
  };

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800"
      data-testid="signed-out-cta"
    >
      <div className="mx-auto max-w-md text-center">
        {/* Lock Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
          <svg
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>

        {/* Reason */}
        <p className="mt-2 text-gray-600 dark:text-gray-400">{reason}</p>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-3">
          {/* Primary: Sign in with GitHub */}
          <button
            onClick={() => signIn('github', { callbackUrl: returnUrl || window.location.href })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
            data-testid="sign-in-github-btn"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Sign in with GitHub
          </button>

          {/* Secondary: View Demo Data */}
          <button
            onClick={handleViewDemoData}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            data-testid="view-demo-data-btn"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            View Demo Data (read-only)
          </button>

          {/* Link: Quick Setup */}
          <Link
            href="/docs/setup"
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            data-testid="quick-setup-link"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
            Quick Setup Instructions
          </Link>

          {/* DEV-only: Continue as Gatekeeper */}
          {showDevBypass && (
            <button
              onClick={handleDevBypass}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30"
              data-testid="dev-bypass-btn"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                />
              </svg>
              Continue as Gatekeeper (demo)
              <span className="ml-1 rounded bg-yellow-200 px-1.5 py-0.5 text-xs text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200">
                DEV
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
