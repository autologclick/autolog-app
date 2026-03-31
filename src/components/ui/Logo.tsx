'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoIconProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 40, className = '' }: LogoIconProps) {
  return (
    <Image
      src="/logo-icon.png"
      alt="AutoLog"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      priority
    />
  );
}

type LogoSize = 'sm' | 'md' | 'lg' | 'xl';

interface LogoProps {
  size?: LogoSize;
  dark?: boolean;
  className?: string;
  linkToHome?: boolean;
  showText?: boolean;
}

const sizeMap: Record<LogoSize, { shield: number; text: string; gap: string }> = {
  sm: { shield: 28, text: 'text-lg', gap: 'gap-1.5' },
  md: { shield: 40, text: 'text-xl', gap: 'gap-2' },
  lg: { shield: 56, text: 'text-3xl', gap: 'gap-3' },
  xl: { shield: 72, text: 'text-4xl', gap: 'gap-4' },
};

export default function Logo({
  size = 'md',
  dark = false,
  className = '',
  linkToHome = false,
  showText = true,
}: LogoProps) {
  const { shield, text, gap } = sizeMap[size];

  const content = (
    <div className={`flex items-center ${gap} ${className}`}>
      <LogoIcon size={shield} />
      {showText && (
        <span className={`font-bold ${text} ${dark ? 'text-white' : 'text-gray-800'}`}>
          AutoLog
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/dashboard" className="flex items-center no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
