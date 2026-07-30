/**
 * ============================================================================
 *  THE COMPOUND-INTEREST ENGINE
 * ============================================================================
 *
 *  Everything the dashboard shows is produced here. There are no stored
 *  balances and no hand-written transaction list — the account history is
 *  replayed month by month from `lib/config.ts` every time the app loads.
 *
 *  All money is held internally as integer cents. Currency in floating point
 *  accumulates error over ~90 compounding steps, and this project is
 *  specifically about the accuracy of that accumulation, so the arithmetic
 *  reconciles exactly:
 *
 *      openingDeposit + Σ deposits + Σ interest === closing balance
 *
 *  `npm run verify` asserts precisely that.
 * ============================================================================
 */

import {
  ACCOUNT_HOLDER,
  APR_BY_YEAR,
  AS_OF,
  DEFAULT_APR,
  LINKED_ACCOUNT,
  LUMP_SUMS,
  MONTHLY_CONTRIBUTION,
  OPENING_DEPOSIT,
  START_MONTH,
  START_YEAR,
  TRANSFER_DAY,
} from "./config";

export type TransactionKind = "opening" | "deposit" | "interest";

export interface Transaction {
  id: string;
  /** ISO `yyyy-mm-dd`. */
  date: string;
  kind: TransactionKind;
  description: string;
  /** Secondary line — funding source, or the rate the interest was earned at. */
  detail: string;
  /** Dollars. Always a credit in this model; the account has no withdrawals. */
  amount: number;
  /** Running balance in dollars immediately after this entry posted. */
  balance: number;
}

/** One end-of-month snapshot — the series behind the growth chart. */
export interface MonthPoint {
  /** `yyyy-mm`. */
  month: string;
  date: string;
  label: string;
  /** Cumulative money paid in, dollars. */
  contributions: number;
  /** Cumulative interest earned, dollars. */
  interest: number;
  /** contributions + interest, dollars. */
  balance: number;
  apr: number;
}

export interface YearSummary {
  year: number;
  contributed: number;
  interest: number;
  endBalance: number;
  apr: number;
  apy: number;
  /** Interest as a share of that year's closing balance. */
  interestShare: number;
}

export interface Simulation {
  transactions: Transaction[];
  monthly: MonthPoint[];
  years: YearSummary[];
  balance: number;
  totalContributions: number;
  totalInterest: number;
  /** Interest ÷ balance. The headline insight of the whole project. */
  interestShare: number;
  currentApr: number;
  currentApy: number;
  /** Whole months elapsed since the account opened. */
  monthsElapsed: number;
  yearsElapsed: number;
  asOf: string;
  openedOn: string;
  /**
   * Money-weighted annualised return. Solved numerically (bisection on NPV),
   * because with irregular contributions a simple "total interest ÷ total
   * paid in" figure understates the return badly.
   */
  effectiveAnnualReturn: number;
}

// ---------------------------------------------------------------------------
// Date helpers — all UTC, so the model is identical in every timezone.
// ---------------------------------------------------------------------------

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const daysInMonth = (y: number, m: number) =>
  new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function resolveAsOf(): { year: number; month: number; day: number; iso: string } {
  const now = AS_OF ? new Date(`${AS_OF}T00:00:00Z`) : new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  return { year, month, day, iso: iso(year, month, day) };
}

const aprFor = (year: number) => APR_BY_YEAR[year] ?? DEFAULT_APR;

/** Nominal annual rate → effective annual yield, monthly compounding. */
export const aprToApy = (apr: number) => (1 + apr / 12) ** 12 - 1;

// ---------------------------------------------------------------------------
// The model
// ---------------------------------------------------------------------------

const toCents = (dollars: number) => Math.round(dollars * 100);
const toDollars = (cents: number) => cents / 100;

