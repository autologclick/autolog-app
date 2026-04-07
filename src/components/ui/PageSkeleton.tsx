'use client';

/**
 * Page skeleton loader — matches the new design language.
 * Shows gradient header placeholder + card-shaped skeletons.
 */
export default function PageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="min-h-screen bg-[#fef7ed] animate-pulse">
      {/* Header skeleton */}
      <div className="bg-gradient-to-l from-gray-200 to-gray-300 px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="h-6 w-32 bg-white/30 rounded-lg mb-2" />
        <div className="h-4 w-48 bg-white/20 rounded-lg" />
      </div>

      {/* Content skeletons */}
      <div className="px-4 -mt-3 space-y-3 pb-24">
        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 h-20 bg-white rounded-2xl" />
          <div className="flex-1 h-20 bg-white rounded-2xl" />
          <div className="flex-1 h-20 bg-white rounded-2xl" />
        </div>

        {/* CTA skeleton */}
        <div className="h-14 bg-white rounded-2xl" />

        {/* Card skeletons */}
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-50 rounded w-1/2" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-14" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-50 rounded w-1/3" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-12" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-1/2" />
                <div className="h-3 bg-gray-50 rounded w-2/5" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
