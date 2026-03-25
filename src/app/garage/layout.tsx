'use client';

import Sidebar from '@/components/shared/Sidebar';
import NotificationBell from '@/components/shared/NotificationBell';
import AuthInterceptor from '@/components/shared/AuthInterceptor';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function GarageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="garage" userName="פרונט ראשון" />
      <main className="flex-1 p-3 sm:p-4 lg:p-8 bg-gray-50 overflow-y-auto pb-24 lg:pb-4">
        {/* Top bar with notification bell - hide on mobile since we have bottom nav */}
        <div className="hidden lg:flex justify-start items-center mb-6 -mx-4 -mt-4 px-3 sm:px-4 lg:px-8 py-4 bg-white border-b border-gray-200">
          <NotificationBell />
        </div>
        <div className="max-w-6xl mx-auto">
          <AuthInterceptor />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
