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
    valid: { variant: 'success', label: 'תקין' },
    expiring: { variant: 'warning', label: 'עומד לפוג' },
    expired: { variant: 'danger', label: 'פג תוקף' },
    pending: { variant: 'info', label: 'ממתין' },
    in_progress: { variant: 'warning', label: 'בביצוע' },
    completed: { variant: 'success', label: 'הושלם' },
    cancelled: { variant: 'default', label: 'בוטל' },
    open: { variant: 'danger', label: 'פתוח' },
    assigned: { variant: 'info', label: 'הוקצה' },
    resolved: { variant: 'success', label: 'טופל' },
    confirmed: { variant: 'success', label: 'מאושר' },
    awaiting_signature: { variant: 'warning', label: 'ממתין לחתימה' },
  };

  const config = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
