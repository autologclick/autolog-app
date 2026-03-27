'use client';

import { cn } from '@/lib/cn';
import Button from '@/components/ui/Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function EmptyState({ icon, title, description, action, className, size = 'md' }: EmptyStateProps) {
  const sizes = {
    sm: { wrapper: 'py-6', icon: 'w-10 h-10', title: 'text-sm', desc: 'text-xs' },
    md: { wrapper: 'py-12', icon: 'w-16 h-16', title: 'text-lg', desc: 'text-sm' },
    lg: { wrapper: 'py-16', icon: 'w-20 h-20', title: 'text-xl', desc: 'text-base' },
  };

  const s = sizes[size];

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      s.wrapper,
      className
    )}>
      <div className={cn(
        'rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 mb-4',
        'transition-all duration-300',
        s.icon
      )}>
        {icon}
      </div>
      <h3 className={cn('font-bold text-[#1e3a5f] mb-1', s.title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-gray-500 max-w-sm mb-4', s.desc)}>
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          icon={action.icon}
          size={size === 'lg' ? 'lg' : 'md'}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
