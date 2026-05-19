import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ChevronLeft, BookOpen, Star } from 'lucide-react';
import { blogPosts } from '@/lib/blog/posts';
import Logo from '@/components/ui/Logo';

const PILLAR_SLUG = 'madrich-male-baal-rechev-chadash-2026';

export const metadata: Metadata = {
  title: 'בלוג AutoLog — מדריכים וטיפים לבעלי רכב',
  description: 'מדריכים, טיפים וכלים לבעלי רכב פרטי בישראל. טסט, ביטוח, הוצאות רכב, תחזוקה ועוד — הכל במקום אחד.',
  keywords: ['בלוג רכב', 'מדריכים לבעלי רכב', 'טיפים לרכב', 'הוצאות רכב', 'טסט רכב'],
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'בלוג AutoLog — מדריכים וטיפים לבעלי רכב',
    description: 'מדריכים, טיפים וכלים לבעלי רכב פרטי בישראל.',
    url: 'https://autolog.click/blog',
    type: 'website',
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#fef7ed]" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-80 transition">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white transition">
            חזרה לאתר ←
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-l from-[#1e3a5f] to-[#2a5a8f] text-white pb-16 pt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">בלוג AutoLog</h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            מדריכים, טיפים וכלים שכל בעל רכב בישראל צריך
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 pb-20">
        {/* Pillar feature */}
        {(() => {
          const pillar = blogPosts.find((p) => p.slug === PILLAR_SLUG);
          if (!pillar) return null;
          return (
            <Link
              href={`/blog/${pillar.slug}`}
              className="block bg-gradient-to-l from-teal-600 to-teal-700 text-white rounded-3xl shadow-lg p-8 sm:p-10 mb-10 hover:shadow-xl transition group"
            >
              <div className="flex items-center gap-2 text-xs font-semibold mb-3 opacity-90">
                <Star size={14} className="fill-yellow-300 text-yellow-300" />
                המדריך המקיף ביותר באתר
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">{pillar.title}</h2>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-5 max-w-2xl">{pillar.description}</p>
              <div className="flex items-center gap-4 text-xs text-white/80">
                <span className="flex items-center gap-1"><Clock size={12} />{pillar.readingTime}</span>
                <span className="flex items-center gap-1 font-semibold group-hover:gap-2 transition-all">
                  קראו עכשיו <ChevronLeft size={14} />
                </span>
              </div>
            </Link>
          );
        })()}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...blogPosts]
            .filter((p) => p.slug !== PILLAR_SLUG)
            .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
            .map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-teal-200 transition-all group overflow-hidden"
            >
              {/* Category badge */}
              <div className="px-6 pt-6 pb-2">
                <span className="inline-block text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <h2 className="text-lg font-bold text-[#1e3a5f] mb-2 group-hover:text-teal-700 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-3">
                  {post.description}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(post.publishedAt).toLocaleDateString('he-IL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {post.readingTime}
                  </span>
                </div>

                {/* Read more */}
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-teal-600 group-hover:gap-2 transition-all">
                  <span>קרא עוד</span>
                  <ChevronLeft size={14} />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-extrabold text-[#1e3a5f] mb-3">רוצים לנהל את הרכב בצורה חכמה?</h2>
          <p className="text-gray-500 mb-6 max-w-lg mx-auto">
            הצטרפו בחינם ל-AutoLog — תזכורות טסט וביטוח, מעקב הוצאות, סריקת מסמכים עם AI ועוד.
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition shadow-lg shadow-teal-600/20"
          >
            הרשמה חינם
            <ChevronLeft size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e3a5f] text-white/60 py-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} AutoLog. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}
