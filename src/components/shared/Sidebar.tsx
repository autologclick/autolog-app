'use client';

import { cn } from '@/lib/cn';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Car, FileCheck, MapPin, Calendar, Star, Bell, AlertTriangle, Settings,
  LogOut, BarChart3, Users, Wrench, ClipboardCheck, FilePlus, Menu, X,
  ChevronRight, Shield, FolderOpen, Receipt, Clock, FileText, CreditCard
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LogoIcon } from '@/components/ui/Logo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

const userNav: NavItem[] = [
  { label: 'דף הבית', href: '/user', icon: <Home size={20} /> },
  { label: 'הרכבים שלי', href: '/user/vehicles', icon: <Car size={20} /> },
  { label: 'דוחות בדיקה', href: '/user/reports', icon: <FileCheck size={20} /> },
  { label: 'מסמכים', href: '/user/documents', icon: <FolderOpen size={20} /> },
  { label: 'הוצאות', href: '/user/expenses', icon: <Receipt size={20} /> },
  { label: 'תשלומים', href: '/user/payments', icon: <CreditCard size={20} /> },
  { label: 'היסטוריה', href: '/user/history', icon: <Clock size={20} /> },
  { label: 'הזמנת מוסך', href: '/user/book-garage', icon: <MapPin size={20} /> },
  { label: 'תורים שלי', href: '/user/appointments', icon: <Calendar size={20} /> },
  { label: 'הטבות מועדון', href: '/user/benefits', icon: <Star size={20} /> },
  { label: 'התראות', href: '/user/notifications', icon: <Bell size={20} /> },
  { label: 'SOS חירום', href: '/user/sos', icon: <AlertTriangle size={20} /> },
  { label: 'הגדרות', href: '/user/settings', icon: <Settings size={20} /> },
];

// Mobile bottom nav items (5 most important)
const userMobileNav: NavItem[] = [
  { label: 'דף הבית', href: '/user', icon: <Home size={20} /> },
  { label: 'רכבים', href: '/user/vehicles', icon: <Car size={20} /> },
  { label: 'תורים', href: '/user/appointments', icon: <Calendar size={20} /> },
  { label: 'התראות', href: '/user/notifications', icon: <Bell size={20} /> },
  { label: 'SOS', href: '/user/sos', icon: <AlertTriangle size={20} /> },
];

const adminNav: NavItem[] = [
  { label: 'דשבורד', href: '/admin', icon: <BarChart3 size={20} /> },
  { label: 'ניהול משתמשים', href: '/admin/users', icon: <Users size={20} /> },
  { label: 'ניהול מוסכים', href: '/admin/garages', icon: <Wrench size={20} /> },
  { label: 'בדיקות', href: '/admin/inspections', icon: <ClipboardCheck size={20} /> },
  { label: 'חיוב מוסכים', href: '/admin/billing', icon: <Receipt size={20} /> },
  { label: 'מסמכים', href: '/admin/documents', icon: <FolderOpen size={20} /> },
  { label: 'הוצאות', href: '/admin/expenses', icon: <Receipt size={20} /> },
  { label: 'אירועי SOS', href: '/admin/sos', icon: <AlertTriangle size={20} /> },
  { label: 'בקשות מוסכים', href: '/admin/applications', icon: <FileText size={20} /> },
  { label: 'התראות', href: '/admin/alerts', icon: <Bell size={20} /> },
  { label: 'הגדרות', href: '/admin/settings', icon: <Settings size={20} /> },
];

// Mobile bottom nav items for admin
const adminMobileNav: NavItem[] = [
  { label: 'דשבורד', href: '/admin', icon: <BarChart3 size={20} /> },
  { label: 'משתמשים', href: '/admin/users', icon: <Users size={20} /> },
  { label: 'מוסכים', href: '/admin/garages', icon: <Wrench size={20} /> },
  { label: 'SOS', href: '/admin/sos', icon: <AlertTriangle size={20} /> },
  { label: 'הגדרות', href: '/admin/settings', icon: <Settings size={20} /> },
];

const garageNav: NavItem[] = [
  { label: 'דשבורד', href: '/garage', icon: <Home size={20} /> },
  { label: 'בדיקות', href: '/garage/inspections', icon: <ClipboardCheck size={20} /> },
  { label: 'בדיקה חדשה', href: '/garage/new-inspection', icon: <FilePlus size={20} /> },
  { label: 'טיפולים', href: '/garage/treatments', icon: <Wrench size={20} /> },
  { label: 'תורים', href: '/garage/appointments', icon: <Calendar size={20} /> },
  { label: 'לקוחות', href: '/garage/customers', icon: <Users size={20} /> },
  { label: 'ביקורות', href: '/garage/reviews', icon: <Star size={20} /> },
  { label: 'הגדרות', href: '/garage/settings', icon: <Settings size={20} /> },
];

// Mobile bottom nav items for garage
const garageMobileNav: NavItem[] = [
  { label: 'דשבורד', href: '/garage', icon: <Home size={20} /> },
  { label: 'בדיקות', href: '/garage/inspections', icon: <ClipboardCheck size={20} /> },
  { label: '+ חדשה', href: '/garage/new-inspection', icon: <FilePlus size={20} /> },
  { label: 'תורים', href: '/garage/appointments', icon: <Calendar size={20} /> },
  { label: 'ביקורות', href: '/garage/reviews', icon: <Star size={20} /> },
];

interface SidebarProps {
  portal: 'user' | 'admin' | 'garage';
  userName?: string;
}

