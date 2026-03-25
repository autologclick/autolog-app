'use client';

import { useState, useCallback, useRef } from 'react';

import {
  API_ERRORS,
  AUTH_ERRORS,
  VALIDATION_ERRORS,
  RATE_LIMIT_ERRORS,
  CRUD_ERRORS,
} from '@/lib/messages';

// ==========================================
// Types
// ==========================================
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  statusCode: number | null;
}

interface RequestOptions extends RequestInit {
  /** Timeout in ms (default: 15000) */
  timeout?: number;
  /** Number of retries on network failure (default: 0) */
  retries?: number;
  /** Delay between retries in ms (default: 1000) */
  retryDelay?: number;
  /** Don't set Content-Type (for FormData uploads) */
  skipContentType?: boolean;
}

// ==========================================
// Helper: Map HTTP status to Hebrew message
// ==========================================
function getErrorMessage(status: number, serverMessage?: string): string {
  // Use server message if it's a meaningful Hebrew string
  if (serverMessage && serverMessage.length > 2) {
    return serverMessage;
  }

  switch (status) {
    case 400: return VALIDATION_ERRORS.DATA_VALIDATION;
    case 401: return AUTH_ERRORS.UNAUTHORIZED;
    case 403: return AUTH_ERRORS.FORBIDDEN;
    case 404: return CRUD_ERRORS.NOT_FOUND;
    case 429: return RATE_LIMIT_ERRORS.TOO_MANY_REQUESTS;
    default:
      if (status >= 500) return API_ERRORS.SERVER;
      return API_ERRORS.GENERIC;
  }
}

// ==========================================
// Helper: Fetch with timeout
// ==========================================
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ==========================================
// Helper: Retry with delay
// ==========================================
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// Main Hook
// ==========================================
export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    statusCode: null,
  });

  // Track active request to prevent stale updates
  const activeRequestRef = useRef(0);

  const request = useCallback(async (
    url: string,
    options?: RequestOptions
  ): Promise<T | null> => {
    const requestId = ++activeRequestRef.current;
    const {
      timeout = 15000,
      retries = 0,
      retryDelay = 1000,
      skipContentType = false,
      ...fetchOptions
    } = options || {};

    // Build headers
    const headers: Record<string, string> = {};
    if (!skipContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (fetchOptions.headers) {
      Object.assign(headers, fetchOptions.headers);
    }

    setState(prev => ({ ...prev, loading: true, error: null, statusCode: null }));

    let lastError: string = API_ERRORS.CONNECTION;
    let attempts = 0;
    const maxAttempts = retries + 1;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const res = await fetchWithTimeout(url, {
          ...fetchOptions,
          headers,
        }, timeout);

        // Stale request check
        if (requestId !== activeRequestRef.current) return null;

        let json: Record<string, unknown>;
        try {
          json = await res.json();
        } catch {
          // Response not valid JSON
          if (requestId === activeRequestRef.current) {
            setState({ data: null, loading: false, error: API_ERRORS.PARSE, statusCode: res.status });
          }
          return null;
        }

        if (!res.ok) {
          const errorMsg = getErrorMessage(
            res.status,
            typeof json.error === 'string' ? json.error : undefined
          );

          // Don't retry client errors (4xx), only server errors (5xx)
          if (res.status < 500 || attempts >= maxAttempts) {
            if (requestId === activeRequestRef.current) {
              setState({ data: null, loading: false, error: errorMsg, statusCode: res.status });
            }

            // Auto-redirect on 401
            if (res.status === 401 && typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              if (!currentPath.startsWith('/auth/')) {
                window.location.href = '/auth/login';
              }
            }

            return null;
          }

          // 5xx error, retry if we have attempts left
          lastError = errorMsg;
          if (attempts < maxAttempts) {
            await delay(retryDelay * attempts); // Exponential backoff
            continue;
          }
        }

        // Success
        if (requestId === activeRequestRef.current) {
          setState({ data: json as T, loading: false, error: null, statusCode: res.status });
        }
        return json as T;

      } catch (err: unknown) {
        // Stale request check
        if (requestId !== activeRequestRef.current) return null;

        // Determine error type
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = API_ERRORS.TIMEOUT;
        } else if (err instanceof TypeError && (
          err.message.includes('Failed to fetch') ||
          err.message.includes('NetworkError') ||
          err.message.includes('Load failed')
        )) {
          lastError = API_ERRORS.CONNECTION;
        } else {
          lastError = API_ERRORS.GENERIC;
        }

        // Retry on network errors if attempts remain
        if (attempts < maxAttempts) {
          await delay(retryDelay * attempts);
          continue;
        }
      }
    }

    // All retries exhausted
    if (requestId === activeRequestRef.current) {
      setState({ data: null, loading: false, error: lastError, statusCode: null });
    }
    return null;
  }, []);

  // Convenience methods
  const get = useCallback(
    (url: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request(url, opts),
    [request]
  );

  const post = useCallback(
    (url: string, body: Record<string, unknown>, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request(url, { method: 'POST', body: JSON.stringify(body), ...opts }),
    [request]
  );

  const put = useCallback(
    (url: string, body: Record<string, unknown>, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request(url, { method: 'PUT', body: JSON.stringify(body), ...opts }),
    [request]
  );

  const patch = useCallback(
    (url: string, body: Record<string, unknown>, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request(url, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
    [request]
  );

  const del = useCallback(
    (url: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request(url, { method: 'DELETE', ...opts }),
    [request]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null, statusCode: null });
  }, []);

  return { ...state, get, post, put, patch, del, request, reset };
}

// ==========================================
// Auth Store (Zustand)
// ==========================================
import { create } from 'zustand';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue with logout even if API call fails
    }
    set({ user: null });
    window.location.href = '/auth/login';
  },
}));
