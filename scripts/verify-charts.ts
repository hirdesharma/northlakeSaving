/**
 * Chart geometry checks — run with `npm run verify:charts`.
 *
 * The charts are hand-drawn SVG, so a mistake in the path maths shows up as a
 * silently wrong picture rather than an error. These assertions cover the
 * cases that would misdraw: NaN coordinates, inverted bands, bars escaping the
 * plot, and axis ticks that don't reach the data.
 */

import {
  axisMax,
  bandPath,
  barPath,
  linePath,
  linearScale,
  nearestIndex,
  niceTicks,
  type Pt,
} from "../lib/chart";
import { project } from "../lib/projection";
import { getSimulation } from "../lib/simulation";

const failures: string[] = [];
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) failures.push(label);
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` (${detail})` : ""}`);
};

console.log("\n  Chart geometry\n  " + "=".repeat(52) + "\n");

// --- Scales --------------------------------------------------------------
const y = linearScale([0, 100], [300, 20]);
check("scale maps domain floor to range floor", y(0) === 300);
check("scale maps domain ceiling to range ceiling", y(100) === 20);
check("scale is linear at the midpoint", y(50) === 160);
check("degenerate domain does not divide by zero", Number.isFinite(linearScale([5, 5], [0, 10])(5)));

// --- Ticks ---------------------------------------------------------------
check("ticks reach the data maximum", axisMax(69_549) >= 69_549, `axisMax = ${axisMax(69_549)}`);
check("ticks land on a round number", axisMax(69_549) % 1000 === 0, `${axisMax(69_549)}`);
check("ticks start at zero", niceTicks(69_549)[0] === 0);
check("tick count is readable", niceTicks(69_549).length >= 3 && niceTicks(69_549).length <= 9);
check("zero-max does not loop forever", niceTicks(0).length === 1);

// --- Paths ---------------------------------------------------------------
const noNaN = (d: string) => d.length > 0 && !/NaN|Infinity|undefined/.test(d);

const upper: Pt[] = [{ x: 0, y: 10 }, { x: 10, y: 20 }, { x: 20, y: 5 }];
const lower: Pt[] = [{ x: 0, y: 50 }, { x: 10, y: 50 }, { x: 20, y: 50 }];

check("line path is well formed", noNaN(linePath(upper)));
check("empty line path is empty, not broken", linePath([]) === "");
check("band path is well formed", noNaN(bandPath(upper, lower)));
check("band path closes its shape", bandPath(upper, lower).endsWith("Z"));

// The 2px surface gap must never lift the floor above the ceiling, or a thin
// band renders inside-out.
const thinUpper: Pt[] = [{ x: 0, y: 49 }, { x: 10, y: 49.5 }];
const thinLower: Pt[] = [{ x: 0, y: 50 }, { x: 10, y: 50 }];
const thinBand = bandPath(thinUpper, thinLower, 2);
const lifted = [...thinBand.matchAll(/L([\d.]+),([\d.]+)/g)].map((m) => Number(m[2]));
check(
  "surface gap never inverts a thin band",
  lifted.every((v) => v >= 49 - 0.001),
  `floors clamped to ${lifted.join(", ")}`,
);

check("bar path is well formed", noNaN(barPath(10, 20, 24, 100)));
check("zero-height bar draws nothing", barPath(10, 120, 24, 0) === "");
check(
  "bar corner radius never exceeds half its width",
  noNaN(barPath(0, 0, 3, 100)) && !barPath(0, 0, 3, 100).includes("-"),
);
check("bar shorter than the radius still draws", noNaN(barPath(0, 0, 24, 2)));

// --- Hover ---------------------------------------------------------------
const xs = [0, 25, 50, 75, 100];
check("nearest index snaps to the closest point", nearestIndex(xs, 51) === 2);
check("nearest index clamps below the range", nearestIndex(xs, -40) === 0);
check("nearest index clamps above the range", nearestIndex(xs, 400) === 4);
check("nearest index on empty data returns -1", nearestIndex([], 10) === -1);

// --- Against real model data ---------------------------------------------
console.log("");
const sim = getSimulation();
const top = axisMax(sim.balance, 4);
const scale = linearScale([0, top], [300, 20]);

check(
  "every growth-chart point sits inside the plot",
  sim.monthly.every((p) => scale(p.balance) >= 20 && scale(p.balance) <= 300),
);
check(
  "no month's interest exceeds its balance",
  sim.monthly.every((p) => p.interest <= p.balance),
);
check(
  "contributions and interest reconcile at every point",
  sim.monthly.every((p) => Math.abs(p.contributions + p.interest - p.balance) < 0.005),
);

const bars = sim.years.map((row) => row.interest);
check("interest bars are all non-negative", bars.every((v) => v >= 0));
check("interest-bar axis clears the tallest bar", axisMax(Math.max(...bars), 4) >= Math.max(...bars));

// --- Projection edge cases ------------------------------------------------
console.log("");
const zeroRate = project({ startingBalance: 1000, monthlyContribution: 100, annualRate: 0, years: 10 });
check("a 0% rate earns no interest", zeroRate.totalInterest === 0);
check("a 0% rate matches the deposits-only line", zeroRate.finalBalance === zeroRate.withoutInterest);
check("a 0% rate reports no doubling time", !Number.isFinite(zeroRate.doublingYears));

const noDeposits = project({ startingBalance: 10_000, monthlyContribution: 0, annualRate: 0.06, years: 12 });
check(
  "doubling time is consistent with the projection",
  Math.abs(
    noDeposits.points.find((p) => p.balance >= 20_000)!.t - noDeposits.doublingYears,
  ) < 0.1,
  `${noDeposits.doublingYears.toFixed(2)} years`,
);

const oneMonth = project({ startingBalance: 0, monthlyContribution: 500, annualRate: 0.04, years: 1 / 12 });
check("a single-month projection is well formed", oneMonth.points.length === 2 && oneMonth.finalBalance > 500);

const long = project({ startingBalance: 69_549, monthlyContribution: 750, annualRate: 0.04, years: 40 });
check("a 40-year projection stays finite", Number.isFinite(long.finalBalance) && long.finalBalance > 0);
check("interest share stays within 0–100%", long.interestShare > 0 && long.interestShare < 1);

console.log("");
if (failures.length) {
  console.error(`  ${failures.length} check(s) failed:\n   - ${failures.join("\n   - ")}\n`);
  process.exit(1);
}
console.log("  All geometry checks passed.\n");
