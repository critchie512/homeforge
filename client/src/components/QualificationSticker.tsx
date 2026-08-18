import { CheckCircle2, Clock3 } from "lucide-react";

interface QualificationStickerProps {
  physicalId: string;
  qualified: boolean;
  statusLabel: string;
  inspectedAt?: string;
}

/**
 * Mocked pre-shipment qualification sticker. Shows the physical identifier,
 * a qualification badge, minimal inspection metadata, and a placeholder QR
 * code graphic (not a real scannable code). Layout intentionally stays
 * modular/simple so it's easy to revise once the real qualification
 * workflow and "item 8" UX question (see docs/DECISIONS.md) are resolved.
 */
export function QualificationSticker({
  physicalId,
  qualified,
  statusLabel,
  inspectedAt,
}: QualificationStickerProps) {
  return (
    <div
      className="rounded-xl border border-card-border bg-card p-5"
      data-testid="card-qualification-sticker"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">HomeForge unit</p>
          <p className="mt-0.5 font-mono text-sm font-semibold" data-testid="text-sticker-physical-id">
            {physicalId}
          </p>
        </div>
        <QrPlaceholder />
      </div>

      <div className="mt-4 flex items-center gap-2">
        {qualified ? (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
            data-testid="badge-qualified"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Qualified
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
            data-testid="badge-not-qualified"
          >
            <Clock3 className="h-3.5 w-3.5" /> {statusLabel}
          </span>
        )}
      </div>

      {inspectedAt && (
        <p className="mt-2 text-xs text-muted-foreground" data-testid="text-inspected-at">
          Inspected {inspectedAt}
        </p>
      )}
    </div>
  );
}

function QrPlaceholder() {
  // Purely decorative QR placeholder — not a real scannable code.
  return (
    <svg
      viewBox="0 0 40 40"
      width="40"
      height="40"
      className="shrink-0 text-foreground"
      aria-label="Placeholder QR code"
      role="img"
      data-testid="graphic-qr-placeholder"
    >
      <rect x="0" y="0" width="40" height="40" rx="4" fill="currentColor" opacity="0.06" />
      {[0, 2, 4, 6, 8].flatMap((row) =>
        [0, 2, 4, 6, 8].map((col) => {
          const on = (row + col * 3) % 5 !== 0;
          if (!on) return null;
          return (
            <rect
              key={`${row}-${col}`}
              x={4 + col * 3.6}
              y={4 + row * 3.6}
              width={3}
              height={3}
              fill="currentColor"
              opacity="0.85"
            />
          );
        }),
      )}
    </svg>
  );
}
