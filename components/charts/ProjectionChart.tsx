"use client";

import { useMemo, useState } from "react";
import type { ProjectionResult } from "@/lib/projection";
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
 * The projection: the same deposits with and without compounding.
 *
 * The shaded wedge between the two lines *is* the interest — it starts as a
 * hairline and opens up as the balance grows, which is the visual argument the
 * whole project is making.
 */
export function ProjectionChart({ result }: { result: ProjectionResult }) {
  const { ref, width, height, ready } = useChartSize(0.46, 230, 360);
  const [hover, setHover] = useState<number | null>(null);

  const { series1, series2, grid, axis, surface, muted } = TOKEN;

  const PAD = { top: 20, right: 16, bottom: 30, left: 52 };
  const plotWidth = Math.max(0, width - PAD.left - PAD.right);
  const plotHeight = Math.max(0, height - PAD.top - PAD.bottom);

  // One point per month is more resolution than the plot has pixels; sample
  // down so the path stays light without changing its shape.
  const points = useMemo(() => {
    const step = Math.max(1, Math.round(result.points.length / 220));
    const sampled = result.points.filter((_, i) => i % step === 0);
    const last = result.points[result.points.length - 1];
    if (sampled[sampled.length - 1] !== last) sampled.push(last);
    return sampled;
  }, [result.points]);

  const geometry = useMemo(() => {
    if (!ready || points.length < 2) return null;

    const yTicks = niceTicks(result.finalBalance, 4);
    const top = yTicks[yTicks.length - 1];
    const maxYears = points[points.length - 1].t;
    const x = linearScale([0, maxYears], [PAD.left, PAD.left + plotWidth]);
    const y = linearScale([0, top], [PAD.top + plotHeight, PAD.top]);

    const xs = points.map((p) => x(p.t));
    const balanceEdge: Pt[] = points.map((p) => ({ x: x(p.t), y: y(p.balance) }));
    const plainEdge: Pt[] = points.map((p) => ({ x: x(p.t), y: y(p.withoutInterest) }));

    const yearStep = maxYears > 24 ? 10 : maxYears > 12 ? 5 : maxYears > 6 ? 2 : 1;
    const xTicks: number[] = [];
    for (let t = 0; t <= maxYears + 0.001; t += yearStep) xTicks.push(t);

    return { x, y, xs, top, maxYears, balanceEdge, plainEdge, xTicks, yTicks };
  }, [ready, points, result.finalBalance, plotWidth, plotHeight, PAD.left, PAD.top]);

  const active = hover != null ? points[hover] : null;

  return (
    <ChartCard
      title="Projected balance"
      subtitle="The gap between the two lines is compound interest. It widens with time because each month's interest earns interest of its own."
      aside={
        <Legend
          items={[
            { label: "Deposits only", color: series1, shape: "line" },
            { label: "With compounding", color: series2, shape: "line" },
          ]}
        />
      }
    >
      <div ref={ref} className="relative w-full" onPointerLeave={() => setHover(null)}>
        {ready && geometry && (
          <svg
            width={width}
            height={height}
            role="img"
            aria-label={`Projection over ${geometry.maxYears.toFixed(
              0,
            )} years. Deposits alone reach ${money(result.withoutInterest)}; with compounding the balance reaches ${money(
              result.finalBalance,
            )}.`}
            className="block touch-pan-y"
            onPointerMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              setHover(nearestIndex(geometry.xs, event.clientX - bounds.left));
            }}
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

            {/* The interest wedge */}
            <path
              d={bandPath(geometry.balanceEdge, geometry.plainEdge, 2)}
              fill={series2}
              fillOpacity={0.15}
            />

            <path
              d={linePath(geometry.plainEdge)}
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

            {geometry.xTicks.map((tick) => (
              <text
                key={tick}
                x={geometry.x(tick)}
                y={height - 9}
                textAnchor="middle"
                fill={muted}
                fontSize={11}
              >
                {tick === 0 ? "Now" : `${tick}y`}
              </text>
            ))}

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
                  cy={geometry.y(active.withoutInterest)}
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

            {!active && (
              <circle
                cx={geometry.xs[geometry.xs.length - 1]}
                cy={geometry.y(result.finalBalance)}
                r={4}
                fill={series2}
                stroke={surface}
                strokeWidth={2}
              />
            )}
          </svg>
        )}

        {active && hover != null && geometry && (
          <ChartTooltip
            x={geometry.xs[hover]}
            y={geometry.y(active.balance)}
            width={width}
            title={active.t === 0 ? "Today" : `In ${active.t.toFixed(1)} years`}
            rows={[
              { label: "With interest", value: money(active.balance), color: series2, strong: true },
              { label: "Deposits only", value: money(active.withoutInterest), color: series1 },
              { label: "Difference", value: money(active.balance - active.withoutInterest) },
            ]}
          />
        )}

        {!ready && <div style={{ height }} aria-hidden />}
      </div>

      <TableView
        caption="Projected balance at each year mark, with and without compound interest"
        columns={["Year", "Deposits only", "With compounding", "Interest"]}
        rows={result.points
          .filter((p) => p.monthIndex % 12 === 0)
          .map((p) => [
            p.t === 0 ? "Now" : `Year ${p.t.toFixed(0)}`,
            money(p.withoutInterest),
            money(p.balance),
            money(p.balance - p.withoutInterest),
          ])}
      />
    </ChartCard>
  );
}
