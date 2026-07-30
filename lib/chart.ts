/**
 * Chart maths. Pure functions only — no React, no DOM.
 *
 * The charts are hand-drawn SVG rather than a charting library, so that the
 * mark specs (2px surface gaps between stacked bands, 4px rounded bar ends,
 * hairline grids) are exact rather than approximated through a config object.
 */

export interface Scale {
  (value: number): number;
  domain: [number, number];
  range: [number, number];
}

export function linearScale(
  domain: [number, number],
  range: [number, number],
): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  const fn = ((v: number) => r0 + ((v - d0) / span) * (r1 - r0)) as Scale;
  fn.domain = domain;
  fn.range = range;
  return fn;
}

/**
 * Axis ticks on human-readable steps (1 / 2 / 2.5 / 5 × 10ⁿ), extended to a
 * round upper bound so the top gridline is a number worth reading.
 */
export function niceTicks(max: number, targetCount = 5): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0];

  const rawStep = max / targetCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalised = rawStep / magnitude; // always in [1, 10)
  const step =
    magnitude *
    (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 2.5 ? 2.5 : normalised <= 5 ? 5 : 10);

  // Round the top UP past the data. Stopping at the last step below `max`
  // would put the axis ceiling under the highest value and the series would
  // draw outside the plot.
  const count = Math.ceil(max / step - 1e-9);

  // Indexed rather than accumulated: repeatedly adding a fractional step
  // (2.5, 0.1) drifts, and drifted ticks print as 0.30000000000000004.
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step * 1e6) / 1e6);
}

/** Upper bound of the y-axis: the last nice tick at or above the data max. */
export const axisMax = (max: number, targetCount = 5) => {
  const ticks = niceTicks(max, targetCount);
  return ticks[ticks.length - 1];
};

export interface Pt {
  x: number;
  y: number;
}

/** Polyline path. Straight segments — smoothing invents values between points. */
export function linePath(points: Pt[]): string {
  if (!points.length) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)},${round(p.y)}`)
    .join(" ");
}

/**
 * Closed band between an upper and lower edge.
 *
 * `gap` lifts the lower edge by N screen pixels, which is how the 2px surface
 * gap between stacked segments is produced — the surface shows through the
 * gap rather than a border being drawn around the mark. The lower edge is
 * never lifted past the upper edge, so a thin band collapses to nothing
 * instead of inverting.
 */
export function bandPath(upper: Pt[], lower: Pt[], gap = 0): string {
  if (!upper.length) return "";
  const back = [...lower]
    .reverse()
    .map((p, i) => {
      const mirror = upper[upper.length - 1 - i];
      const lifted = gap > 0 ? Math.max(p.y - gap, mirror.y) : p.y;
      return `L${round(p.x)},${round(lifted)}`;
    })
    .join(" ");
  return `${linePath(upper)} ${back} Z`;
}

/** A bar with rounded top corners and square feet on the baseline. */
export function barPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 4,
): string {
  const h = Math.max(0, height);
  const r = Math.min(radius, width / 2, h);
  if (h <= 0) return "";
  return [
    `M${round(x)},${round(y + h)}`,
    `L${round(x)},${round(y + r)}`,
    `Q${round(x)},${round(y)} ${round(x + r)},${round(y)}`,
    `L${round(x + width - r)},${round(y)}`,
    `Q${round(x + width)},${round(y)} ${round(x + width)},${round(y + r)}`,
    `L${round(x + width)},${round(y + h)}`,
    "Z",
  ].join(" ");
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Index of the datum nearest a pointer x — drives the crosshair. */
export function nearestIndex(xs: number[], target: number): number {
  if (!xs.length) return -1;
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < xs.length; i++) {
    const distance = Math.abs(xs[i] - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }
  return best;
}
