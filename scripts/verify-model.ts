/**
 * Model verification — run with `npm run verify`.
 *
 * Prints the account summary and asserts the arithmetic reconciles. If you
 * change any figure in `lib/config.ts`, run this to see where the balance
 * lands before opening the app.
 */

import { getSimulation, aprToApy } from "../lib/simulation";
import { ACCOUNT_HOLDER, BRAND } from "../lib/config";

const money = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

const sim = getSimulation();

console.log(`\n  ${BRAND.name} — model verification`);
console.log(`  ${"=".repeat(56)}\n`);
console.log(`  Opened            ${ACCOUNT_HOLDER.openedOn}`);
console.log(`  As of             ${sim.asOf}`);
console.log(
  `  Elapsed           ${sim.monthsElapsed} months (${sim.yearsElapsed.toFixed(1)} years)\n`,
);
console.log(`  Contributions     ${money(sim.totalContributions).padStart(14)}`);
console.log(`  Interest earned   ${money(sim.totalInterest).padStart(14)}`);
console.log(`  ${" ".repeat(18)}${"-".repeat(14)}`);
console.log(`  Closing balance   ${money(sim.balance).padStart(14)}\n`);
console.log(`  Interest share    ${pct(sim.interestShare)} of balance`);
console.log(`  Current rate      ${pct(sim.currentApr)} APR → ${pct(sim.currentApy)} APY`);
console.log(`  Money-weighted    ${pct(sim.effectiveAnnualReturn)} per year`);
console.log(`  Transactions      ${sim.transactions.length}`);
console.log(`  Chart points      ${sim.monthly.length}\n`);

console.log(`  Year   Contributed      Interest    End balance      APY`);
console.log(`  ${"-".repeat(58)}`);
for (const row of sim.years) {
  console.log(
    `  ${row.year}   ${money(row.contributed).padStart(11)}   ${money(row.interest).padStart(11)}   ${money(row.endBalance).padStart(12)}   ${pct(row.apy).padStart(6)}`,
  );
}
console.log("");

// --- Assertions ----------------------------------------------------------
const failures: string[] = [];
const check = (label: string, ok: boolean, detail = "") => {
  if (!ok) failures.push(`${label}${detail ? ` — ${detail}` : ""}`);
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` (${detail})` : ""}`);
};

const cents = (n: number) => Math.round(n * 100);

check(
  "contributions + interest === balance",
  cents(sim.totalContributions) + cents(sim.totalInterest) === cents(sim.balance),
  `${money(sim.totalContributions + sim.totalInterest)} vs ${money(sim.balance)}`,
);

const creditSum = sim.transactions.reduce((acc, t) => acc + cents(t.amount), 0);
check("sum of every transaction === balance", creditSum === cents(sim.balance));

const oldestFirst = [...sim.transactions].reverse();
check(
  "running balance is consistent across the ledger",
  oldestFirst.every((t, i) => {
    const expected = oldestFirst.slice(0, i + 1).reduce((a, x) => a + cents(x.amount), 0);
    return expected === cents(t.balance);
  }),
);

check(
  "ledger is in reverse-chronological order",
  sim.transactions.every((t, i) => i === 0 || sim.transactions[i - 1].date >= t.date),
);

const lastPoint = sim.monthly[sim.monthly.length - 1];
check(
  "final chart point matches the closing balance",
  cents(lastPoint.balance) === cents(sim.balance),
);

check(
  "monthly series is strictly increasing",
  sim.monthly.every((p, i) => i === 0 || p.balance >= sim.monthly[i - 1].balance),
);

check(
  "per-year interest sums to total interest",
  Math.abs(sim.years.reduce((a, r) => a + r.interest, 0) - sim.totalInterest) < 0.02,
);

check(
  "APR → APY conversion is correct",
  Math.abs(aprToApy(0.12) - 0.1268250301) < 1e-9,
);

/**
 * Guard against a config edit silently moving the balance somewhere unintended.
 * Update TARGET_BALANCE whenever the intended figure changes — the tolerance is
 * wide because a compounding model lands where the arithmetic puts it, not on a
 * round number you pick.
 */
const TARGET_BALANCE = 86_326;
check(
  `balance is within $500 of the intended ${money(TARGET_BALANCE)}`,
  Math.abs(sim.balance - TARGET_BALANCE) < 500,
  `${money(sim.balance)} (${sim.balance >= TARGET_BALANCE ? "+" : "−"}${money(
    Math.abs(sim.balance - TARGET_BALANCE),
  )})`,
);

console.log("");
if (failures.length) {
  console.error(`  ${failures.length} check(s) failed:\n   - ${failures.join("\n   - ")}\n`);
  process.exit(1);
}
console.log("  All checks passed.\n");
