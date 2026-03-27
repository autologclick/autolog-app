export default function GarageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="skeleton h-5 w-20 rounded-lg" />
          <div className="skeleton h-8 w-40 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-7 w-12 rounded-lg mb-1" />
            <div className="skeleton h-3 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Alert banner */}
      <div className="skeleton h-14 w-full rounded-xl mb-6" />

      {/* Content */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Today's appointments */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="skeleton h-6 w-28 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 border border-gray-50 rounded-lg">
                <div className="skeleton h-10 w-16 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-3 w-32 rounded" />
                </div>
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent inspections */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="skeleton h-6 w-32 rounded-lg mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="skeleton h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <div className="skeleton h-4 w-20 rounded" />
                    <div className="skeleton h-3 w-28 rounded" />
                  </div>
                </div>
                <div className="skeleton h-8 w-12 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="skeleton h-4 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
