/**
 * RenriMark — The RENRI brand icon (Hub Concept).
 *
 * Central point with 3 satellites, representing connections.
 * Pure SVG, no dependencies. Renders in dark or light theme
 * with a Verde Salvia accent colour.
 */

interface RenriMarkProps {
  /** Pixel width & height (the viewBox is always 100×100). */
  size?: number;
  /** Background / foreground polarity. */
  theme?: "dark" | "light";
  /** Rounded corners (rx 22) or sharp. */
  rounded?: boolean;
  /** Override the accent hex (defaults to Verde Salvia #3A7D44). */
  accent?: string;
  /** Turn the accent details on / off. */
  accentOn?: boolean;
  /** The active module to determine accent position. */
  activeModule?: "servicios" | "pyme" | "cliente" | "negocio" | "none" | string;
  /** Extra class names. */
  className?: string;
}

export function RenriMark({
  size = 32,
  theme = "dark",
  rounded = true,
  accent = "#3A7D44",
  accentOn = true,
  activeModule = "servicios",
  className,
}: RenriMarkProps) {
  const bg = "var(--background)";
  const fg = "currentColor";

  let accentX = 86;
  let accentY = 20;

  if (activeModule === "pyme" || activeModule === "negocio") {
    accentX = 14;
    accentY = 20;
  } else if (activeModule === "cliente") {
    accentX = 50;
    accentY = 86;
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
      aria-label="RENRI"
      role="img"
    >
      {/* Connection lines */}
      <line x1="50" y1="50" x2="86" y2="20" stroke={fg} strokeWidth="3" opacity="0.6" />
      <line x1="50" y1="50" x2="14" y2="20" stroke={fg} strokeWidth="3" opacity="0.6" />
      <line x1="50" y1="50" x2="50" y2="86" stroke={fg} strokeWidth="3" opacity="0.6" />
      
      {/* Center circle */}
      <circle cx="50" cy="50" r="16" fill={fg} />
      
      {/* Three satellite circles */}
      <circle cx="86" cy="20" r="12" fill="none" stroke={fg} strokeWidth="4" />
      <circle cx="14" cy="20" r="12" fill="none" stroke={fg} strokeWidth="4" />
      <circle cx="50" cy="86" r="12" fill="none" stroke={fg} strokeWidth="4" />
      
      {/* Accent dot */}
      {accentOn && (
        <circle 
          cx={accentX} 
          cy={accentY} 
          r="6" 
          fill={accent} 
          opacity="0.8" 
          style={{ transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      )}
    </svg>
  );
}
