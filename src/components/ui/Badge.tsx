'use client';

import { cn } from '@/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
  pulse?: boolean;
}

export default function Badge({ children, variant = 'default', size = 'sm', className, icon, pulse }: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        'transition-colors duration-200',
        variants[variant],
        sizes[size],
        className
      )}
      role="status"
    >
      {pulse && (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className={cn(
            'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-gray-500'
          )} />
          <span className={cn(
            'relative inline-flex h-2 w-2 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'default' && 'bg-gray-500'
          )} />
        </span>
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

// Status icon SVGs as tiny inline components for zero-dependency usage
function CheckIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function DangerIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  );
}

// Document status badge helper with icons
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps['variant']; label: string; icon: React.ReactNode; pulse?: boolean }> = {
    valid: { variant: 'success', label: 'תקין', icon: <CheckIcon /> },
    expiring: { variant: 'warning', label: 'עומד לפוג', icon: <WarningIcon />, pulse: true },
    expired: { variant: 'danger', label: 'פג תוקף', icon: <DangerIcon /> },
    pending: { variant: 'info', label: 'ממתין', icon: <ClockIcon />, pulse: true },
    in_progress: { variant: 'warning', label: 'בביצוע', icon: <ClockIcon />, pulse: true },
    completed: { variant: 'success', label: 'הושלם', icon: <CheckIcon /> },
    cancelled: { variant: 'default', label: 'בוטל', icon: <DangerIcon /> },
    open: { variant: 'danger', label: 'פתוח', icon: <WarningIcon />, pulse: true },
    assigned: { variant: 'info', label: 'הוקצה', icon: <InfoIcon /> },
    resolved: { variant: 'success', label: 'טופל', icon: <CheckIcon /> },
    confirmed: { variant: 'success', label: 'מאושר', icon: <CheckIcon /> },
    awaiting_signature: { variant: 'warning', label: 'ממתין לחתימה', icon: <ClockIcon />, pulse: true },
  };

  const config = map[status] || { variant: 'default' as const, label: status, icon: null };
  return (
    <Badge variant={config.variant} icon={config.icon} pulse={config.pulse}>
      {config.label}
    </Badge>
  );
}
