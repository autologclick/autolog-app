'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function GarageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Garage portal error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-8 inline-block">
          <div className="bg-red-100 p-6 rounded-full inline-block">
            <AlertTriangle size={64} className="text-red-600" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-[#1e3a5f] mb-3">אירעה שגיאה</h1>

        {/* Description */}
        <p className="text-gray-600 mb-2 leading-relaxed">
          מצטערים, משהו השתבש בפורטל המוסך. אנא נסה שוב.
        </p>

        {error.message && (
          <p className="text-sm text-red-600 mb-6 font-mono bg-red-50 p-3 rounded border border-red-200">
            {error.message}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mb-8">
          <Button
            onClick={reset}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold"
          >
            נסה שוב
          </Button>
        </div>

        {/* Additional Info */}
        {error.digest && (
          <div className="pt-8 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              ID שגיאה: {error.digest}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
