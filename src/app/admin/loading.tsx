export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="skeleton h-5 w-20 rounded-lg" />
          <div className="skeleton h-8 w-44 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="skeleton h-10 w-10 rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-7 w-14 rounded-lg mb-1" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Quick actions */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="skeleton h-6 w-28 rounded-lg mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="skeleton h-6 w-36 rounded-lg mb-4" />
          <div className="grid md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <div className="skeleton h-4 w-20 rounded mb-3" />
                <div className="skeleton h-5 w-32 rounded mb-2" />
                <div className="skeleton h-3 w-full rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity feed + Top garages */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="skeleton h-6 w-32 rounded-lg mb-4" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="skeleton h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="skeleton h-6 w-28 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="skeleton h-4 w-28 rounded" />
                </div>
                <div className="flex gap-4">
                  <div className="skeleton h-4 w-8 rounded" />
                  <div className="skeleton h-4 w-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
