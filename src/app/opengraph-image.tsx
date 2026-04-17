import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'AutoLog - ניהול רכבים חכם';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1a3a5c 0%, #1e4a6e 50%, #2a7a8e 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          direction: 'rtl',
        }}
      >
        {/* Top accent bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#2a9d9e', display: 'flex' }} />

        {/* Main card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 24,
            padding: '60px 80px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: 900,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          {/* Shield icon */}
          <div style={{ display: 'flex', marginBottom: 20 }}>
            <svg width="80" height="92" viewBox="0 0 200 230" fill="none">
              <path d="M100 8 C100 8, 18 40, 18 40 L18 120 C18 170, 55 200, 100 218 V8Z" fill="#1a3a5c"/>
              <path d="M100 8 C100 8, 182 40, 182 40 L182 120 C182 170, 145 200, 100 218 V8Z" fill="#2a9d9e"/>
            </svg>
          </div>

          {/* Title */}
          <div style={{ fontSize: 72, fontWeight: 800, color: '#1a3a5c', display: 'flex' }}>
            AutoLog
          </div>

          {/* Teal divider */}
          <div style={{ width: 160, height: 5, background: '#2a9d9e', borderRadius: 3, marginTop: 16, marginBottom: 16, display: 'flex' }} />

          {/* Subtitle */}
          <div style={{ fontSize: 30, color: '#4a5568', display: 'flex', marginBottom: 30 }}>
            ניהול רכבים חכם — בחינם
          </div>

          {/* Feature pills */}
          <div style={{ display: 'flex', gap: 16 }}>
            {['תזכורות', 'ביטוח', 'בדיקות', 'מוסכים'].map((feat) => (
              <div
                key={feat}
                style={{
                  padding: '8px 24px',
                  borderRadius: 20,
                  border: '2px solid #2a9d9e',
                  color: '#2a9d9e',
                  fontSize: 20,
                  fontWeight: 600,
                  display: 'flex',
                }}
              >
                {feat}
              </div>
            ))}
          </div>
        </div>

        {/* Domain */}
        <div style={{ position: 'absolute', bottom: 30, left: 60, fontSize: 24, fontWeight: 700, color: '#2a9d9e', display: 'flex' }}>
          autolog.click
        </div>

        {/* Bottom accent bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: '#2a9d9e', display: 'flex' }} />
      </div>
    ),
    { ...size }
  );
}
