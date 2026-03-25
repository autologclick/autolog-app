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
      height={shieldSize * 1.15}
      viewBox="0 0 200 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield - left half (navy) */}
      <path
        d="M100 10 L30 45 C25 47, 22 52, 22 58 L22 120 C22 165, 55 198, 100 215 C145 198, 178 165, 178 120 L178 58 C178 52, 175 47, 170 45 Z"
        fill="#1e3a5f"
      />
      {/* Shield - right half (teal) */}
      <path
        d="M100 10 L170 45 C175 47, 178 52, 178 58 L178 120 C178 165, 145 198, 100 215 V10Z"
        fill="#0d9488"
      />
      {/* Inner border glow */}
      <path
        d="M100 18 L38 48 C35 50, 32 54, 32 58 L32 118 C32 158, 60 188, 100 205 C140 188, 168 158, 168 118 L168 58 C168 54, 165 50, 162 48 Z"
        fill="none"
        stroke="white"
        strokeWidth="0.8"
        opacity="0.1"
      />

      {/* Car - front view */}
      <g transform="translate(100, 120)">
        {/* Car roof arc */}
        <path
          d="M-22 -48 C-16 -58, -8 -62, 0 -62 C8 -62, 16 -58, 22 -48"
          fill="none"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Windshield glass */}
        <path
          d="M-30 -32 L-20 -46 C-14 -56, -6 -58, 0 -58 C6 -58, 14 -56, 20 -46 L30 -32 Z"
          fill="white"
          opacity="0.18"
        />
        {/* Car body */}
        <path
          d="M-55 -2 L-50 -22 C-46 -30, -40 -32, -30 -32 L30 -32 C40 -32, 46 -30, 50 -22 L55 -2 L56 10 C56 16, 52 20, 46 20 L-46 20 C-52 20, -56 16, -56 10 Z"
          fill="white"
        />
        {/* Hood crease */}
        <path
          d="M-38 -22 C-20 -24, 20 -24, 38 -22"
          fill="none"
          stroke="#1e3a5f"
          strokeWidth="0.6"
          opacity="0.12"
        />
        {/* Left headlight */}
        <path d="M-50 -16 C-50 -20, -48 -22, -44 -22 L-30 -22 L-30 -2 L-50 -2 Z" fill="white"/>
        <path d="M-47 -14 C-47 -18, -45 -20, -42 -20 L-33 -20 L-33 -4 L-47 -4 Z" fill="#0d9488" opacity="0.3"/>
        <rect x="-46" y="-18" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
        {/* Right headlight */}
        <path d="M50 -16 C50 -20, 48 -22, 44 -22 L30 -22 L30 -2 L50 -2 Z" fill="white"/>
        <path d="M47 -14 C47 -18, 45 -20, 42 -20 L33 -20 L33 -4 L47 -4 Z" fill="#0d9488" opacity="0.3"/>
        <rect x="34" y="-18" width="12" height="2" rx="1" fill="white" opacity="0.7"/>
        {/* Grille */}
        <rect x="-22" y="-20" width="44" height="8" rx="3" fill="#1e3a5f" opacity="0.1"/>
        <line x1="-18" y1="-17" x2="18" y2="-17" stroke="white" strokeWidth="1.2" opacity="0.25"/>
        <line x1="-18" y1="-14" x2="18" y2="-14" stroke="white" strokeWidth="1.2" opacity="0.25"/>
        {/* Logo badge */}
        <circle cx="0" cy="-16" r="3.5" fill="white" opacity="0.35"/>
        {/* Lower air intake */}
        <rect x="-26" y="-4" width="52" height="10" rx="5" fill="#1e3a5f" opacity="0.08"/>
        {/* Bumper */}
        <path
          d="M-46 10 L46 10 L40 18 C38 20, 34 20, 30 20 L-30 20 C-34 20, -38 20, -40 18 Z"
          fill="white"
          opacity="0.45"
        />
        {/* Fog lights */}
        <rect x="-40" y="4" width="8" height="4" rx="2" fill="#0d9488" opacity="0.2"/>
        <rect x="32" y="4" width="8" height="4" rx="2" fill="#0d9488" opacity="0.2"/>
        {/* Side mirrors */}
        <ellipse cx="-56" cy="-24" rx="5" ry="4" fill="white" opacity="0.75"/>
        <ellipse cx="56" cy="-24" rx="5" ry="4" fill="white" opacity="0.75"/>
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
