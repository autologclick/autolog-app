'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 40, className = '' }: LogoProps) {
  return (
    <Image
      src="/images/logo-icon.png"
      alt="AutoLog"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return <LogoIcon size={size} className={className} />;
}
