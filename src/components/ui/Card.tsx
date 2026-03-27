'use client';

import { cn } from '@/lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-5',
        'transition-all duration-200 ease-out',
        hover && 'hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer hover:shadow-md hover:border-teal-200 hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex items-center justify-between mb-4', className)}>{children}</div>;
}

export function CardTitle({ children, icon, className }: { children: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-bold text-[#1e3a5f] flex items-center gap-2', className)}>
      {icon}
      {children}
    </h3>
  );
}

export function StatCard({ label, value, icon, color = 'teal', trend }: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'teal' | 'navy' | 'red' | 'orange' | 'green' | 'purple';
  trend?: { value: number; label: string };
}) {
  const colors = {
    teal: 'bg-teal-50 text-teal-600 border-teal-200',
    navy: 'bg-[#fef7ed] text-[#1e3a5f] border-[#1e3a5f]/20',
    red: 'bg-red-50 text-red-600 border-red-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  };

  return (
    <div className={cn(
      'rounded-xl border p-3 sm:p-4',
      'transition-all duration-200 ease-out',
      'hover:shadow-sm hover:-translate-y-0.5',
      colors[color]
    )}>
      <div className="flex items-center justify-between mb-1 sm:mb-2">
        <span className="text-xs sm:text-sm font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <div className="text-xl sm:text-2xl font-bold">{value}</div>
      {trend && (
        <div className="text-xs mt-1 opacity-70">
          {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
  );
}
