"use client";

import { useMemo, useState } from "react";
import type { MonthPoint } from "@/lib/simulation";
import { bandPath, linePath, linearScale, nearestIndex, niceTicks, type Pt } from "@/lib/chart";
import { money, moneyCompact } from "@/lib/format";
import {
  ChartCard,
  ChartTooltip,
  Legend,
  TableView,
  TOKEN,
  useChartSize,
} from "./ChartKit";

/**
 * Balance over time, split into the two things it is made of.
 *
 * A stacked band rather than two overlapping lines: the question is "how much
 * of this balance did compounding produce", which is a part-to-whole question,
 * and the height of the upper band answers it directly.
 */
export function GrowthChart({ monthly }: { monthly: MonthPoint[] }) {
  const { ref, width, height, ready } = useChartSize(0.42, 220, 340);
  const [hover, setHover] = useState<number | null>(null);

  const { series1, series2, grid, axis, surface, muted } = TOKEN;

  const PAD = { top: 18, right: 14, bottom: 26, left: 50 };
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = Math.max(0, height - PAD.top - PAD.bottom);

  const geometry = useMemo(() => {
    if (!ready || !monthly.length) return null;

    const yTicks = niceTicks(monthly[monthly.length - 1].balance, 4);
    const top = yTicks[yTicks.length - 1];
    const x = linearScale([0, monthly.length - 1], [PAD.left, PAD.left + plotWidth]);
    const y = linearScale([0, top], [PAD.top + plotHeight, PAD.top]);

    const xs = monthly.map((_, i) => x(i));
    const baseline: Pt[] = monthly.map((_, i) => ({ x: x(i), y: y(0) }));
    const contributionEdge: Pt[] = monthly.map((p, i) => ({ x: x(i), y: y(p.contributions) }));
    const balanceEdge: Pt[] = monthly.map((p, i) => ({ x: x(i), y: y(p.balance) }));

    // Year boundaries only — a tick per month would be unreadable.
    const yearTicks = monthly
      .map((p, i) => ({ i, year: p.month.slice(0, 4), isJanuary: p.month.endsWith("-01") }))
      .filter((t) => t.isJanuary);

    return { x, y, xs, top, baseline, contributionEdge, balanceEdge, yearTicks, yTicks };
  }, [ready, monthly, plotWidth, plotHeight, PAD.left, PAD.top]);

  const last = monthly[monthly.length - 1];
  const active = hover != null ? monthly[hover] : null;

  return (
    <ChartCard
      title="Savings growth"
      subtitle={`Every month since the account opened, split into money paid in and interest earned. Interest accounts for ${(
        (last.interest / last.balance) * 100
      ).toFixed(1)}% of the balance today.`}
      aside={
        <Legend
          items={[
            { label: "Deposits", color: series1 },
            { label: "Interest earned", color: series2 },
          ]}
        />
      }
    >
      <div
        ref={ref}
        className="relative w-full"
        onPointerLeave={() => setHover(null)}
      >
        {ready && geometry && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Savings growth from ${monthly[0].label} to ${last.label}. Balance grew to ${money(
              last.balance,
            )}, of which ${money(last.interest)} is interest earned.`}
            className="block touch-pan-y"
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              setHover(nearestIndex(geometry.xs, event.clientX - bounds.left));
            }}
          >
            {/* Gridlines — solid hairlines, one step off the surface */}
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

            {/* Lower band: money paid in */}
            <path
              d={bandPath(geometry.contributionEdge, geometry.baseline)}
              fill={series1}
              fillOpacity={0.14}
            />
            {/* Upper band: interest. Its floor is lifted 2px so the surface
                shows through as a gap — the separator is white space, not a
                border drawn around the mark. */}
            <path
              d={bandPath(geometry.balanceEdge, geometry.contributionEdge, 2)}
              fill={series2}
              fillOpacity={0.16}
            />

            <path
              d={linePath(geometry.contributionEdge)}
              fill="none"
              stroke={series1}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={linePath(geometry.balanceEdge)}
              fill="none"
              stroke={series2}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Year labels */}
            {geometry.yearTicks.map((tick) => (
              <text
                key={tick.i}
                x={geometry.x(tick.i)}
                y={height - 8}
                textAnchor="middle"
                fill={muted}
                fontSize={11}
              >
                {tick.year}
              </text>
            ))}

            {/* Crosshair */}
            {active && hover != null && (
              <g pointerEvents="none">
                <line
                  x1={geometry.xs[hover]}
                  x2={geometry.xs[hover]}
                  y1={PAD.top}
                  y2={PAD.top + plotHeight}
                  stroke={axis}
                  strokeWidth={1}
                />
                <circle
                  cx={geometry.xs[hover]}
                  cy={geometry.y(active.contributions)}
                  r={4}
                  fill={series1}
                  stroke={surface}
                  strokeWidth={2}
                />
                <circle
                  cx={geometry.xs[hover]}
                  cy={geometry.y(active.balance)}
                  r={4}
                  fill={series2}
                  stroke={surface}
                  strokeWidth={2}
                />
              </g>
            )}

            {/* The one direct label: where the balance ended up */}
            {!active && (
              <g pointerEvents="none">
                <circle
                  cx={geometry.xs[geometry.xs.length - 1]}
                  cy={geometry.y(last.balance)}
                  r={4}
                  fill={series2}
                  stroke={surface}
                  strokeWidth={2}
                />
                <text
                  x={geometry.xs[geometry.xs.length - 1] - 6}
                  y={geometry.y(last.balance) - 12}
                  textAnchor="end"
                  className="tnum"
                  fill={muted}
                  fontSize={11.5}
                  fontWeight={600}
                >
                  {money(last.balance, 0)}
                </text>
              </g>
            )}
          </svg>
        )}

        {active && hover != null && geometry && (
          <ChartTooltip
            x={geometry.xs[hover]}
            y={geometry.y(active.balance)}
            width={width}
            title={active.label}
            rows={[
              { label: "Balance", value: money(active.balance), strong: true },
              { label: "Deposits", value: money(active.contributions), color: series1 },
              { label: "Interest", value: money(active.interest), color: series2 },
            ]}
            note={`Rate that month: ${(active.apr * 100).toFixed(2)}% APR`}
          />
        )}

        {!ready && <div style={{ height }} aria-hidden />}
      </div>

      <TableView
        caption="Balance at the end of each year, split into deposits and interest"
        columns={["Year end", "Deposits", "Interest", "Balance"]}
        rows={monthly
          .filter((p, i) => p.month.endsWith("-12") || i === monthly.length - 1)
          .map((p) => [p.label, money(p.contributions), money(p.interest), money(p.balance)])}
      />
    </ChartCard>
  );
}
