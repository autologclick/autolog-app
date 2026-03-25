'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Shield, AlertCircle, Zap, MapPin, Users, Menu, X,
  FileText, Bell, Wrench, Clock, Star, ChevronDown,
  Smartphone, Car, CalendarCheck, BarChart3, Lock,
  Phone, Mail, CheckCircle2, ArrowLeft, TrendingUp,
  ClipboardCheck, HeartPulse, Calendar
} from 'lucide-react';
import Logo, { LogoIcon } from '@/components/ui/Logo';

// Intersection Observer hook for scroll animations
function useInView(threshold = 0.05) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback: ensure visibility after 2.5s even if observer fails
    const fallback = setTimeout(() => setIsVisible(true), 2500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
          clearTimeout(fallback);
        }
      },
      { threshold, rootMargin: '0px 0px 0px 0px' }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold]);

  return { ref, isVisible };
}

// Animated counter component
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useInView(0.1);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString('he-IL')}{suffix}
    </span>
  );
}

// Feature card
function FeatureCard({ icon: Icon, title, description, delay }: {
  icon: any; title: string; description: string; delay: number;
}) {
  const { ref, isVisible } = useInView();
  return (
    <div
      ref={ref}
      className={`bg-white p-7 rounded-2xl shadow-md border border-gray-100 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-teal-600" />
      </div>
      <h3 className="text-lg font-bold text-[××¡×¤×¨ 1e3a5f] mb-3">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
    </div>
  );
}

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  const howItWorks = useInView();
  const garages = useInView();
  const stats = useInView();
  const testimonials = useInView();
  const faq = useInView();
  const cta = useInView();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-white" dir="rtl">
      {/* ============ STRUCTURED DATA (JSON-LD) ============ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': 'https://autolog.click/#organization',
                name: 'AutoLog',
                url: 'https://autolog.click',
                logo: 'https://autolog.click/logo.svg',
                description: '××¤×××¤××¨×× ××××××× ×××©×¨×× ×× ×××× ×¨×××× ×××',
                sameAs: ['https://www.facebook.com/autolog', 'https://www.linkedin.com/company/autolog'],
                contactPoint: {
                  '@type': 'ContactPoint',
                  contactType: 'Customer Service',
                  telephone: '+972-2-999-9999',
                  email: 'info@autolog.click',
                },
              },
              {
                '@type': 'SoftwareApplication',
                '@id': 'https://autolog.click/#software',
                name: 'AutoLog',
                applicationCategory: 'Productivity',
                operatingSystem: 'Web, iOS, Android',
                url: 'https://autolog.click',
                description: '× ×××× ×¨×××× ××× ×¢× ×ª××××¨××ª, ××¡×××× ××××¤×× ×××¨××',
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.8',
                  ratingCount: '150',
                },
              },
              {
                '@type': 'FAQPage',
                '@id': 'https://autolog.click/#faq',
                mainEntity: [
                  {
                    '@type': 'Question',
                    name: '××× AutoLog ×××× ×?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '××! AutoLog ×××× × ××××××× ××× ×××©×ª××©××. ××× ××× ××¨×©××, ××× ××× ××××©××× â ×× ××× × ××ª×××.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '××× ×¦×¨×× ××××¨×× ××¤×××§×¦××?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '×× ×¦×¨××! AutoLog ×¢××××ª ××¨× ×××¤××¤× ×©× ××××¤×× ×©××. ×¤×©×× × ×× ×¡×× ×××ª×¨, × ×¨×©××× ×××ª×××××.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '××× ××××¡× ×©×× ××¦××¨×£?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '××© ××£ ×××¢××× ×××¦××¨×¤××ª ×××¡××× ××©× "××××¡×××" ××¢××× ××××ª. ×××¥ ×¢×××, ××× ××ª ××××¤×¡, ××× ×× × × ×¦××¨ ×××ª× ×§×©×¨ ××ª×× 24 ×©×¢××ª.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '××× ×××××¢ ×©×× ××××××?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '×¤×¨××××ª ×××××× ×× ×¢×××¤××ª ××¡×¤×¨ 1 ×©×× ×. ×× ×××××¢ ×××¦×¤× ××¡×× ××¨××× ×× ×§×××× ××××××¡× ××©×¨×ª×× ××××××××.',
                    },
                  },
                  {
                    '@type': 'Question',
                    name: '××× ××¤×©×¨ ×× ×× ××× ×¨××××?',
                    acceptedAnswer: {
                      '@type': 'Answer',
                      text: '×××××! ××ª× ×××× ××××¡××£ ××× ×¨×××× ×©××ª× ×¨××¦× ×××©××× ×××. ×× ×¨×× ××¡×××¨ ×× ×¤×¨×.',
                    },
                  },
                ],
              },
            ],
          }),
        }}
      />

      {/* ============ NAVIGATION ============ */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <Logo size="md" dark={!isScrolled} linkToHome />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className={`text-sm font-medium transition ${isScrolled ? 'text-gray-600 hover:text-[××¡×¤×¨ 1e3a5f]' : 'text-white/80 hover:text-white'}`}>
              ×ª××× ××ª
            </a>
            <a href="#how-it-works" className={`text-sm font-medium transition ${isScrolled ? 'text-gray-600 hover:text-[××¡×¤×¨ 1e3a5f]' : 'text-white/80 hover:text-white'}`}>
              ××× ×× ×¢×××
            </a>
            <a href="#garages" className={`text-sm font-medium transition ${isScrolled ? 'text-gray-600 hover:text-[××¡×¤×¨ 1e3a5f]' : 'text-white/80 hover:text-white'}`}>
              ××××¡×××
            </a>
            <a href="#faq" className={`text-sm font-medium transition ${isScrolled ? 'text-gray-600 hover:text-[××¡×¤×¨ 1e3a5f]' : 'text-white/80 hover:text-white'}`}>
              ×©××××ª × ×¤××¦××ª
            </a>
            <div className="w-px h-6 bg-gray-300/30 mx-1" />
            <Link
              href="/auth/login"
              className={`px-5 py-2 text-sm font-medium rounded-lg transition ${
                isScrolled ? 'text-[××¡×¤×¨ 1e3a5f] hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              ×× ××¡×
            </Link>
            <Link
              href="/auth/signup"
              className="px-5 py-2.5 bg-[#0d9488] text-white text-sm font-bold rounded-lg hover:bg-[#0b7e74] transition shadow-md shadow-teal-500/20"
            >
              ××¨×©×× ×××× ×
            </Link>
          </div>

          {/* Mobile Menu */}
          <button
            className="md:hidden p-2 rounded-lg transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen
              ? <X size={24} className={isScrolled ? 'text-gray-700' : 'text-white'} />
              : <Menu size={24} className={isScrolled ? 'text-gray-700' : 'text-white'} />
            }
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white shadow-xl border-t">
            <div className="px-4 py-3 space-y-1">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-[#fef7ed]/50 rounded-lg">×ª××× ××ª</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-[#fef7ed]/50 rounded-lg">××× ×× ×¢×××</a>
              <a href="#garages" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-[#fef7ed]/50 rounded-lg">××××¡×××</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-gray-700 hover:bg-[#fef7ed]/50 rounded-lg">×©××××ª × ×¤××¦××ª</a>
              <hr className="my-2" />
              <Link href="/auth/login" className="block px-4 py-3 text-[××¡×¤×¨ 1e3a5f] font-medium hover:bg-[#fef7ed]/50 rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                ×× ××¡×
              </Link>
              <Link href="/auth/signup" className="block px-4 py-3 bg-[#0d9488] text-white text-center font-bold rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                ××¨×©×× ×××× ×
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f2b47] via-[××¡×¤×¨ 1e3a5f] to-[#0d7377]" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h60v60H0z' fill='none'/%3E%3Cpath d='M30 5l5 10h10l-8 6 3 10-10-7-10 7 3-10-8-6h10z' fill='white' opacity='.3'/%3E%3C/svg%3E")`,
        }} />

        {/* Floating decorative shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <div className="text-right">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-teal-200 text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/10">
                <Zap size={14} />
                <span>××¤×××¤××¨×× ××¡×¤×¨ 1 ×× ×××× ×¨×××× ×××©×¨××</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                ×× ×× ×©×¦×¨××{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-300 to-cyan-300">
                  ××¨×× ×©××
                </span>
                {' '}×××§×× ×××
              </h1>

              <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-lg">
                ××××§××ª ×ª×§××¤×ª×××ª, ×××××, ××¡×, ×ª××××¨××ª ×××××ª, ×××¡×××¨×××ª ×××¤×××× ××©××¨××ª ×××¨×× â ××× ××¤×××¤××¨×× ××××××××ª ×××ª, ×××× ×.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/auth/signup"
                  className="px-8 py-4 bg-[#0d9488] text-white rounded-xl font-bold text-lg hover:bg-[#0b7e74] transition-all shadow-xl shadow-teal-600/30 hover:shadow-teal-600/40 hover:-translate-y-0.5 text-center"
                >
                  ××ª×× ×××× × â ××× ××¨×××¡ ××©×¨××
                </Link>
                <Link
                  href="/auth/login"
                  className="px-8 py-4 bg-white/10 backdrop-blur text-white rounded-xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20 text-center"
                >
                  ×× ××¡× ×××¢×¨××ª
                </Link>
              </div>

              {/* Social proof mini */}
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {['bg-blue-400','bg-green-400','bg-purple-400','bg-orange-400'].map((c, i) => (
                    <div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-[××¡×¤×¨ 1e3a5f] flex items-center justify-center text-white text-xs font-bold`}>
                      {['×¤','×','×','×©'][i]}
                    </div>
                  ))}
                </div>
                <span>××¦××¨×¤×× ×-<strong className="text-white">2,500+</strong> ××©×ª××©××</span>
              </div>
            </div>

            {/* Hero visual - Dashboard mockup */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Phone mockup frame */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  {/* Mock header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2" dir="ltr">
                      <LogoIcon size={28} />
                      <span className="text-white font-bold text-sm">AutoLog</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                        <Bell size={14} className="text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Mock greeting */}
                  <div className="mb-5">
                    <p className="text-gray-400 text-xs">×××§×¨ ×××,</p>
                    <p className="text-white font-bold">×¤××××¤</p>
                  </div>

                  {/* Mock vehicle cards */}
                  <div className="space-y-3 mb-5">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-teal-300" />
                          <span className="text-white text-sm font-medium">×××××× ×§××¨×××</span>
                        </div>
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">×ª×§××</span>
                      </div>
                      <p className="text-gray-400 text-xs">12-345-67 â¢ ××¡×: ×¢×× 45 ××××</p>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Car size={16} className="text-teal-300" />
                          <span className="text-white text-sm font-medium">××××× 3</span>
                        </div>
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10} /> ×××××</span>
                      </div>
                      <p className="text-gray-400 text-xs">98-765-43 â¢ ××××× ×¤× ××¢×× 7 ××××</p>
                    </div>
                  </div>

                  {/* Mock action buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: CalendarCheck, label: '×§××¢ ×ª××¨' },
                      { icon: FileText, label: '××¡××××' },
                      { icon: HeartPulse, label: 'SOS' },
                    ].map(({ icon: I, label }) => (
                      <div key={label} className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <I size={18} className="text-teal-300 mx-auto mb-1" />
                        <span className="text-white text-[10px]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating notification */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3 animate-bounce-slow">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Bell size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">×ª××××¨×ª ××¡×</p>
                    <p className="text-[10px] text-gray-500">×¢×× 7 ×××× ×××¡× ×©× ×ª×</p>
                  </div>
                </div>

                {/* Floating stat */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800">××××§× ×××©×××</p>
                    <p className="text-[10px] text-gray-500">×¦×××: 94/100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-white/40" />
        </div>
      </section>

      {/* ============ TRUST BAR ============ */}
      <section className="py-6 bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap justify-center items-center gap-8 text-gray-400 text-sm">
          <div className="flex items-center gap-2">
            <Lock size={16} />
            <span>×××××× ××××¦×¤×</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone size={16} />
            <span>×¢××× ××× ×××©××¨</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>××× × ×××××××</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield size={16} />
            <span>×¤×¨××××ª ××××</span>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm mb-2 block">××× AutoLog?</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[××¡×¤×¨ 1e3a5f] mb-4">
              ××× ×©×× â ×××§×× ×××
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              × ×××× ×¨×××× ××× ×©×××¡× ×× ×××, ××¡×£ ××××××ª. ×× ×× ×©×¦×¨×× ×××¢×ª ×¢× ××¨×× ×©××, ×ª××× ××××©× ××.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={FileText}
              title="× ×××× ××¡×××× ×××"
              description="×××××, ×¨××©×××, ××¡× ×©× ×ª×, ×§××××ª â ×× ×××¡×××× ×©×× ××××¨×× ×× ××¢× ×, × ×××©×× ××× ××§×× ×××× ×××."
              delay={0}
            />
            <FeatureCard
              icon={Bell}
              title="×ª××××¨××ª ×××××ª"
              description="×§×× ××ª×¨×××ª ×××××××××ª ××¤× × ×©×¤× ×ª××§×£ ×××¡×, ×××××× ×× ××¨××©×××. ×× ×ª×¤×¡×¤×¡ ×©×× ×ª××¨×× ××©××."
              delay={100}
            />
            <FeatureCard
              icon={HeartPulse}
              title="SOS ×××¨××"
              description="×ª×§××¢ ×××¨×? ××××¦× ×××ª ×©××××ª ×§×¨×××ª ×¢××¨× ××××¡× ×©×× ×× ××©××¨××ª ×××¨×× ××§×¨×× ××××."
              delay={200}
            />
            <FeatureCard
              icon={ClipboardCheck}
              title="×××××ª ××××§× ×××××××××"
              description="×§×× ××× ××××§× ××¤××¨× ×××××¡× ××©××¨××ª ×××¤×××§×¦×× â ×¢× ×¦××× ××, ×ª××× ××ª ×××××¦××ª ××××¤××."
              delay={300}
            />
            <FeatureCard
              icon={CalendarCheck}
              title="×§×××¢×ª ×ª××¨×× ××× ××××"
              description="×ª××× ××××§× ×× ×××¤×× ××××¡× ××©××¨××ª ××××¢×¨××ª. ××× ×××¤×× ××, ××× ×××ª× ×."
              delay={400}
            />
            <FeatureCard
              icon={BarChart3}
              title="×××¡×××¨×××ª ×××¤××××"
              description="×¢×§×× ×××¨ ×× ××××¤××××, ××××¦×××ª ××××××§××ª ××××¨× ××× ××¨×× â ××××¢ ×©×¢×××¨ ×× ×××××¨×."
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" ref={howItWorks.ref} className="py-20 sm:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-teal-600 font-semibold text-sm mb-2 block">×¤×©×× ××§×</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[××¡×¤×¨ 1e3a5f] mb-4">
              ××ª××××× ××©×××©× ×¦×¢×××
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              ××× ×××¨××ª ××¤×××§×¦××. ××× ××¨×××¡ ××©×¨××. ×¤×©×× × ×¨×©××× ×××ª×××××.
            </p>
          </div>

          <div className={`grid md:grid-cols-3 gap-8 transition-all duration-1000 ${howItWorks.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              {
                num: '01',
                title: '××¨×©×× ××××¨×',
                desc: '× ×¨×©××× ×¢× ×××× ×××¡×¤×¨ ×××¤××. ×ª×× 30 ×©× ×××ª ×××©××× ×©×× ××××.',
                icon: Smartphone,
                color: 'from-blue-500 to-blue-600',
              },
              {
                num: '02',
                title: '×××¡×£ ××ª ××¨×××× ×©××',
                desc: '×××¡××¤×× ××ª ××¨×× ×¢× ××¡×¤×¨ ×¨××©×× â ×××¢×¨××ª ×©×××¤×ª ××ª ×× ××¤×¨××× ××××××××ª.',
                icon: Car,
                color: 'from-teal-500 to-teal-600',
              },
              {
                num: '03',
                title: '×§×× ×©×××× ××××',
                desc: '×ª××××¨××ª, ×ª××¢××, ×ª××¨×× ×××¢×§× ×××¦×××ª â ××× ××¡×××¨ ××× ××× ××©××××.',
                icon: CheckCircle2,
                color: 'from-green-500 to-green-600',
              },
            ].map((step, i) => (
              <div
                key={step.num}
                className="text-center group"
                style={{ transitionDelay: `${i * 200}ms` }}
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-9 h-9 text-white" />
                </div>
                <div className="text-xs font-bold text-teal-600 mb-2">×©×× {step.num}</div>
                <h3 className="text-xl font-bold text-[××¡×¤×¨ 1e3a5f] mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section ref={stats.ref} className="py-16 bg-[××¡×¤×¨ 1e3a5f]">
        <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${stats.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: 2500, suffix: '+', label: '××©×ª××©×× ×¤×¢××××', icon: Users },
              { value: 150, suffix: '+', label: '×××¡××× ×©××ª×¤××', icon: Wrench },
              { value: 10000, suffix: '+', label: '××××§××ª ×©×××¦×¢×', icon: ClipboardCheck },
              { value: 98, suffix: '%', label: '×©×××¢××ª ×¨×¦××', icon: Star },
            ].map(({ value, suffix, label, icon: Icon }) => (
              <div key={label}>
                <Icon className="w-8 h-8 mx-auto mb-3 text-teal-300 opacity-80" />
                <div className="text-3xl sm:text-4xl font-extrabold mb-1">
                  <Counter target={value} suffix={suffix} />
                </div>
                <p className="text-sm text-gray-300">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS ============ */}
      <section ref={testimonials.ref} className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-teal-600 font-semibold text-sm mb-2 block">×× ××××¨×× ×¢××× ×</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[××¡×¤×¨ 1e3a5f]">
              ×××§××××ª ×©×× × ××××¨××
            </h2>
          </div>

          <div className={`grid md:grid-cols-3 gap-6 transition-all duration-1000 ${testimonials.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              {
                name: '×× × ×××',
                role: '××¢× 3 ×¨××××',
                text: '××× ×©×× × ××©×ª××© ×-AutoLog ×× × ×× ××¤×¡×¤×¡ ×©×× ×ª××¨××. ×××¡×, ×××××× â ××× ××¡×××¨. ×¤×©×× ×©×§× × ×¤×©×.',
                stars: 5,
              },
              {
                name: '×××× ×××',
                role: '×× ×××ª ×¦× ×¨××××',
                text: '×× ×× × ×× ×××× 20 ×¨×××× ××¨× ×××¢×¨××ª. ××××¡×××¨×× ××××× ××× ×¨×× ×××¡××ª ×× × ×©×¢××ª ×©× ×¢×××× ××× ××ª ××× ××××©.',
                stars: 5,
              },
              {
                name: '×××¡× ×××¨××',
                role: '××¢× ×××¡×',
                text: '××××××ª ×××××××××× ×©×× × ×× × ××ª ××¢×¡×§. ×××§××××ª ××§×××× ××× ××§×¦××¢× ××©×¨ ×× ××× ××××× ×××× ×©×× × ×¢××.',
                stars: 5,
              },
            ].map((t, i) => (
              <div
                key={t.name}
                className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition"
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[××¡×¤×¨ 1e3a5f] to-[#0d9488] rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FOR GARAGES ============ */}
      <section id="garages" ref={garages.ref} className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${garages.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Content */}
            <div>
              <span className="text-emerald-600 font-semibold text-sm mb-2 block">××××¡××× ×××¢×× ×¢×¡×§××</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[××¡×¤×¨ 1e3a5f] mb-6">
                ××¤×× ××ª ××××¡× ×©×× ××××××××
              </h2>
              <p className="text-gray-500 text-lg leading-relaxed mb-8">
                ××¦××¨×£ ××××¡× ×©××ª×£ ××§×× ×××× ××ª×§×××× ×× ×××× ×××§××××ª, ×××××§××ª ×××ª××¨×× ×©×× â ×××× ×.
              </p>

              <div className="space-y-5 mb-8">
                {[
                  { icon: ClipboardCheck, title: '×××××ª ××××§× ×××××××××', desc: '×¦××¨ ×××××ª ××§×¦××¢××× ××©× ×××ª ×¢× ××§××× ×§××××ª, ×ª××× ××ª ××¦××× ××.' },
                  { icon: CalendarCheck, title: '× ×××× ×ª××¨×× ×××', desc: '×××§××××ª ×§×××¢×× ×ª××¨ ××©××¨××ª ××××¢×¨××ª. ××× ×××¤×× ×× ××××ª×¨××.' },
                  { icon: Star, title: '×× × ××× ××××', desc: '×§×× ×××¨×××× ××××§××¨××ª ×××§××××ª ××¨××¦×× ××××× ××× ××××¡××× ×××××¨.' },
                  { icon: TrendingUp, title: '× ××ª×× ×××¦××¢××', desc: '××©×××¨× ×¢× ×¡××××¡×××§××ª, ××× ×¡××ª ×××¢×§× ×××¨ ×××¦××¢× ××××¡×.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex-shrink-0 w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[××¡×¤×¨ 1e3a5f] text-sm mb-1">{title}</h4>
                      <p className="text-gray-500 text-sm">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/garage-apply"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20"
              >
                <span>×××© ××§×©×ª ××¦××¨×¤××ª</span>
                <ArrowLeft size={18} />
              </Link>
            </div>

            {/* Visual */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 border border-emerald-100">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[××¡×¤×¨ 1e3a5f]"><BarChart3 size={16} className="inline" /> ×¡×××× ××××©×</h4>
                  <span className="text-xs text-gray-400">××¨×¥ 2026</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-[××¡×¤×¨ 1e3a5f]">47</p>
                    <p className="text-xs text-gray-500">××××§××ª</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-emerald-600">4.8</p>
                    <p className="text-xs text-gray-500">×××¨××</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-[××¡×¤×¨ 1e3a5f]">92%</p>
                    <p className="text-xs text-gray-500">×××¨× ×©××</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h4 className="font-bold text-[××¡×¤×¨ 1e3a5f] mb-3"><Calendar size={16} className="inline" /> ×ª××¨×× ×××××</h4>
                <div className="space-y-3">
                  {[
                    { time: '09:00', name: '×× × ×××', type: '××¡× ×©× ×ª×', color: 'bg-blue-100 text-blue-700' },
                    { time: '10:30', name: '×©×¨× ×××¨××', type: '××××§× ×××××ª', color: 'bg-teal-100 text-teal-700' },
                    { time: '12:00', name: '××× ×¨×××', type: '××××¤×ª ×©××', color: 'bg-amber-100 text-amber-700' },
                  ].map(item => (
                    <div key={item.time} className="flex items-center gap-3 p-2 hover:bg-[#fef7ed]/50 rounded-lg transition">
                      <span className="text-xs font-mono text-gray-400 w-10">{item.time}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.color}`}>{item.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section id="faq" ref={faq.ref} className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-teal-600 font-semibold text-sm mb-2 block">×©××××ª × ×¤××¦××ª</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[××¡×¤×¨ 1e3a5f] mb-4">
              ×ª×©××××ª ××©××××ª ×× ×¤××¦××ª ×©××
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              ××¦× ×ª×©××××ª ××××¨××ª ××©××××ª ×× ×¤××¦××ª ××××ª×¨ ×¢× AutoLog.
            </p>
          </div>

          <div className={`space-y-3 transition-all duration-1000 ${faq.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              {
                q: '××× AutoLog ×××× ×?',
                a: '××! AutoLog ×××× × ××××××× ××× ×××©×ª××©××. ××× ××× ××¨×©××, ××× ××× ××××©××× â ×× ××× × ××ª×××. ××¤××× ×× ×ª×©×ª××© ×××¢×¨××ª ×××©× ×©× ××, ×× ×ª×©×× ×©×§× ×××.',
              },
              {
                q: '××× ×¦×¨×× ××××¨×× ××¤×××§×¦××?',
                a: '×× ×¦×¨××! AutoLog ×¢××××ª ××©××¨××ª ××¨× ×××¤××¤× ×©× ××××¤×× ×©××. ×¤×©×× × ×× ×¡×× ×××ª×¨, × ×¨×©××× ×××ª×××××. ××ª× ×××× ××××¡××£ ×§××¦××¨ ××¨× ×××£ ××××ª ××× ××¢××× ×××××§ ××× ××¤×××§×¦××.',
              },
              {
                q: '××× ××××¡× ×©×× ××¦××¨×£?',
                a: '××© ××£ ×××¢××× ×××¦××¨×¤××ª ×××¡××× ××©× "××××¡×××" ××¢××× ××××ª. ×××¥ ×¢×××, ××× ××ª ××××¤×¡ ×¢× ×¤×¨×× ××××¡×, ××× ×× × × ×¦××¨ ×××ª× ×§×©×¨ ××ª×× 24 ×©×¢××ª. ×××¦××¨×¤××ª ××× ×××ª ×××××××.',
              },
              {
                q: '××× ×××××¢ ×©×× ××××××?',
                a: '×¤×¨××××ª ×××××× ×× ×¢×××¤××ª ××¡×¤×¨ 1 ×©×× ×. ×× ×××××¢ ×©×× ×××¦×¤× ××¡×× ××¨××× ×× ×§×××× (SSL/TLS), ××××××¡× ××©×¨×ª×× ×××××××× ×××¡×××¨××. ×× ×× × ××¢××× ×× ××××¨×× ××ª ×× ×ª×× ×× ×©×× ××¦× ×©×××©×.',
              },
              {
                q: '×× ×§××¨× ×× ×× × ××××¨ ××ª ××¨××?',
                a: '××ª× ×××× ××× ×¨××¢ ×××××§ ××ª ××¨×× ××××©××× ×©××. ×× ×××¡×××× ××× ×ª×× ×× ×©×× ××ª×××§×× ××¦××¨× ×××××××ª ×××¢×¨××ª AutoLog. ×× ××ª× ×¨××¦×, ××ª× ×××× ××¤××× ××××¦× ××ª ××××¡×××¨×× ××¤× × ×××××§×.',
              },
              {
                q: '××× ××¤×©×¨ ×× ×× ××× ×¨××××?',
                a: '×××××! ××ª× ×××× ××××¡××£ ××× ×¨×××× ×©××ª× ×¨××¦× ×××©××× ×××. ×ª××××¨××ª, ××¡××××, ××××§××ª â ××× ××¡×××¨ ×× ×¤×¨× ××× ×¨××. ××¦××× ×××¢×× ×¦× ×× ××©×¤×××ª ×¢× ×××ª×¨ ××¨×× ×××.',
              },
              {
                q: '××× ×× × ×§×××¢ ×ª××¨ ××××¡×?',
                a: '×× ××××¡× ×©×× ×©××ª×£ ×-AutoLog, ××ª× ×××× ××§×××¢ ×ª××¨ ××©××¨××ª ××××¢×¨××ª. ××××¦× ×××ª, ×××¨ ××ª ××ª××¨×× ×××©×¢× â ××××! ××××¡× ××§×× ××ª ×××§×©× ×××××¨ ×××× ×¢× ×××©××¨.',
              },
              {
                q: '×× ×× ×××××ª ×××××§× ××××××××××?',
                a: '×××§×× ××××¤××¡ ××× ×¢× × ×××¨, ××××¡× ×××¦×¨ ××× ××§×¦××¢× ××©×¨ ×××¢×¨××ª â ×¢× ×ª××× ××ª, ×¦××× ××, ××××¤×× ××××¤××. ××ª× ××§×× ××ª ×× ××©×¨ ×× ××× ×©××, ×× ×××× ××§× ××©×××¨×.',
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                className="w-full text-right"
              >
                <div className="bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-5 transition">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-[××¡×¤×¨ 1e3a5f] text-base leading-snug">{item.q}</h3>
                    <ChevronDown
                      size={20}
                      className={`flex-shrink-0 text-teal-600 transition-transform duration-300 ${
                        expandedFAQ === i ? 'rotate-180' : ''
                      }`}
                    />
                  </div>

                  {expandedFAQ === i && (
                    <p className="text-gray-600 text-sm mt-4 leading-relaxed text-right">
                      {item.a}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 p-8 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100 text-center">
            <p className="text-gray-700 font-medium mb-4">
              ×¢×× ×©×××? ×× ×× × ××× ××©××××!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://wa.me/972299999999"
                className="px-6 py-2.5 bg-[#0d9488] text-white font-bold rounded-lg hover:bg-[#0b7e74] transition"
              >
                ×¦××¨ ×§×©×¨ ××¨× WhatsApp
              </a>
              <a
                href="mailto:info@autolog.click"
                className="px-6 py-2.5 bg-white text-[#0d9488] font-bold rounded-lg hover:bg-gray-50 transition border border-teal-200"
              >
                ×©×× ××××
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section ref={cta.ref} className="py-20 sm:py-24">
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${cta.isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="bg-gradient-to-br from-[××¡×¤×¨ 1e3a5f] via-[#244b75] to-[#0d7377] rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl" />

            <div className="relative z-10">
              <LogoIcon size={48} className="mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                ×××× ×× ×× ××ª ××¨×× ×©×× ×××?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-lg mx-auto">
                ××¦××¨×£ ××××¤× ××©×¨×××× ×©×××¨ ×××¡××× ××× ×××¡×£ ×¢× AutoLog. ××¨×©×× ××× ×××ª ××ª××× ×ª××©××¨ ×××.
              </p>
              <Link
                href="/auth/signup"
                className="inline-block px-10 py-4 bg-white text-[××¡×¤×¨ 1e3a5f] font-bold text-lg rounded-xl hover:bg-gray-100 transition shadow-xl hover:-translate-y-0.5"
              >
                ××¨×©× ×¢××©×× â ×××× ×
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-[#0f2b47] text-white pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <Logo size="md" dark className="mb-4" />
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                ××¤×××¤××¨×× ××××××× ×××©×¨×× ×× ×××× ×¨×××× ×××. ×× ×××¡××××, ××ª××××¨××ª ×××©××¨××ª×× ×©×× â ×××§×× ×××.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                  <span className="text-sm">f</span>
                </a>
                <a href="#" className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition">
                  <span className="text-sm">in</span>
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold mb-4 text-sm">××××¦×¨</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">×ª××× ××ª</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">××× ×× ×¢×××</a></li>
                <li><a href="#garages" className="hover:text-white transition">××××¡×××</a></li>
                <li><a href="#" className="hover:text-white transition">×ª××××¨</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4 text-sm">××©×¤××</h4>
              <ul className="space-y-2.5 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">×ª× ×× ×©××××©</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">×××× ×××ª ×¤×¨××××ª</Link></li>
                <li><Link href="/warranty" className="hover:text-white transition">×××¨×××ª ××××§××ª</Link></li>
                <li><Link href="/accessibility" className="hover:text-white transition">× ×××©××ª</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-4 text-sm">×¦××¨ ×§×©×¨</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <Mail size={14} />
                  <span>info@autolog.click</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} />
                  <span dir="ltr">+972-2-999-9999</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>××©×¨××</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2026 AutoLog. ×× ×××××××ª ×©×××¨××ª.</p>
            <p className="text-gray-600 text-xs">× ×× × ××××× ×××©×¨××</p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for animations */}
      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
                      }
