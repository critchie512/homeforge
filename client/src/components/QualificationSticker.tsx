interface QualificationStickerProps {
  physicalId: string;
  qualified: boolean;
  statusLabel: string;
  inspectedAt?: string;
}

const GOLD = "#c9973f";
const INK = "#111010";
const CREAM = "#f2ead9";

const CHECKPOINTS: { label: string; d: string }[] = [
  // Dimensional accuracy — calipers glyph
  { label: "Dimensional\nAccuracy", d: "M -8 8 L 8 -8 M -8 8 L -3 8 M -8 8 L -8 3 M 8 -8 L 3 -8 M 8 -8 L 8 -3" },
  // Surface quality — wave lines
  { label: "Surface\nQuality", d: "M -9 -4 Q -5 -9 0 -4 T 9 -4 M -9 1 Q -5 -4 0 1 T 9 1 M -9 6 Q -5 1 0 6 T 9 6" },
  // Tile alignment & fit — puzzle piece
  { label: "Tile Alignment\n& Fit", d: "M -8 -8 H 3 A 2.5 2.5 0 0 1 3 -3 H 8 V 8 H -8 Z" },
  // Strength & durability — shield with check
  { label: "Strength\n& Durability", d: "M 0 -9 L 8 -6 V 2 C 8 7 3 9.5 0 10 C -3 9.5 -8 7 -8 2 V -6 Z M -4 0 L -1 3 L 4.5 -3.5" },
  // Packaging & protection — box
  { label: "Packaging\n& Protection", d: "M -9 -3 L 0 -8 L 9 -3 L 0 2 Z M -9 -3 V 6 L 0 11 V 2 M 9 -3 V 6 L 0 11" },
];

/**
 * Circular pre-ship qualification sticker, drawn as a single scalable SVG so
 * every element stays in the exact proportions of the real mockup at any
 * render size: black/gold badge, logomark + wordmark, gold "Pre-Ship
 * Qualified" band, five checkpoint icons with verified badges, a "Qualified
 * for NestForge Fit Guarantee" seal line, a QR + qualification ID/date
 * block, a "NestForge Quality Standard" round seal, and the curved
 * "Designed by you. Crafted by NestForge." footer along the bottom rim.
 *
 * When `qualified` is false (design not yet produced/inspected), the
 * checkmarks and gold "VERIFIED" labels swap for a muted pending state and
 * `statusLabel` replaces the qualification date — same layout, so this
 * doubles as a believable "before" preview of the real sticker.
 */
