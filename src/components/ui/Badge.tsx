'use client';

import { cn } from '@/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full border font-medium', variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
}

// Document status badge helper
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string }> = {
    valid: { variant: 'success', label: '×ª×§××' },
    expiring: { variant: 'warning', label: '×¢××× ××¤××' },
    expired: { variant: 'danger', label: '×¤× ×ª××§×£' },
    pending: { variant: 'info', label: '×××ª××' },
    in_progress: { variant: 'warning', label: '××××¦××¢' },
    completed: { variant: 'success', label: '×××©××' },
    cancelled: { variant: 'default', label: '××××' },
    open: { variant: 'danger', label: '×¤×ª××' },
    assigned: { variant: 'info', label: '×××§×¦×' },
    resolved: { variant: 'success', label: '×××¤×' },
    confirmed: { variant: 'success', label: '××××©×¨' },
  };

  const config = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
