'use client';

import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T = any>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const request = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options?.headers },
        ...options,
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ data: null, loading: false, error: typeof json.error === 'string' ? json.error : 'שגיאה בביצוע הפעולה' });
        return null;
      }
      setState({ data: json, loading: false, error: null });
      return json;
    } catch (err) {
      setState({ data: null, loading: false, error: 'שגיאת חיבור' });
      return null;
    }
  }, []);

  const get = useCallback((url: string) => request(url), [request]);

  const post = useCallback((url: string, body: any) =>
    request(url, { method: 'POST', body: JSON.stringify(body) }), [request]);

  const put = useCallback((url: string, body: any) =>
    request(url, { method: 'PUT', body: JSON.stringify(body) }), [request]);

  const del = useCallback((url: string) =>
    request(url, { method: 'DELETE' }), [request]);

  return { ...state, get, post, put, del, request };
}

// Auth store
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
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null });
    window.location.href = '/auth/login';
  },
}));