export function runSimulation(): Simulation {
  const asOf = resolveAsOf();
  const openedOn = ACCOUNT_HOLDER.openedOn;

  const transactions: Transaction[] = [];
  const monthly: MonthPoint[] = [];

  let balanceCents = 0;
  let contributedCents = 0;
  let interestCents = 0;
  let seq = 0;

  /** Cash flows for the money-weighted return solve: [yearsFromStart, amount]. */
  const flows: Array<[number, number]> = [];
  const startMs = Date.UTC(START_YEAR, START_MONTH, 1);
  const yearsFromStart = (dateIso: string) =>
    (new Date(`${dateIso}T00:00:00Z`).getTime() - startMs) /
    (365.2425 * 24 * 3600 * 1000);

  const post = (
    date: string,
    kind: TransactionKind,
    description: string,
    detail: string,
    amountCents: number,
  ) => {
    balanceCents += amountCents;
    if (kind === "interest") interestCents += amountCents;
    else contributedCents += amountCents;

    transactions.push({
      id: `tx-${String(++seq).padStart(4, "0")}`,
      date,
      kind,
      description,
      detail,
      amount: toDollars(amountCents),
      balance: toDollars(balanceCents),
    });

    if (kind !== "interest") flows.push([yearsFromStart(date), toDollars(amountCents)]);
  };

  const lumpsByMonth = new Map<string, typeof LUMP_SUMS>();
  for (const lump of LUMP_SUMS) {
    const key = lump.date.slice(0, 7);
    lumpsByMonth.set(key, [...(lumpsByMonth.get(key) ?? []), lump]);
  }

  let year = START_YEAR;
  let month = START_MONTH;
  let monthsElapsed = 0;

  // Walk forward one statement cycle at a time until we reach the current month.
  while (year < asOf.year || (year === asOf.year && month <= asOf.month)) {
    const isCurrentMonth = year === asOf.year && month === asOf.month;
    const lastDay = daysInMonth(year, month);
    const monthKey = `${year}-${pad(month + 1)}`;

    // --- 1. Opening deposit (first cycle only) --------------------------
    if (year === START_YEAR && month === START_MONTH) {
      post(
        openedOn,
        "opening",
        "Account opening deposit",
        `From ${LINKED_ACCOUNT.institution} ${LINKED_ACCOUNT.numberMasked}`,
        toCents(OPENING_DEPOSIT),
      );
    }

    // --- 2. Recurring transfer ------------------------------------------
    const contribution = MONTHLY_CONTRIBUTION[year] ?? 0;
    const transferHasHappened = !isCurrentMonth || asOf.day >= TRANSFER_DAY;
    if (contribution > 0 && transferHasHappened) {
      post(
        iso(year, month, Math.min(TRANSFER_DAY, lastDay)),
        "deposit",
        "Recurring transfer",
        `From ${LINKED_ACCOUNT.institution} ${LINKED_ACCOUNT.numberMasked}`,
        toCents(contribution),
      );
    }

    // --- 3. One-off top-ups ---------------------------------------------
    for (const lump of lumpsByMonth.get(monthKey) ?? []) {
      const lumpDay = Number(lump.date.slice(8, 10));
      if (isCurrentMonth && lumpDay > asOf.day) continue;
      post(
        lump.date,
        "deposit",
        lump.label,
        `From ${LINKED_ACCOUNT.institution} ${LINKED_ACCOUNT.numberMasked}`,
        toCents(lump.amount),
      );
    }

    // --- 4. Interest posting --------------------------------------------
    // Interest closes the cycle, so it only posts once the cycle is complete.
    // The current month therefore shows deposits but no interest yet, which is
    // exactly how a real statement cycle behaves.
    const apr = aprFor(year);
    if (!isCurrentMonth) {
      const monthlyRate = apr / 12;
      const earned = Math.round(balanceCents * monthlyRate);
      if (earned > 0) {
        post(
          iso(year, month, lastDay),
          "interest",
          "Interest payment",
          `${(apr * 100).toFixed(2)}% APR ÷ 12 on $${toDollars(
            balanceCents,
          ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          earned,
        );
      }
    }

    monthly.push({
      month: monthKey,
      date: isCurrentMonth ? asOf.iso : iso(year, month, lastDay),
      label: `${MONTH_NAMES[month]} ${year}`,
      contributions: toDollars(contributedCents),
      interest: toDollars(interestCents),
      balance: toDollars(balanceCents),
      apr,
    });

    monthsElapsed++;
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // Newest first for display; the running balances were computed oldest-first.
  transactions.reverse();

  // --- Per-year rollup ---------------------------------------------------
  const years: YearSummary[] = [];
  let previousEnd = 0;
  const byYear = new Map<number, MonthPoint[]>();
  for (const point of monthly) {
    const y = Number(point.month.slice(0, 4));
    byYear.set(y, [...(byYear.get(y) ?? []), point]);
  }
  for (const [y, points] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const last = points[points.length - 1];
    const priorInterest = years.reduce((sum, row) => sum + row.interest, 0);
    const interest = round2(last.interest - priorInterest);
    const contributed = round2(last.contributions - previousEnd);
    previousEnd = last.contributions;
    const apr = aprFor(y);
    years.push({
      year: y,
      contributed,
      interest,
      endBalance: last.balance,
      apr,
      apy: aprToApy(apr),
      interestShare: last.balance > 0 ? last.interest / last.balance : 0,
    });
  }

  const balance = toDollars(balanceCents);
  const totalContributions = toDollars(contributedCents);
  const totalInterest = toDollars(interestCents);

  return {
    transactions,
    monthly,
    years,
    balance,
    totalContributions,
    totalInterest,
    interestShare: balance > 0 ? totalInterest / balance : 0,
    currentApr: aprFor(asOf.year),
    currentApy: aprToApy(aprFor(asOf.year)),
    monthsElapsed,
    yearsElapsed: monthsElapsed / 12,
    asOf: asOf.iso,
    openedOn,
    effectiveAnnualReturn: solveMoneyWeightedReturn(flows, balance, yearsFromStart(asOf.iso)),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Money-weighted annual return (an IRR). Finds the rate r where every
 * contribution, grown at r for the time it was actually invested, sums to the
 * closing balance. Bisection over 0–50% — the function is monotonic in r, so
 * 200 halvings converge far past the precision we display.
 */
function solveMoneyWeightedReturn(
  flows: Array<[number, number]>,
  finalValue: number,
  horizonYears: number,
): number {
  if (!flows.length || horizonYears <= 0) return 0;

  const futureValue = (r: number) =>
    flows.reduce((sum, [t, amount]) => sum + amount * (1 + r) ** (horizonYears - t), 0);

  let low = 0;
  let high = 0.5;
  if (futureValue(high) < finalValue) return high;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    if (futureValue(mid) < finalValue) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

/** Single shared instance — the model is deterministic, so one run is enough. */
let cached: Simulation | null = null;
export function getSimulation(): Simulation {
  if (!cached) cached = runSimulation();
  return cached;
}
