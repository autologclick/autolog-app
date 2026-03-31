'use client';

import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function LogoIcon({ size = 40, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <clipPath id="logoLeftHalf">
          <rect x="0" y="0" width="50" height="110" />
        </clipPath>
        <clipPath id="logoRightHalf">
          <rect x="50" y="0" width="50" height="110" />
        </clipPath>
      </defs>

      {/* Shield left half - dark navy */}
      <path
        d="M15,10 Q15,0 25,0 L75,0 Q85,0 85,10 L85,58 Q85,78 50,98 Q15,78 15,58 Z"
        clipPath="url(#logoLeftHalf)"
        fill="#1a3a5c"
      />

      {/* Shield right half - teal */}
      <path
        d="M15,10 Q15,0 25,0 L75,0 Q85,0 85,10 L85,58 Q85,78 50,98 Q15,78 15,58 Z"
        clipPath="url(#logoRightHalf)"
        fill="#3ab3a9"
      />

      {/* White car body - sedan side view facing left */}
      <path
        d="M23,66 L23,58 Q23,55 26,53 L33,50 Q37,48 39,44 L43,36 Q45,32 49,31 L64,31 Q68,31 70,34 L73,40 Q74,42 77,43 L79,44 Q81,45 81,48 L81,58 L81,66 Z"
        fill="white"
      />

      {/* Front wheel cutout - shows shield color behind */}
      <circle cx="35" cy="66" r="8" clipPath="url(#logoLeftHalf)" fill="#1a3a5c" />
      <circle cx="35" cy="66" r="8" clipPath="url(#logoRightHalf)" fill="#3ab3a9" />

      {/* Rear wheel cutout */}
      <circle cx="71" cy="66" r="8" clipPath="url(#logoLeftHalf)" fill="#1a3a5c" />
      <circle cx="71" cy="66" r="8" clipPath="url(#logoRightHalf)" fill="#3ab3a9" />

      {/* Front windshield */}
      <path
        d="M41,49 L45,37 Q46,34 48,33 L55,33 L55,49 Z"
        fill="rgba(26,58,92,0.3)"
      />

      {/* Rear window */}
      <path
        d="M58,49 L58,33 L63,33 Q66,33 67,35 L70,42 L70,49 Z"
        fill="rgba(26,58,92,0.3)"
      />

      {/* Window divider pillar */}
      <line x1="56.5" y1="33" x2="56.5" y2="49" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}

export default function Logo({ size = 40, className = '' }: LogoProps) {
  return <LogoIcon size={size} className={className} />;
}
