import type { SVGProps } from 'react';

interface ShekelSignProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number | string;
}

/**
 * Shekel sign icon — drop-in replacement for Lucide's <DollarSign />.
 *
 * Same prop signature (size, className, ...rest) so it works anywhere a
 * Lucide icon does. The path is a stroked ₪ glyph (Hebrew shekel sign,
 * U+20AA) drawn on Lucide's 24x24 viewBox with the same stroke width
 * (2px) and line caps so it matches visually alongside other icons.
 *
 * We can't use the literal Unicode ₪ in an SVG path because we need
 * stroke-based rendering to match Lucide's style. So we hand-draw it
 * with two vertical strokes (left and right legs) plus the top and
 * middle crossbars.
 */
export default function ShekelSign({
  size = 24,
  strokeWidth = 2,
  ...rest
}: ShekelSignProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {/* Right vertical with top hook */}
      <path d="M17 4v14a2 2 0 0 1-2 2h-2" />
      {/* Top horizontal connecting both legs */}
      <path d="M7 4h10" />
      {/* Left vertical with bottom hook */}
      <path d="M7 4v12a2 2 0 0 0 2 2h2v-8" />
    </svg>
  );
}
