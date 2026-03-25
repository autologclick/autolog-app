export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fef7ed] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo Placeholder */}
        <div className="mb-6 inline-block">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-teal-600 animate-pulse flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        </div>

        {/* Loading Text */}
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-2">טוען...</h2>
        <p className="text-sm text-gray-500">אנא המתן רגע</p>

        {/* Skeleton Content */}
        <div className="mt-8 w-80 mx-auto space-y-3">
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-3/4 mr-auto" />
          <div className="h-4 bg-gray-200 rounded-full animate-pulse w-5/6 mr-auto" />
        </div>

        {/* Skeleton Cards */}
        <div className="mt-6 w-80 mx-auto grid grid-cols-2 gap-3">
          <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse shadow-sm" />
          <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse shadow-sm" />
          <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse shadow-sm" />
          <div className="h-24 bg-white rounded-xl border border-gray-100 animate-pulse shadow-sm" />
        </div>
      </div>
    </div>
  );
}
