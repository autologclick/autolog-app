import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Large 404 with Icon */}
        <div className="mb-8">
          <div className="inline-block relative mb-4">
            <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-[#1e3a5f]">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle size={80} className="text-teal-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-bold text-[#1e3a5f] mb-3">הדף לא נמצא</h1>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          הדף שחיפשת לא קיים או שהוסר. אנא בדוק את הכתובת ונסה שוב.
        </p>

        {/* Button */}
        <Link href="/">
          <Button className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold">
            חזרה לדף הבית
          </Button>
        </Link>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            אם הבעיה מתמשכת, אנא <Link href="/contact" className="text-teal-600 hover:text-teal-700 font-semibold">צור קשר</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
