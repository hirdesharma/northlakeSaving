"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* ==========================================================================
   Shared chart furniture: sizing, card, legend, tooltip, table view.
   ========================================================================== */

/**
 * Measures the container and renders the SVG at real pixel size rather than
 * scaling a fixed viewBox — scaling would distort every stroke width and
 * label, and stroke weights are load-bearing in this design.
 */
export function useChartSize(aspect = 0.44, minHeight = 200, maxHeight = 360) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => setWidth(element.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const height = Math.round(
    Math.min(maxHeight, Math.max(minHeight, width * aspect)),
  );
  return { ref, width, height, ready: width > 0 };
}

/* -------------------------------------------------------------------------- */

export function ChartCard({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 max-w-prose text-[13px] leading-snug text-ink-2">
              {subtitle}
            </p>
          )}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

/**
 * Identity never rests on colour alone — the legend is always present for two
 * or more series, and the swatch sits beside text in a normal ink colour.
 */
export function Legend({
  items,
}: {
  items: Array<{ label: string; color: string; shape?: "line" | "swatch" }>;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-[12.5px] text-ink-2">
          {item.shape === "line" ? (
            <span
              aria-hidden
              className="h-0.5 w-4 rounded-full"
              style={{ background: item.color }}
            />
          ) : (
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-[3px]"
              style={{ background: item.color }}
            />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
  strong?: boolean;
}

export function ChartTooltip({
  x,
  y,
  width,
  title,
  rows,
  note,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  rows: TooltipRow[];
  note?: string;
}) {
  const CARD_WIDTH = 188;
  // Flip to the other side of the crosshair when close to the right edge.
  const left = x + CARD_WIDTH + 16 > width ? x - CARD_WIDTH - 12 : x + 12;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute z-20 rounded-lg border border-line bg-surface-1 px-3 py-2 shadow-lg"
      style={{ left: Math.max(4, left), top: Math.max(4, y - 12), width: CARD_WIDTH }}
    >
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      <dl className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="flex items-center gap-1.5 text-[12px] text-ink-2">
              {row.color && (
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ background: row.color }}
                />
              )}
              {row.label}
            </dt>
            <dd
              className={`tnum text-[12.5px] ${
                row.strong ? "font-semibold text-ink" : "text-ink-2"
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-1.5 text-[11px] leading-snug text-muted">{note}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Every chart ships a table twin. A tooltip may enhance a chart but must never
 * be the only route to a value — this is the accessible equivalent.
 */
export function TableView({
  caption,
  columns,
  rows,
}: {
  caption: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3 border-t border-line pt-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:text-ink"
      >
        <svg
          aria-hidden
          viewBox="0 0 12 12"
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path
            d="M4 2l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {open ? "Hide" : "Show"} data table
      </button>

      {open && (
        <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-line">
          <table className="w-full min-w-[420px] border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column}
                    scope="col"
                    className={`whitespace-nowrap px-3 py-2 text-[11.5px] font-semibold uppercase tracking-wide text-ink-2 ${
                      index === 0 ? "text-left" : "text-right"
                    }`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-t border-line">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={`whitespace-nowrap px-3 py-1.5 text-[12.5px] ${
                        cellIndex === 0
                          ? "text-left text-ink"
                          : "tnum text-right text-ink-2"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Chart marks reference the design tokens as live CSS variables rather than
 * resolved hex values. SVG presentation attributes accept `var()`, so a theme
 * change repaints the charts through the same cascade as everything else —
 * no re-render, no colour read, nothing to keep in sync.
 */
export const TOKEN = {
  series1: "var(--color-series-1)",
  series2: "var(--color-series-2)",
  grid: "var(--color-grid)",
  axis: "var(--color-axis)",
  surface: "var(--color-surface-1)",
  muted: "var(--color-muted)",
} as const;
