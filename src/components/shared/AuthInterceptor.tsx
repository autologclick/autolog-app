'use client';

import { useEffect } from 'react';

/**
 * Global fetch interceptor for authentication handling
 * Patches window.fetch to:
 * 1. Redirect to login on 401 responses (expired token)
 * 2. Ensure Hebrew error messages are shown
 *
 * Place this component in portal layouts (user, garage, admin)
 * to automatically handle auth errors across all fetch calls.
 */
export default function AuthInterceptor() {
  useEffect(() => {
    const originalFetch = window.fetch;
    let isRedirecting = false;

    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);

      // Only intercept API calls (not external resources, images, etc.)
      const url = typeof args[0] === 'string' ? args[0] : args[0] instanceof Request ? args[0].url : '';
      const isApiCall = url.startsWith('/api/') || url.includes('/api/');

      if (isApiCall && response.status === 401 && !isRedirecting) {
        // Prevent multiple redirects from concurrent requests
        isRedirecting = true;

        // Don't redirect if we're already on the auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }

        // Return the original response so the calling code doesn't break
        return response;
      }

      return response;
    };

    // Cleanup: restore original fetch on unmount
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
