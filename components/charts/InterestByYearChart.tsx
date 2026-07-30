"use client";

import { useMemo, useState } from "react";
import type { YearSummary } from "@/lib/simulation";
import { barPath, linearScale, niceTicks } from "@/lib/chart";
import { money, moneyCompact, pct } from "@/lib/format";
import { ChartCard, ChartTooltip, TableView, TOKEN, useChartSize } from "./ChartKit";

/**
 * Interest earned per year.
 *
 * One series, so no legend — the title already says what is plotted. The shape
 * is the story: nearly flat through the low-rate years, then a step change once
 * rates rise *and* there is a larger balance for them to act on.
 */
export function InterestByYearChart({ years }: { years: YearSummary[] }) {
  const { ref, width, height, ready } = useChartSize(0.4, 190, 280);
  const [hover, setHover] = useState<number | null>(null);

  const { series2, grid, axis, muted } = TOKEN;

  const PAD = { top: 22, right: 8, bottom: 26, left: 46 };
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = Math.max(0, height - PAD.top - PAD.bottom);

  const geometry = useMemo(() => {
    if (!ready || !years.length) return null;

    const yTicks = niceTicks(Math.max(...years.map((row) => row.interest)), 3);
    const top = yTicks[yTicks.length - 1];
    const y = linearScale([0, top], [PAD.top + plotHeight, PAD.top]);

    const band = plotWidth / years.length;
    // Cap the bar and let the band's leftover be air.
    const barWidth = Math.min(24, band * 0.56);

    const bars = years.map((row, i) => {
      const centre = PAD.left + band * i + band / 2;
      return {
        row,
        centre,
        x: centre - barWidth / 2,
        y: y(row.interest),
        height: y(0) - y(row.interest),
      };
    });

    const peak = bars.reduce((best, b) => (b.row.interest > best.row.interest ? b : best), bars[0]);

    return { y, top, band, barWidth, bars, peak, yTicks };
  }, [ready, years, plotWidth, plotHeight, PAD.left, PAD.top]);

  const active = hover != null ? geometry?.bars[hover] : null;

  return (
    <ChartCard
      title="Interest earned each year"
      subtitle="The same deposits earn very different amounts depending on the rate and the balance already built up."
    >
      <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
        {ready && geometry && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Interest earned each year, from ${money(years[0].interest)} in ${
              years[0].year
            } to ${money(years[years.length - 1].interest)} in ${years[years.length - 1].year}.`}
            className="block"
          >
            {geometry.yTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotWidth}
                  y1={geometry.y(tick)}
                  y2={geometry.y(tick)}
                  stroke={tick === 0 ? axis : grid}
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 8}
                  y={geometry.y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="tnum"
                  fill={muted}
                  fontSize={11}
                >
                  {moneyCompact(tick)}
                </text>
              </g>
            ))}

            {geometry.bars.map((bar, i) => (
              <g key={bar.row.year}>
                <path
                  d={barPath(bar.x, bar.y, geometry.barWidth, bar.height, 4)}
                  fill={series2}
                  fillOpacity={hover == null || hover === i ? 1 : 0.4}
                  style={{ transition: "fill-opacity 120ms" }}
                />
                {/* Hit target spans the whole band, not just the bar */}
                <rect
                  x={PAD.left + geometry.band * i}
                  y={PAD.top}
                  width={geometry.band}
                  height={plotHeight}
                  fill="transparent"
                  onPointerEnter={() => setHover(i)}
                />
                <text
                  x={bar.centre}
                  y={height - 8}
                  textAnchor="middle"
                  fill={muted}
                  fontSize={11}
                >
                  {String(bar.row.year).slice(2)}
                </text>
              </g>
            ))}

            {/* Label the peak only — a number on every bar goes unread */}
            {hover == null && (
              <text
                x={geometry.peak.centre}
                y={geometry.peak.y - 8}
                textAnchor="middle"
                className="tnum"
                fill={muted}
                fontSize={11.5}
                fontWeight={600}
              >
                {money(geometry.peak.row.interest, 0)}
              </text>
            )}
          </svg>
        )}

        {active && geometry && (
          <ChartTooltip
            x={active.centre}
            y={active.y}
            width={width}
            title={String(active.row.year)}
            rows={[
              { label: "Interest", value: money(active.row.interest), strong: true },
              { label: "Deposited", value: money(active.row.contributed) },
              { label: "Year-end", value: money(active.row.endBalance) },
            ]}
            note={`${pct(active.row.apr)} APR · ${pct(active.row.apy)} APY`}
          />
        )}

        {!ready && <div style={{ height }} aria-hidden />}
      </div>

      <TableView
        caption="Deposits, interest and closing balance by year"
        columns={["Year", "Deposited", "Interest", "Year-end balance", "APY"]}
        rows={years.map((row) => [
          row.year,
          money(row.contributed),
          money(row.interest),
          money(row.endBalance),
          pct(row.apy),
        ])}
      />
    </ChartCard>
  );
}
