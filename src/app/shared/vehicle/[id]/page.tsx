'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface VehicleData {
  manufacturer: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string | null;
  mileage: number | null;
  testExpiryDate: string | null;
  testStatus: string;
  insuranceStatus: string;
  createdAt: string;
}

interface TimelineItem {
  type: 'inspection' | 'service';
  date: string;
  title: string;
  score?: number;
  mileage?: number;
  summary?: string;
  mechanic?: string;
  garage?: string;
  city?: string;
  notes?: string;
  inspectionId?: string;
}

interface HistoryData {
  vehicle: VehicleData;
  timeline: TimelineItem[];
  totalInspections: number;
  totalServices: number;
  generatedAt: string;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
  return <span className={score + ' px-2.5 py-1 rounded-full text-sm font-bold ' + color}>{score}/100</span>;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    valid: 'bg-green-500',
    expiring: 'bg-yellow-500',
    expired: 'bg-red-500',
  };
  return <span className={'inline-block w-2.5 h-2.5 rounded-full ' + (colors[status] || 'bg-gray-400')} />;
}

export default function SharedVehicleHistoryPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/public/vehicle-history/' + params.id)
      .then((res) => {
        if (!res.ok) throw new Error('not found');
        return res.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">\u05d8\u05d5\u05e2\u05df \u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d9\u05ea \u05e8\u05db\u05d1...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">\u05e8\u05db\u05d1 \u05dc\u05d0 \u05e0\u05de\u05e6\u05d0</h1>
          <p className="text-gray-500">\u05d4\u05e7\u05d9\u05e9\u05d5\u05e8 \u05dc\u05d0 \u05ea\u05e7\u05d9\u05df \u05d0\u05d5 \u05e9\u05d4\u05e8\u05db\u05d1 \u05d4\u05d5\u05e1\u05e8</p>
        </div>
      </div>
    );
  }

  const v = data.vehicle;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(shareUrl);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-sm font-medium opacity-90">\u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d9\u05ea \u05e8\u05db\u05d1 \u05de\u05d0\u05d5\u05de\u05ea\u05ea</span>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">AutoLog</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">{v.manufacturer} {v.model} {v.year}</h1>
          <p className="text-blue-200 text-lg font-mono">{v.licensePlate}</p>
          {v.color && <p className="text-blue-200 text-sm mt-1">\u05e6\u05d1\u05e2: {v.color}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{data.totalInspections}</p>
            <p className="text-xs text-gray-500">\u05d1\u05d3\u05d9\u05e7\u05d5\u05ea</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{data.totalServices}</p>
            <p className="text-xs text-gray-500">\u05d8\u05d9\u05e4\u05d5\u05dc\u05d9\u05dd</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-gray-700">{v.mileage ? v.mileage.toLocaleString() : '-'}</p>
            <p className="text-xs text-gray-500">\u05e7\"\u05de \u05d0\u05d7\u05e8\u05d5\u05df</p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold text-gray-900 mb-3">\u05e1\u05d8\u05d8\u05d5\u05e1 \u05e0\u05d5\u05db\u05d7\u05d9</h2>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <StatusDot status={v.testStatus} />
              <span className="text-sm text-gray-700">\u05d8\u05e1\u05d8: {v.testStatus === 'valid' ? '\u05ea\u05e7\u05d9\u05e3' : v.testStatus === 'expiring' ? '\u05e2\u05d5\u05de\u05d3 \u05dc\u05e4\u05d5\u05d2' : '\u05e4\u05d2'}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={v.insuranceStatus} />
              <span className="text-sm text-gray-700">\u05d1\u05d9\u05d8\u05d5\u05d7: {v.insuranceStatus === 'valid' ? '\u05ea\u05e7\u05d9\u05e3' : v.insuranceStatus === 'expiring' ? '\u05e2\u05d5\u05de\u05d3 \u05dc\u05e4\u05d5\u05d2' : '\u05e4\u05d2'}</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">\u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d9\u05ea \u05d8\u05d9\u05e4\u05d5\u05dc\u05d9\u05dd</h2>
          {data.timeline.length === 0 ? (
            <div className="bg-white rounded-xl border p-8 text-center text-gray-400">
              <p>\u05d0\u05d9\u05df \u05e2\u05d3\u05d9\u05d9\u05df \u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d4 \u05dc\u05e8\u05db\u05d1 \u05d6\u05d4</p>
            </div>
          ) : (
            <div className="space-y-0">
              {data.timeline.map((item, i) => (
                <div key={i} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={'w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ' + (item.type === 'inspection' ? 'bg-teal-500' : 'bg-blue-500')} />
                    {i < data.timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  {/* Card */}
                  <div className="bg-white rounded-xl border p-4 mb-3 flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      {item.score !== undefined && item.score !== null && <ScoreBadge score={item.score} />}
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(item.date).toLocaleDateString('he-IL')}
                      {item.garage && <span> \u00b7 {item.garage}</span>}
                      {item.city && <span>, {item.city}</span>}
                    </p>
                    {item.mileage && <p className="text-xs text-gray-500 mb-1">\u05e7\"\u05de: {item.mileage.toLocaleString()}</p>}
                    {item.summary && <p className="text-sm text-gray-600">{item.summary}</p>}
                    {item.notes && <p className="text-sm text-gray-600">{item.notes}</p>}
                    {item.inspectionId && (
                      <Link
                        href={'/inspection/' + item.inspectionId}
                        className="inline-block mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        \u05e6\u05e4\u05d4 \u05d1\u05d3\u05d5\"\u05d7 \u05de\u05dc\u05d0 \u2190
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* QR Code & Share */}
        <div className="bg-white rounded-xl border p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-3">\u05e9\u05ea\u05e3 \u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d4</h3>
          <p className="text-sm text-gray-500 mb-4">\u05e1\u05e8\u05d5\u05e7 \u05d0\u05ea \u05d4-QR \u05d0\u05d5 \u05d4\u05e2\u05ea\u05e7 \u05d0\u05ea \u05d4\u05e7\u05d9\u05e9\u05d5\u05e8</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="QR Code"
            className="w-40 h-40 mx-auto mb-4 rounded-lg"
            width={160}
            height={160}
          />
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: v.manufacturer + ' ' + v.model + ' - \u05d4\u05d9\u05e1\u05d8\u05d5\u05e8\u05d9\u05d9\u05ea \u05e8\u05db\u05d1', url: shareUrl });
              } else {
                navigator.clipboard.writeText(shareUrl);
              }
            }}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            \u05e9\u05ea\u05e3 \u05e7\u05d9\u05e9\u05d5\u05e8
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            \u05d4\u05d5\u05e4\u05e7 \u05e2\"\u05d9 AutoLog \u00b7 {new Date(data.generatedAt).toLocaleDateString('he-IL')}
          </p>
          <Link href="/" className="text-xs text-blue-500 hover:underline">
            \u05d4\u05d9\u05e8\u05e9\u05dd \u05dc-AutoLog \u05d1\u05d7\u05d9\u05e0\u05dd
          </Link>
        </div>
      </div>
    </div>
  );
}
