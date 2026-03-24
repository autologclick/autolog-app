'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  dark?: boolean;
}

export default function Logo({ size = 'md', showText = true, className = '', dark = false }: LogoProps) {
  const sizes = {
    sm: { shield: 28, text: 'text-lg', gap: 'gap-1.5' },
    md: { shield: 40, text: 'text-xl', gap: 'gap-2' },
    lg: { shield: 56, text: 'text-3xl', gap: 'gap-3' },
    xl: { shield: 72, text: 'text-4xl', gap: 'gap-4' },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`} dir="ltr">
      {/* Shield Icon */}
      <svg
        width={s.shield}
        height={s.shield}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield - left half (dark navy) */}
        <path
          d="M50 4L12 20V54C12 76 30 92 50 100V4Z"
          fill="#1e3a5f"
        />
        {/* Shield - right half (teal) */}
        <path
          d="M50 4L88 20V54C88 76 70 92 50 100V4Z"
          fill="#0d7377"
        />
        {/* Car silhouette */}
        <g transform="translate(18, 28)">
          {/* Car body outline */}
          <path
            d="M8 30L12 20H52L56 30"
            stroke="#c0dce8"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Car roof */}
          <path
            d="M18 20L24 8H40L46 20"
            stroke="#c0dce8"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Car bottom */}
          <path
            d="M4 32H60"
            stroke="#c0dce8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Front windshield divider */}
          <line x1="32" y1="8" x2="32" y2="20" stroke="#c0dce8" strokeWidth="1.5" />
          {/* Wheels */}
          <circle cx="18" cy="34" r="5" fill="#c0dce8" />
          <circle cx="18" cy="34" r="2.5" fill="#1e3a5f" />
          <circle cx="46" cy="34" r="5" fill="#c0dce8" />
          <circle cx="46" cy="34" r="2.5" fill="#0d7377" />
        </g>
      </svg>

      {/* Text */}
      {showText && (
        <span className={`${s.text} font-extrabold tracking-tight`}>
          <span className={dark ? 'text-white' : 'text-[#0fbcce]'}>Auto</span>
          <span className={dark ? 'text-teal-300' : 'text-[#0ea5a0]'}>Log</span>
        </span>
      )}
    </div>
  );
}

export function LogoIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M50 4L12 20V54C12 76 30 92 50 100V4Z" fill="#1e3a5f" />
      <path d="M50 4L88 20V54C88 76 70 92 50 100V4Z" fill="#0d7377" />
      <g transform="translate(18, 28)">
        <path d="M8 30L12 20H52L56 30" stroke="#c0dce8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 20L24 8H40L46 20" stroke="#c0dce8" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 32H60" stroke="#c0dce8" strokeWidth="3" strokeLinecap="round" />
        <line x1="32" y1="8" x2="32" y2="20" stroke="#c0dce8" strokeWidth="1.5" />
        <circle cx="18" cy="34" r="5" fill="#c0dce8" />
        <circle cx="18" cy="34" r="2.5" fill="#1e3a5f" />
        <circle cx="46" cy="34" r="5" fill="#c0dce8" />
        <circle cx="46" cy="34" r="2.5" fill="#0d7377" />
      </g>
    </svg>
  );
}
