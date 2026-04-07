'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Car, Wrench, FileText, Receipt, Calendar, MapPin } from 'lucide-react';

interface SearchResult {
  type: 'vehicle' | 'treatment' | 'document' | 'expense' | 'appointment' | 'garage';
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        // Search across multiple endpoints
        const [vehicles, treatments] = await Promise.all([
          fetch('/api/vehicles').then(r => r.json()).catch(() => ({ vehicles: [] })),
          fetch('/api/treatments').then(r => r.json()).catch(() => ({ treatments: [] })),
        ]);

        const q = query.toLowerCase();
        const matched: SearchResult[] = [];

        // Search vehicles
        (vehicles.vehicles || []).forEach((v: { id: string; nickname: string; manufacturer: string; model: string; licensePlate: string }) => {
          if (
            v.nickname?.toLowerCase().includes(q) ||
            v.manufacturer?.toLowerCase().includes(q) ||
            v.model?.toLowerCase().includes(q) ||
            v.licensePlate?.includes(q)
          ) {
            matched.push({
              type: 'vehicle',
              title: v.nickname || `${v.manufacturer} ${v.model}`,
              subtitle: v.licensePlate,
              href: `/user/vehicles/${v.id}`,
              icon: <Car size={16} />,
              iconBg: 'bg-teal-50 text-teal-600',
            });
          }
        });

        // Search treatments
        (treatments.treatments || []).forEach((t: { id: string; title: string; garageName?: string; date: string }) => {
          if (
            t.title?.toLowerCase().includes(q) ||
            t.garageName?.toLowerCase().includes(q)
          ) {
            matched.push({
              type: 'treatment',
              title: t.title,
              subtitle: t.garageName || new Date(t.date).toLocaleDateString('he-IL'),
              href: '/user/treatments',
              icon: <Wrench size={16} />,
              iconBg: 'bg-blue-50 text-blue-600',
            });
          }
        });

        setResults(matched.slice(0, 8));
      } catch {
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        aria-label="חיפוש"
      >
        <Search size={18} className="text-white" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="bg-white mx-4 mt-16 rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden animate-card-appear"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search size={20} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש רכב, טיפול, מוסך..."
            className="flex-1 text-sm outline-none text-[#1e3a5f] placeholder:text-gray-300 font-medium"
          />
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[50vh]">
          {loading ? (
            <div className="p-6 text-center text-sm text-gray-400">מחפש...</div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <button
                key={i}
                onClick={() => { router.push(r.href); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-right"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${r.iconBg}`}>
                  {r.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#1e3a5f] truncate">{r.title}</div>
                  <div className="text-xs text-gray-400 truncate">{r.subtitle}</div>
                </div>
              </button>
            ))
          ) : query.trim() ? (
            <div className="p-6 text-center text-sm text-gray-400">לא נמצאו תוצאות</div>
          ) : (
            <div className="p-6 text-center">
              <Search size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">חפש רכבים, טיפולים ומוסכים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
