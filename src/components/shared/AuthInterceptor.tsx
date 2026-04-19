'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * AuthInterceptor — keeps the user session alive.
 *
 * 1. Proactive refresh: silently refreshes the access token every 90 minutes
 *    (well before the 2-hour expiry) so the user never notices.
 * 2. Visibility refresh: when the user returns to the tab after being away,
 *    immediately refreshes the token.
 * 3. 401 retry: on a 401 response, tries ONE silent refresh before redirecting
 *    to login. This covers the edge case where the token expires mid-request.
 *
 * Place this component in portal layouts (user, garage, admin).
 */
export default function AuthInterceptor() {
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);
  const lastRefresh = useRef(Date.now());

  // Silent token refresh — returns true if successful
  const silentRefresh = useCallback(async (): Promise<boolean> => {
    // Deduplicate concurrent refresh attempts
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }

    isRefreshing.current = true;
    refreshPromise.current = (async () => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST' });
        if (res.ok) {
          lastRefresh.current = Date.now();
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        isRefreshing.current = false;
        refreshPromise.current = null;
      }
    })();

    return refreshPromise.current;
  }, []);

  useEffect(() => {
    // Don't run on auth pages
    if (window.location.pathname.startsWith('/auth')) return;

    // ── 1. Proactive periodic refresh (every 90 minutes) ──
    const REFRESH_INTERVAL = 90 * 60 * 1000; // 90 minutes
    const interval = setInterval(() => {
      silentRefresh();
    }, REFRESH_INTERVAL);

    // ── 2. Refresh when user returns to tab ──
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      // Only refresh if more than 5 minutes since last refresh
      const elapsed = Date.now() - lastRefresh.current;
      if (elapsed > 5 * 60 * 1000) {
        silentRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ── 3. Fetch interceptor: retry on 401 ──
    const originalFetch = window.fetch;
    let isRedirecting = false;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);

      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      const isApiCall = url.startsWith('/api/') || url.includes('/api/');
      // Don't intercept the refresh call itself
      const isRefreshCall = url.includes('/api/auth/refresh');

      if (isApiCall && !isRefreshCall && response.status === 401 && !isRedirecting) {
        // Try a silent refresh first
        const refreshed = await silentRefresh();

        if (refreshed) {
          // Retry the original request with the new token
          return originalFetch(...args);
        }

        // Refresh failed — redirect to login
        isRedirecting = true;
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }

      return response;
    };

    // ── 4. Initial refresh on mount (covers returning after long idle) ──
    silentRefresh();

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.fetch = originalFetch;
    };
  }, [silentRefresh]);

  return null;
}
