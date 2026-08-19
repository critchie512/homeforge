import type { CSSProperties } from "react";

interface LogoProps {
  className?: string;
  size?: number;
  style?: CSSProperties;
}

/**
 * NestForge Studio logomark — an interlocking chevron/diamond mark, matched
 * to the mark used on the real pre-ship qualification sticker artwork the
 * product owner provided (two offset angular strokes nesting into a
 * diamond silhouette — read as both "N" and a forged/interlocked joint).
 * Monochrome via currentColor so it adapts to light/dark theme and any
 * text color context. Designed to hold up at 24px (header) and 200px
 * (marketing / favicon-scale contexts).
 */
export function Logo({ className, size = 24, style }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="NestForge Studio logomark"
      role="img"
      className={className}
      style={style}
    >
      {/* Outer interlocking bracket — upper-right to lower-left stroke */}
      <path
        d="M10 4L24 4C25.1 4 26 4.9 26 6V14L21 14V9L15 9L28 22V28C28 29.1 27.1 30 26 30"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner interlocking bracket — mirrored, offset to nest with the outer one */}
      <path
        d="M22 28L8 28C6.9 28 6 27.1 6 26V18L11 18V23L17 23L4 10V4C4 2.9 4.9 2 6 2"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
