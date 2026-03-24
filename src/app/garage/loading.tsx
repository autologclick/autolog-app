export default function GarageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block mb-6">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-teal-600 rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <p className="text-lg text-[#1e3a5f] font-semibold">טוען...</p>

        {/* Optional: Subtle message */}
        <p className="text-sm text-gray-500 mt-2">אנא המתן בזמן טעינת הדף</p>
      </div>
    </div>
  );
}