export function QualificationSticker({
  physicalId,
  qualified,
  statusLabel,
  inspectedAt,
}: QualificationStickerProps) {
  const dateLine = qualified ? inspectedAt ?? "—" : statusLabel;
  const checkColor = qualified ? GOLD : "#6b6b6b";
  const iconCenters = [76, 148, 220, 292, 364];

  return (
    <div className="mx-auto w-full max-w-[340px]" data-testid="card-qualification-sticker">
      <svg
        viewBox="0 0 440 440"
        role="img"
        aria-label="NestForge Studio pre-ship qualification sticker"
        className="h-auto w-full"
      >
        <defs>
          <clipPath id="sticker-clip">
            <circle cx="220" cy="220" r="208" />
          </clipPath>
          {/* Cream content area gets its OWN inner clip circle (r=178), strictly
              smaller than the footer arc's radius (196) below, so the cream
              background and the footer text can never overlap by construction. */}
          <clipPath id="cream-clip">
            <circle cx="220" cy="220" r="178" />
          </clipPath>
          {/* Concentric arc (same center, r=196 < 208 clip radius) so every
              point is guaranteed inside the circle, and strictly outside the
              r=178 cream-clip above. Angles verified geometrically to pass
              through the bottom point and sweep left-to-right (upright text),
              matching the mockup's curved footer along the rim. */}
          <path id="sticker-bottom-arc" d="M 47.2 312.5 A 196 196 0 0 0 392.8 312.5" fill="none" />
          {/* Seal arcs centered on the seal circle (300, 332) r=30 — traced
              left-to-right through the top / bottom of the seal so text
              reads upright. */}
          <path id="seal-top-arc" d="M 270 332 A 30 30 0 0 1 330 332" fill="none" />
          <path id="seal-bottom-arc" d="M 270 332 A 30 30 0 0 0 330 332" fill="none" />
        </defs>

        {/* Ring + base */}
        <circle cx="220" cy="220" r="212" fill="none" stroke={GOLD} strokeWidth="8" />
        <circle cx="220" cy="220" r="208" fill={INK} />

        <g clipPath="url(#sticker-clip)">
          {/* Header: logomark + wordmark */}
          <g transform="translate(220 46)" stroke={GOLD} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M -6 -14 L 4 -14 C 4.6 -14 5 -13.6 5 -13 V -8 L 2 -8 V -11 L -1 -11 L 7 -3 V 3 C 7 3.6 6.6 4 6 4" transform="scale(1.1)" />
            <path d="M 6 14 L -4 14 C -4.6 14 -5 13.6 -5 13 V 8 L -2 8 V 11 L 1 11 L -7 3 V -3 C -7 -3.6 -6.6 -4 -6 -4" transform="scale(1.1)" />
          </g>
          <text x="220" y="72" textAnchor="middle" fontFamily="'Cormorant Garamond', Georgia, serif" fontSize="30" fontWeight="600">
            <tspan fill="#ffffff">Nest</tspan>
            <tspan fill={GOLD}>Forge</tspan>
          </text>
          <text
            x="220"
            y="90"
            textAnchor="middle"
            fill="#ffffffcc"
            fontFamily="'Satoshi', 'Inter', sans-serif"
            fontSize="11"
            fontWeight="600"
            letterSpacing="5"
          >
            STUDIO
          </text>

          {/* Gold qualification band */}
          <rect x="-20" y="98" width="480" height="42" fill={GOLD} />
          <text
            x="220"
            y="126"
            textAnchor="middle"
            fill={INK}
            fontFamily="'Satoshi', 'Inter', sans-serif"
            fontSize="27"
            fontWeight="800"
            letterSpacing="0.5"
          >
            {qualified ? "PRE-SHIP QUALIFIED" : "PRE-SHIP REVIEW"}
          </text>

          <text
            x="220"
            y="160"
            textAnchor="middle"
            fill="#ffffffe6"
            fontFamily="'Satoshi', 'Inter', sans-serif"
            fontSize="13"
            fontWeight="700"
            letterSpacing="1.5"
          >
            TESTED &#8226; VERIFIED &#8226; NESTFORGE APPROVED
          </text>
          <line x1="20" y1="176" x2="420" y2="176" stroke={`${GOLD}55`} strokeWidth="1" />

          {/* Checkpoint icons row — compressed slightly (r=21, not 26) versus
              the first pass so the fit-guarantee line and cream section below
              can start higher, leaving every element in the cream section
              comfortable safety margin from the circular clip. */}
          {[112, 184, 256, 328].map((x) => (
            <line key={x} x1={x} y1="178" x2={x} y2="254" stroke={`${GOLD}55`} strokeWidth="1" />
          ))}
          {CHECKPOINTS.map((cp, i) => {
            const cx = iconCenters[i];
            const lines = cp.label.split("\n");
            return (
              <g key={cp.label}>
                <circle cx={cx} cy="200" r="21" fill="none" stroke={GOLD} strokeWidth="1.6" />
                <path
                  d={cp.d}
                  transform={`translate(${cx} 200) scale(0.85)`}
                  stroke="#ffffff"
                  strokeWidth="1.9"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx={cx + 15} cy="215" r="8" fill={INK} stroke={GOLD} strokeWidth="1.3" />
                <path
                  d={`M ${cx + 11.5} 215 L ${cx + 14} 217.5 L ${cx + 19} 211.5`}
                  stroke={checkColor}
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={cx}
                    y={230 + li * 11}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontFamily="'Satoshi', 'Inter', sans-serif"
                    fontSize="9.5"
                    fontWeight="700"
                  >
                    {line}
                  </text>
                ))}
                <text
                  x={cx}
                  y={230 + lines.length * 11 + 10}
                  textAnchor="middle"
                  fill={checkColor}
                  fontFamily="'Satoshi', 'Inter', sans-serif"
                  fontSize="8.5"
                  fontWeight="800"
                  letterSpacing="0.5"
                >
                  {qualified ? "VERIFIED" : "PENDING"}
                </text>
              </g>
            );
          })}

          {/* Fit guarantee line */}
          <line x1="20" y1="262" x2="420" y2="262" stroke={`${GOLD}55`} strokeWidth="1" />
          <circle cx="76" cy="276" r="10" fill="none" stroke={GOLD} strokeWidth="1.6" />
          <path
            d="M 71.9 276 L 74.6 279.2 L 80.1 272.8"
            stroke={GOLD}
            strokeWidth="2.1"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="240"
            y="281"
            textAnchor="middle"
            fontFamily="'Satoshi', 'Inter', sans-serif"
            fontSize="13"
            fontWeight="800"
          >
            <tspan fill="#ffffff">QUALIFIED FOR NESTFORGE </tspan>
            <tspan fill={GOLD}>FIT GUARANTEE</tspan>
          </text>
          <text
            x="220"
            y="297"
            textAnchor="middle"
            fill={GOLD}
            fontFamily="'Satoshi', 'Inter', sans-serif"
            fontSize="10"
            fontWeight="700"
            letterSpacing="2"
          >
            BUILT TO FIT. BUILT TO LAST.
          </text>

          {/* Cream section: QR + ID/date + seal, clipped by the dedicated
              r=178 cream-clip above so it can never reach as far out as the
              r=196 footer arc. Every content corner below was solved so its
              distance from the sticker center stays under ~170 — comfortably
              inside the 178 cream-clip with margin to spare. */}
          <g clipPath="url(#cream-clip)">
            <rect x="-20" y="304" width="480" height="140" fill={CREAM} />
          </g>

          <g transform="translate(124 312)">
            <rect x="0" y="0" width="46" height="46" fill="#ffffff" />
            {Array.from({ length: 6 }).flatMap((_, row) =>
              Array.from({ length: 6 }).map((__, col) => {
                const on = (row * 7 + col * 3) % 5 !== 0;
                if (!on) return null;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={3.5 + col * 6.8}
                    y={3.5 + row * 6.8}
                    width="5.4"
                    height="5.4"
                    fill={INK}
                  />
                );
              }),
            )}
            <rect x="1" y="1" width="12" height="12" fill="none" stroke={INK} strokeWidth="1.8" />
            <rect x="33" y="1" width="12" height="12" fill="none" stroke={INK} strokeWidth="1.8" />
            <rect x="1" y="33" width="12" height="12" fill="none" stroke={INK} strokeWidth="1.8" />
          </g>

          <text x="180" y="324" fill={`${INK}b3`} fontFamily="'Satoshi', 'Inter', sans-serif" fontSize="9" fontWeight="700" letterSpacing="0.5">
            QUALIFICATION ID:
          </text>
          <text
            x="180"
            y="338"
            fill={INK}
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fontSize="11.5"
            fontWeight="700"
            data-testid="text-sticker-physical-id"
          >
            {physicalId}
          </text>
          <text x="180" y="352" fill={`${INK}b3`} fontFamily="'Satoshi', 'Inter', sans-serif" fontSize="9" fontWeight="700" letterSpacing="0.5">
            {qualified ? "DATE QUALIFIED:" : "STATUS:"}
          </text>
          <text
            x="180"
            y="366"
            fill={INK}
            fontFamily="'Satoshi', 'Inter', sans-serif"
            fontSize="11"
            fontWeight="700"
            data-testid="text-sticker-date"
          >
            {dateLine}
          </text>

          <line x1="258" y1="316" x2="258" y2="362" stroke={`${INK}33`} strokeWidth="1" />

          <g transform="translate(300 332) scale(0.85)">
            <circle r="35" fill="none" stroke={INK} strokeWidth="1.3" />
            <circle r="31" fill="none" stroke={INK} strokeWidth="1" strokeDasharray="1.5 3" />
            <path
              d="M -5 -12 L 4 -12 C 4.5 -12 5 -11.5 5 -11 V -7 L 2 -7 V -9.5 L -1 -9.5 L 6 -3 V 2 C 6 2.5 5.5 3 5 3"
              stroke={INK}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 5 10 L -4 10 C -4.5 10 -5 9.5 -5 9 V 5 L -2 5 V 7.5 L 1 7.5 L -6 1 V -4 C -6 -4.5 -5.5 -5 -5 -5"
              stroke={INK}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <text fontFamily="'Satoshi', 'Inter', sans-serif" fontSize="5.6" fontWeight="800" letterSpacing="0.2" fill={INK}>
            <textPath href="#seal-top-arc" startOffset="50%" textAnchor="middle">
              NESTFORGE QUALITY STANDARD
            </textPath>
          </text>
          <text fontFamily="'Satoshi', 'Inter', sans-serif" fontSize="5.4" fontWeight="700" letterSpacing="0.1" fill={`${INK}b3`}>
            <textPath href="#seal-bottom-arc" startOffset="50%" textAnchor="middle">
              CUSTOM MADE. QUALITY ASSURED.
            </textPath>
          </text>

          {/* Curved footer along the bottom rim */}
          <text fontFamily="'Satoshi', 'Inter', sans-serif" fontSize="10.5" fontWeight="700" letterSpacing="1.5" fill={GOLD}>
            <textPath href="#sticker-bottom-arc" startOffset="50%" textAnchor="middle">
              DESIGNED BY YOU. CRAFTED BY NESTFORGE.
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
}
