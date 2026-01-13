'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo, useCallback, useState } from 'react';

/**
 * Hook to check if demo mode is active.
 * Demo mode is ON when:
 * - query param ?demo=1 OR
 * - cookie afc_demo=1
 */
export function useDemoMode(): {
  isDemoMode: boolean;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
} {
  const searchParams = useSearchParams();
  // Track cookie state changes with a simple counter to trigger re-renders
  const [cookieVersion, setCookieVersion] = useState(0);

  const isDemoMode = useMemo(() => {
    // Check query param first
    const demoParam = searchParams.get('demo');
    if (demoParam === '1') {
      return true;
    }

    // Check cookie (client-side only)
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const demoCookie = cookies.find((c) => c.trim().startsWith('afc_demo='));
      if (demoCookie && demoCookie.split('=')[1] === '1') {
        return true;
      }
    }

    return false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, cookieVersion]);

  const enableDemoMode = useCallback(() => {
    document.cookie = 'afc_demo=1; path=/; max-age=86400';
    setCookieVersion((v) => v + 1);
  }, []);

  const disableDemoMode = useCallback(() => {
    document.cookie = 'afc_demo=; path=/; max-age=0';
    setCookieVersion((v) => v + 1);
  }, []);

  return { isDemoMode, enableDemoMode, disableDemoMode };
}
