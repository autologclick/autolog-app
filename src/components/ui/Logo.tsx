'use client';

import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  dark?: boolean;
  /** If true, logo is wrapped in a Link to homepage */
  linkToHome?: boolean;
}

function LogoImage({ shieldSize }: { shieldSize: number }) {
  return (
    <Image
      src="/logo.png"
      alt="AutoLog"
      width={shieldSize}
      height={shieldSize}
      priority
      style={{ width: shieldSize, height: 'auto', objectFit: 'contain' }}
    />
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
    <div className={`flex items-center ${className}`} dir="ltr">
      <LogoImage shieldSize={s.shield} />
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
      <LogoImage shieldSize={size} />
    </div>
  );
}