export default function Sidebar({ portal, userName = 'משתמש' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent sidebar from stealing wheel scroll events.
  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleWheel = (e: WheelEvent) => {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      e.preventDefault();
      e.stopPropagation();
      mainEl.scrollTop += e.deltaY;
    };

    sidebar.addEventListener('wheel', handleWheel, { passive: false, capture: true });
    return () => sidebar.removeEventListener('wheel', handleWheel, { capture: true });
  }, []);

  // Auto-scroll sidebar nav to show active item
  useEffect(() => {
    requestAnimationFrame(() => {
      const activeButton = document.querySelector('aside [data-active="true"]');
      if (activeButton) {
        activeButton.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileOpen]);

  const navItems = portal === 'admin' ? adminNav : portal === 'garage' ? garageNav : userNav;
  const mobileNavItems = portal === 'admin' ? adminMobileNav : portal === 'garage' ? garageMobileNav : userMobileNav;
tInitials(userName)}
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 min-h-0 p-3 pb-2 space-y-0.5 overflow-y-auto" role="navigation" aria-label="תפריט ראשי">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <div key={item.href} className="relative group">
              <button
                data-active={active ? 'true' : undefined}
                onClick={() => handleNavClick(item.href)}
                onMouseEnter={() => setHoveredItem(item.href)}
                onMouseLeave={() => setHoveredItem(null)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
                  'min-h-[44px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                  active
                    ? 'text-white bg-white/15 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/5',
                  collapsed && 'justify-center px-2'
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className={cn(
                    'absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full transition-all duration-300',
                    portal === 'user' && 'bg-teal-400',
                    portal === 'admin' && 'bg-purple-400',
                    portal === 'garage' && 'bg-emerald-400'
                  )} />
                )}
                <span className={cn(
                  'flex-shrink-0 transition-all duration-200',
                  active && 'scale-110',
                  !active && 'group-hover:text-white/90'
                )}>
                  {item.icon}
                </span>
                {!collapsed && <span className="flex-1 text-right">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ms-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>

              {/* Tooltip when collapsed */}
              {collapsed && (
                <div className={cn(
                  'absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg',
                  'pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200',
                  'whitespace-nowrap shadow-lg',
                  'translate-x-1 group-hover:translate-x-0'
                )}>
                  {item.label}
                  <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Portal Switcher & Logout */}
      <div className="p-3 border-t border-white/10 space-y-1 backdrop-blur-sm">
        {portal !== 'user' && (
          <button
            onClick={() => router.push('/user')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Home size={16} className="flex-shrink-0" />
            {!collapsed && 'אפליקציית משתמש'}
          </button>
        )}
        {portal !== 'admin' && (
          <button
            onClick={() => router.push('/admin')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <BarChart3 size={16} className="flex-shrink-0" />
            {!collapsed && 'מרכז בקרה'}
          </button>
        )}
        {portal !== 'garage' && (
          <button
            onClick={() => router.push('/garage')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <Wrench size={16} className="flex-shrink-0" />
            {!collapsed && 'פורטל מוסך'}
          </button>
        )}
        <button
          onClick={async () => {
            try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
            router.push('/auth/login');
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all duration-200 min-h-[40px] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && 'התנתקות'}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button - top right for RTL Hebrew */}
      <button
        className={cn(
          'lg:hidden fixed top-4 right-4 z-50 p-2.5 rounded-xl shadow-lg transition-all duration-200',
          'min-w-[44px] min-h-[44px] flex items-center justify-center',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2',
          mobileOpen
            ? 'bg-white/90 text-gray-900 rotate-90'
            : 'bg-white text-[#1e3a5f] hover:shadow-xl hover:scale-105 active:scale-95'
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'סגור תפריט' : 'פתח תפריט'}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Desktop Sidebar - RIGHT side for RTL Hebrew */}
      <aside ref={sidebarRef} className={cn(
        colors.bg,
        'hidden lg:flex flex-col h-screen fixed top-0 right-0 z-40 transition-all duration-300 shadow-2xl',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <NavContent />

        {/* Collapse Toggle - on LEFT edge of sidebar */}
        <button
          className={cn(
            'absolute top-1/2 -left-3 bg-white shadow-lg rounded-full p-1.5',
            'hover:shadow-xl transition-all duration-200 hover:scale-110 active:scale-95',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400',
            'min-w-[28px] min-h-[28px] flex items-center justify-center'
          )}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
        >
          <ChevronRight className={cn('h-4 w-4 text-[#1e3a5f] transition-transform duration-300', !collapsed && 'rotate-180')} />
        </button>
      </aside>

      {/* Mobile Drawer - slides from RIGHT for RTL Hebrew */}
      <div
        id="mobile-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניווט"
        className={cn(
          colors.bg,
          'flex lg:hidden flex-col h-screen fixed top-0 right-0 z-40 w-64 transition-all duration-300 ease-out shadow-2xl',
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <NavContent />
      </div>

      {/* Desktop Spacer - on RIGHT side matching sidebar */}
      <div className={cn('hidden lg:block transition-all duration-300', collapsed ? 'w-16' : 'w-64')} />

      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200',
          'transition-all duration-300 safe-area-inset-bottom'
        )}
        role="navigation"
        aria-label="ניווט מהיר"
      >
        <div className="flex justify-around items-center pb-safe pt-1.5 pb-1.5 px-1">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all duration-200',
                  'min-w-[56px] min-h-[48px]',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-1',
                  active
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 active:scale-95'
                )}
                aria-label={item.label}
              >
                <div className={cn(
                  'flex-shrink-0 transition-all duration-200 mb-0.5',
                  active && 'text-teal-600 scale-110'
                )}>
                  {item.icon}
                </div>
                <span className={cn(
                  'text-[10px] text-center font-medium leading-tight',
                  active && 'font-bold'
                )}>
                  {item.label}
                </span>
                {/* Active indicator dot */}
                {active && (
                  <span className="w-1 h-1 rounded-full bg-teal-500 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
