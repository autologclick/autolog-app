'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  dark?: boolean;
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
      {/* Shield - left half (dark navy) */}
      <path
        d="M100 8 L28 44 C22 47, 18 54, 18 60 L18 122 C18 168, 52 202, 100 220 L100 8Z"
        fill="#1a2d4a"
      />
      {/* Shield - right half (teal) */}
      <path
        d="M100 8 L172 44 C178 47, 182 54, 182 60 L182 122 C182 168, 148 202, 100 220 L100 8Z"
        fill="#1a8a7d"
      />
      {/* Shield inner highlight */}
      <path
        d="M100 16 L34 48 C30 50, 26 56, 26 60 L26 120 C26 162, 56 194, 100 210 C144 194, 174 162, 174 120 L174 60 C174 56, 170 50, 166 48 Z"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.08"
      />

      {/* Car silhouette */}
      <g transform="translate(100, 118)">
        <path
          d="M-52 0 L-46 -18 C-42 -28, -34 -32, -26 -34 L-18 -36 C-12 -50, -6 -56, 0 -56 C6 -56, 12 -50, 18 -36 L26 -34 C34 -32, 42 -28, 46 -18 L52 0 L54 12 C54 18, 50 22, 44 22 L-44 22 C-50 22, -54 18, -54 12 Z"
          fill="#0a1628"
          opacity="0.85"
        />
        <path
          d="M-24 -34 L-16 -48 C-10 -54, -4 -56, 0 -56 C4 -56, 10 -54, 16 -48 L24 -34 Z"
          fill="white"
          opacity="0.12"
        />
        <path
          d="M-18 -44 C-12 -52, -6 -56, 0 -56 C6 -56, 12 -52, 18 -44"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.25"
        />
        <rect x="-46" y="-16" width="14" height="6" rx="2" fill="#4dd8c0" opacity="0.45"/>
        <rect x="32" y="-16" width="14" height="6" rx="2" fill="#4dd8c0" opacity="0.45"/>
        <rect x="-16" y="-16" width="32" height="8" rx="3" fill="#0a1628" opacity="0.5"/>
        <path
          d="M-44 12 L44 12 L38 20 C36 22, 30 22, 26 22 L-26 22 C-30 22, -36 22, -38 20 Z"
          fill="#0a1628"
          opacity="0.5"
        />
        <ellipse cx="-54" cy="-22" rx="4" ry="3" fill="#0a1628" opacity="0.7"/>
        <ellipse cx="54" cy="-22" rx="4" ry="3" fill="#0a1628" opacity="0.7"/>
      </g>
    </svg>
  );
}
export default function Logo({ size = 'md', className = '', linkToHome = false }: LogoProps) {
  const sizes = {
    sm: { shield: 28 },
    md: { shield: 40 },
    lg: { shield: 56 },
    xl: { shield: 72 },
  };

  const s = sizes[size];

  const content = (
    <div className={`flex items-center ${className}`}>
      <LogoSvg shieldSize={s.shield} />
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
