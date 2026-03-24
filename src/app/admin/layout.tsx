'use client';

import Sidebar from '@/components/shared/Sidebar';
import NotificationBell from '@/components/shared/NotificationBell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar portal="admin" userName="מנהל מערכת" />
      <main className="flex-1 p-4 lg:p-8 bg-gray-50 overflow-y-auto pb-20 lg:pb-0">
        {/* Top bar with notification bell - hide on mobile since we have bottom nav */}
        <div className="hidden lg:flex justify-start items-center mb-6 -mx-4 -mt-4 px-4 py-4 bg-white border-b border-gray-200">
          <NotificationBell />
        </div>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
