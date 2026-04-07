'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Gradient variant — defaults to 'navy' */
  variant?: 'navy' | 'teal' | 'purple' | 'red' | 'amber' | 'green';
  /** Show back button — defaults to true */
  showBack?: boolean;
  /** Custom back URL — defaults to router.back() */
  backUrl?: string;
  /** Right-side actions */
  actions?: React.ReactNode;
}

const gradients: Record<string, string> = {
  navy: 'from-[#1e3a5f] to-[#2a5a8f]',
  teal: 'from-teal-600 to-teal-700',
  purple: 'from-purple-600 to-purple-700',
  red: 'from-red-500 to-red-600',
  amber: 'from-amber-500 to-amber-600',
  green: 'from-emerald-600 to-emerald-700',
};

export default function PageHeader({
  title,
  subtitle,
  variant = 'navy',
  showBack = true,
  backUrl,
  actions,
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className={`bg-gradient-to-l ${gradients[variant]} text-white px-4 pt-6 pb-8 rounded-b-3xl relative`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-white/20 transition-colors active:scale-95"
              aria-label="חזרה"
            >
              <ChevronRight size={18} />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-white/70 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}
