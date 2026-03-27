'use client';

import { cn } from '@/lib/cn';
import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, hint, id: propId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = propId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors duration-200 group-focus-within:text-teal-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            dir="auto"
            aria-invalid={error ? true : undefined}
            aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
            className={cn(
              'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-right',
              'placeholder:text-gray-400',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-teal-400/40 focus:border-teal-500 focus:shadow-sm',
              'hover:border-gray-400',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:hover:border-gray-300',
              icon && 'pe-10',
              error && 'border-red-500 focus:ring-red-400/40 focus:border-red-500 hover:border-red-400',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-red-500 text-xs mt-1.5 flex items-center gap-1" role="alert">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={hintId} className="text-gray-400 text-xs mt-1.5">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
