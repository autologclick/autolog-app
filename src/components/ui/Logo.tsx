'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  dark?: boolean;
  /** If true, logo is wrapped in a Link to homepage */
  linkToHome?: boolean;
}

function LogoSvg({ shieldSize }: { shieldSize: number }) {
  return (
    <svg
      width={shieldSize}
      height={shieldSize}
      viewBox="0 0 200 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield - left half (dark navy) */}
      <path
        d="M100 8 C100 8, 18 40, 18 40 L18 120 C18 170, 55 200, 100 218 V8Z"
        fill="#1a3a5c"
      />
      {/* Shield - right half (teal) */}
      <path
        d="M100 8 C100 8, 182 40, 182 40 L182 120 C182 170, 145 200, 100 218 V8Z"
        fill="#2a9d9e"
      />
      {/* Car - front view */}
      <g transform="translate(100, 125)">
        {/* Car body - main shape */}
        <path
          d="M-52 10 L-48 -8 C-44 -18, -36 -22, -28 -24 L-22 -26 C-16 -44, -9 -50, 0 -50 C9 -50, 16 -44, 22 -26 L28 -24 C36 -22, 44 -18, 48 -8 L52 10 L52 20 C52 24, 50 26, 46 26 L-46 26 C-50 26, -52 24, -52 20 Z"
          fill="white"
        />
        {/* Windshield */}
        <path
          d="M-20 -24 C-14 -42, -8 -46, 0 -46 C8 -46, 14 -42, 20 -24 L16 -22 C12 -36, 7 -40, 0 -40 C-7 -40, -12 -36, -16 -22 Z"
          fill="#1a3a5c"
          opacity="0.25"
        />
        {/* Left headlight */}
        <rect x="-44" y="-8" width="16" height="10" rx="3" fill="white" opacity="0.85"/>
        <rect x="-42" y="-6" width="12" height="6" rx="2" fill="#1a3a5c" opacity="0.15"/>
        {/* Right headlight */}
        <rect x="28" y="-8" width="16" height="10" rx="3" fill="white" opacity="0.85"/>
        <rect x="30" y="-6" width="12" height="6" rx="2" fill="#2a9d9e" opacity="0.15"/>
        {/* Grille */}
        <rect x="-14" y="-6" width="28" height="12" rx="4" fill="#1a3a5c" opacity="0.12"/>
        <line x1="-8" y1="-4" x2="-8" y2="4" stroke="white" strokeWidth="1" opacity="0.4"/>
        <line x1="-3" y1="-4" x2="-3" y2="4" stroke="white" strokeWidth="1" opacity="0.4"/>
        <line x1="2" y1="-4" x2="2" y2="4" stroke="white" strokeWidth="1" opacity="0.4"/>
        <line x1="7" y1="-4" x2="7" y2="4" stroke="white" strokeWidth="1" opacity="0.4"/>
        {/* Bumper */}
        <path d="M-46 14 L46 14 L42 22 L-42 22 Z" fill="white" opacity="0.6"/>
      </g>
    </svg>
  );
}

export default function Logo({ size = 'md', showText = true, className = '', dark = false, linkToHome = false }: LogoProps) {
  const sizes = {
    sm: { shield: 28, text: 'text-lg', gap: 'gap-1.5' },
    md: { shield: 40, text: 'text-xl', gap: 'gap-2' },
    lg: { shield: 56, text: 'text-3xl', gap: 'gap-3' },
    xl: { shield: 72, text: 'text-4xl', gap: 'gap-4' },
  };

  const s = sizes[size];

  const content = (
    <div className={`flex items-center ${s.gap} ${className}`} dir="ltr">
      <LogoSvg shieldSize={s.shield} />
      {showText && (
        <span className={`${s.text} font-extrabold tracking-tight`}>
          <span className={dark ? 'text-white' : 'text-[#0fbcce]'}>Auto</span>
          <span className={dark ? 'text-teal-300' : 'text-[#0ea5a0]'}>Log</span>
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export function LogoIcon({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={className}>
      <LogoSvg shieldSize={size} />
    </div>
  );
}
