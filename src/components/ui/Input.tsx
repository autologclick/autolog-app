'use client';

import { cn } from '@/lib/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            dir="auto"
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-right',
              'placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400',
              'disabled:bg-gray-50 disabled:text-gray-500',
              icon && 'pe-10',
              error && 'border-red-500 focus:ring-red-400',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
