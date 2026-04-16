import Image from 'next/image';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#fef7ed] flex items-center justify-center">
      <div className="text-center">
        {/* Animated Logo */}
        <div className="mb-6 inline-block animate-pulse">
          <Image
            src="/logo.png"
            alt="AutoLog"
            width={80}
            height={80}
            className="w-20 h-20 object-contain"
            priority
          />
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
