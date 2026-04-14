export const dynamic = 'force-dynamic';

async function getStatus() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/maintenance-status`, {
      cache: 'no-store',
    });
    if (!res.ok) return { enabled: false, message: '' };
    return (await res.json()) as { enabled: boolean; message: string };
  } catch {
    return { enabled: false, message: '' };
  }
}

export default async function MaintenancePage() {
  const status = await getStatus();
  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
        <div className="text-6xl">🛠️</div>
        <h1 className="text-2xl font-bold text-gray-900">המערכת בתחזוקה</h1>
        <p className="text-gray-600">
          {status.message || 'אנו עובדים על שיפור המערכת. נחזור בקרוב!'}
        </p>
        <p className="text-sm text-gray-500">AutoLog · autolog.click</p>
      </div>
    </div>
  );
}
