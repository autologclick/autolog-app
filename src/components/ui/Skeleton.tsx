'use client';

import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
  count = 1,
}: SkeletonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-lg';
      case 'card':
        return 'rounded-xl';
      default:
        return 'rounded-lg';
    }
  };

  const widthStyle = width ? (typeof width === 'number' ? `${width}px` : width) : '100%';
  const heightStyle = height
    ? typeof height === 'number'
      ? `${height}px`
      : height
    : variant === 'text'
      ? undefined
      : variant === 'circular'
        ? '40px'
        : variant === 'card'
          ? '200px'
          : '100px';

  const singleSkeleton = (
    <div
      className={cn('skeleton', getVariantClasses(), className)}
      style={{
        width: widthStyle,
        height: heightStyle,
      }}
    />
  );

  if (count === 1) {
    return singleSkeleton;
  }

  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn('skeleton', getVariantClasses(), className)}
          style={{
            width: widthStyle,
            height: heightStyle,
          }}
        />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 animate-fade-in">
      {/* Greeting skeleton */}
      <div className="skeleton h-20 rounded-xl w-full" />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl w-full" />
        ))}
      </div>

      {/* Content area */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="skeleton h-48 rounded-xl w-full" />
        <div className="skeleton h-48 rounded-xl w-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4 animate-fade-in">
      {/* Table header */}
      <div className="grid grid-cols-4 gap-4 pb-4 border-b border-slate-200">
        {[1, 2, 3, 4].map((i) => (
          <div key={`header-${i}`} className="skeleton h-4 rounded w-full" />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={`cell-${rowIdx}-${i}`} className="skeleton h-12 rounded w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 p-6 bg-white rounded-xl border border-slate-200 animate-fade-in">
      {/* Card header */}
      <div className="space-y-2">
        <div className="skeleton h-6 rounded w-2/3" />
        <div className="skeleton h-4 rounded w-1/2" />
      </div>

      {/* Card content lines */}
      <div className="space-y-3">
        <div className="skeleton h-4 rounded w-full" />
        <div className="skeleton h-4 rounded w-5/6" />
        <div className="skeleton h-4 rounded w-4/5" />
      </div>

      {/* Card footer buttons */}
      <div className="flex gap-2 pt-4">
        <div className="skeleton h-10 rounded w-24" />
        <div className="skeleton h-10 rounded w-24" />
      </div>
    </div>
  );
}
