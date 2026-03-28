export default function OfflinePage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          \u05d0\u05d9\u05df \u05d7\u05d9\u05d1\u05d5\u05e8 \u05dc\u05d0\u05d9\u05e0\u05d8\u05e8\u05e0\u05d8
        </h1>
        <p className="text-gray-600 mb-8">
          \u05e0\u05e8\u05d0\u05d4 \u05e9\u05d0\u05d9\u05df \u05dc\u05da \u05d7\u05d9\u05d1\u05d5\u05e8 \u05dc\u05d0\u05d9\u05e0\u05d8\u05e8\u05e0\u05d8 \u05db\u05e8\u05d2\u05e2. \u05d1\u05d3\u05d5\u05e7 \u05d0\u05ea \u05d4\u05d7\u05d9\u05d1\u05d5\u05e8 \u05e9\u05dc\u05da \u05d5\u05e0\u05e1\u05d4 \u05e9\u05d5\u05d1.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          \u05e0\u05e1\u05d4 \u05e9\u05d5\u05d1
        </button>
        <p className="text-xs text-gray-400 mt-6">
          AutoLog - \u05e0\u05d9\u05d4\u05d5\u05dc \u05e8\u05db\u05d1\u05d9\u05dd \u05d7\u05db\u05dd
        </p>
      </div>
    </div>
  );
}
