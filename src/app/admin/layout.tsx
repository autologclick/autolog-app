'use client';

import Sidebar from '@/components/shared/Sidebar';
import NotificationBell from '@/components/shared/NotificationBell';
import AuthInterceptor from '@/components/shared/AuthInterceptor';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [userName, setUserName] = useState('מנהל מערכת');
  const [userRole, setUserRole] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => {
        if (r.status === 401) {
          window.location.href = '/auth/login';
          return null;
        }
        return r.json();
      })
      .then(data => {
        if (data?.user?.fullName) setUserName(data.user.fullName);
        if (data?.user?.role) {
          setUserRole(data.user.role);
          // Client-side guard (middleware is the real enforcement)
          if (data.user.role !== 'admin') {
            window.location.href = '/user';
          }
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="admin" userName={userName} userRole={userRole} />
      <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-y-auto pb-20 lg:pb-0">
        {/* Top bar with notification bell - hide on mobile since we have bottom nav */}
        <div className="hidden lg:flex justify-start items-center mb-6 -mx-4 -mt-4 px-4 py-4 bg-white border-b border-gray-200">
          <NotificationBell />
        </div>
        <div className="max-w-7xl mx-auto">
          <AuthInterceptor />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
