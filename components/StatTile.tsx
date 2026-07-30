import type { ReactNode } from "react";

/**
 * A number that doesn't need a chart.
 *
 * Values use the font's proportional figures — `tabular-nums` gives every
 * digit the width of a zero, which reads loose at display sizes. Tabular is
 * reserved for the columns in tables and axis ticks.
 */
export function StatTile({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  /** A small colour key beside the label, matching a chart series. */
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-1.5">
        {accent && (
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
            style={{ background: accent }}
          />
        )}
        <p className="text-[12.5px] font-medium text-ink-2">{label}</p>
      </div>
      <p className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight text-ink sm:text-[25px]">
        {value}
      </p>
      {detail && <p className="mt-1 text-[12px] leading-snug text-muted">{detail}</p>}
    </div>
  );
}

/** The single headline figure. Exactly one per view. */
export function HeroFigure({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-ink-2">{label}</p>
      <p className="mt-1 text-[40px] font-semibold leading-none tracking-tight text-ink sm:text-[52px]">
        {value}
      </p>
      {detail && <div className="mt-2 text-[13px] text-ink-2">{detail}</div>}
    </div>
  );
}
