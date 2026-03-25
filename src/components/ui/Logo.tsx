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
      <svg
        width={s.shield}
        height={s.shield}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M100 10L20 45V110C20 155 55 180 100 195V10Z" fill="#1a3a5c"/>
        <path d="M100 10L180 45V110C180 155 145 180 100 195V10Z" fill="#2a9d9e"/>
        <g transform="translate(100, 108)">
          <path d="M-48 15 L-45 -5 C-43 -12 -35 -18 -25 -20 L-20 -22 C-15 -38 -8 -42 0 -42 C8 -42 15 -38 20 -22 L25 -20 C35 -18 43 -12 45 -5 L48 15 L48 22 C48 25 46 27 43 27 L-43 27 C-46 27 -48 25 -48 22 Z" fill="white"/>
          <path d="M-18 -20 C-13 -35 -7 -38 0 -38 C7 -38 13 -35 18 -20 Z" fill="#1a3a5c" opacity="0.3"/>
          <ellipse cx="-35" cy="-2" rx="8" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="-35" cy="-2" rx="5" ry="4" fill="#1a3a5c" opacity="0.2"/>
          <ellipse cx="35" cy="-2" rx="8" ry="6" fill="white" opacity="0.9"/>
          <ellipse cx="35" cy="-2" rx="5" ry="4" fill="#2a9d9e" opacity="0.2"/>
          <rect x="-12" y="-2" width="24" height="10" rx="3" fill="#1a3a5c" opacity="0.15"/>
          <line x1="-8" y1="0" x2="-8" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
          <line x1="-3" y1="0" x2="-3" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
          <line x1="2" y1="0" x2="2" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
          <line x1="7" y1="0" x2="7" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
          <path d="M-42 15 L42 15 L38 22 L-38 22 Z" fill="white" opacity="0.7"/>
        </g>
      </svg>

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
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M100 10L20 45V110C20 155 55 180 100 195V10Z" fill="#1a3a5c"/>
      <path d="M100 10L180 45V110C180 155 145 180 100 195V10Z" fill="#2a9d9e"/>
      <g transform="translate(100, 108)">
        <path d="M-48 15 L-45 -5 C-43 -12 -35 -18 -25 -20 L-20 -22 C-15 -38 -8 -42 0 -42 C8 -42 15 -38 20 -22 L25 -20 C35 -18 43 -12 45 -5 L48 15 L48 22 C48 25 46 27 43 27 L-43 27 C-46 27 -48 25 -48 22 Z" fill="white"/>
        <path d="M-18 -20 C-13 -35 -7 -38 0 -38 C7 -38 13 -35 18 -20 Z" fill="#1a3a5c" opacity="0.3"/>
        <ellipse cx="-35" cy="-2" rx="8" ry="6" fill="white" opacity="0.9"/>
        <ellipse cx="-35" cy="-2" rx="5" ry="4" fill="#1a3a5c" opacity="0.2"/>
        <ellipse cx="35" cy="-2" rx="8" ry="6" fill="white" opacity="0.9"/>
        <ellipse cx="35" cy="-2" rx="5" ry="4" fill="#2a9d9e" opacity="0.2"/>
        <rect x="-12" y="-2" width="24" height="10" rx="3" fill="#1a3a5c" opacity="0.15"/>
        <line x1="-8" y1="0" x2="-8" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        <line x1="-3" y1="0" x2="-3" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        <line x1="2" y1="0" x2="2" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        <line x1="7" y1="0" x2="7" y2="6" stroke="white" strokeWidth="0.8" opacity="0.5"/>
        <path d="M-42 15 L42 15 L38 22 L-38 22 Z" fill="white" opacity="0.7"/>
      </g>
    </svg>
  );
}

