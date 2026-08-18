interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * HomeForge logomark — a geometric tabletop-on-anvil silhouette rendered as
 * inline SVG. Monochrome via currentColor so it adapts to light/dark theme
 * and any text color context. Designed to hold up at 24px (header) and
 * 200px (marketing / favicon-scale contexts).
 */
export function Logo({ className, size = 24 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HomeForge logomark"
      role="img"
      className={className}
    >
      {/* Tabletop slab */}
      <rect x="3" y="7" width="26" height="5" rx="1.5" fill="currentColor" />
      {/* Splayed legs, echoing an anvil/forge stance */}
      <path d="M8 12L5 26H9L11.5 12H8Z" fill="currentColor" />
      <path d="M24 12L27 26H23L20.5 12H24Z" fill="currentColor" />
      {/* Kiln spark / accent notch at center */}
      <path d="M14.5 12L16 16.5L17.5 12H14.5Z" fill="currentColor" />
    </svg>
  );
}
