/**
 * ============================================================================
 *  MODEL CONFIGURATION — every tunable number lives here.
 * ============================================================================
 *
 *  Nothing in this project is a hard-coded balance or a hand-written
 *  transaction list. The dashboard renders whatever this configuration
 *  produces once it is run through `lib/simulation.ts`.
 *
 *  Want a different ending balance? Change MONTHLY_CONTRIBUTION or
 *  OPENING_DEPOSIT and every figure, chart and transaction re-derives itself
 *  consistently. Run `npm run verify` to print the resulting totals.
 * ============================================================================
 */

/** Fictional institution. Not a real bank — see DISCLAIMER below. */
export const BRAND = {
  name: "Northlake Savings",
  shortName: "Northlake",
  productName: "Northlake High-Yield Savings",
  tagline: "Compound growth, made visible",
} as const;

/**
 * The simulated account holder. Deliberately a placeholder name so the page
 * cannot read as a specific real person's account.
 */
export const ACCOUNT_HOLDER = {
  name: "Allan Williams",
  accountLabel: "High-Yield Savings",
  accountNumberMasked: "••••  ••••  82372",
  openedOn: "2019-01-02",
} as const;

/**
 * The fictional external account that funds the monthly transfers.
 * Also invented — "Cedar Street" is not a real institution.
 */
export const LINKED_ACCOUNT = {
  institution: "Cedar Street Credit Union",
  type: "Everyday Checking",
  numberMasked: "••••  4021",
  linkedOn: "2019-01-02",
  status: "Verified",
} as const;

/**
 * ---------------------------------------------------------------------------
 *  TIMELINE
 * ---------------------------------------------------------------------------
 *  The brief asked for deposits "dating back to 2019" and, separately, for
 *  "approximately six years" of history. Those two no longer describe the same
 *  span, so the model follows the more specific instruction (2019) and the UI
 *  reports the true elapsed time.
 *
 *  To make it exactly six years instead, set START to the January six years
 *  before AS_OF and re-run `npm run verify`.
 */
export const START_YEAR = 2019;
export const START_MONTH = 0; // 0 = January

/**
 * `null` = roll forward with the real calendar, so the demo always looks
 * current. Pin it to an ISO date (e.g. "2026-07-31") to freeze the numbers.
 */
export const AS_OF: string | null = null;

/** Day of month the recurring transfer lands. */
export const TRANSFER_DAY = 3;

/**
 * ---------------------------------------------------------------------------
 *  CONTRIBUTIONS
 * ---------------------------------------------------------------------------
 */
export const OPENING_DEPOSIT = 1_800;

/** Recurring monthly transfer, stepped up over time (pay rises). */
export const MONTHLY_CONTRIBUTION: Record<number, number> = {
  2019: 465,
  2020: 490,
  2021: 515,
  2022: 560,
  2023: 610,
  2024: 660,
  2025: 705,
  2026: 755,
  2027: 800,
  2028: 850,
};

/** One-off top-ups. Keeps the history from looking mechanically uniform. */
export const LUMP_SUMS: ReadonlyArray<{
  date: string;
  amount: number;
  label: string;
}> = [
  { date: "2020-03-13", amount: 1_200, label: "Tax refund transfer" },
  { date: "2021-12-17", amount: 1_500, label: "Year-end bonus transfer" },
  { date: "2023-03-10", amount: 1_000, label: "Tax refund transfer" },
  { date: "2024-12-20", amount: 2_000, label: "Year-end bonus transfer" },
  { date: "2025-06-06", amount: 900, label: "Additional savings transfer" },
];

/**
 * ---------------------------------------------------------------------------
 *  INTEREST
 * ---------------------------------------------------------------------------
 *  Nominal annual rate (APR), compounded monthly. Interest posts on the final
 *  day of each statement cycle, calculated on that cycle's closing balance:
 *
 *      interest = balance × (APR ÷ 12)
 *
 *  The effective annual yield the UI displays is derived from it:
 *
 *      APY = (1 + APR ÷ 12)^12 − 1
 *
 *  The rate path loosely tracks the real savings-rate environment across the
 *  period, which is what makes the growth curve interesting to study: the flat
 *  stretch in 2020–21 and the steep climb from 2023 are the whole lesson.
 */
export const APR_BY_YEAR: Record<number, number> = {
  2019: 0.0215,
  2020: 0.0068,
  2021: 0.0048,
  2022: 0.0185,
  2023: 0.0425,
  2024: 0.0455,
  2025: 0.0398,
  2026: 0.0372,
  2027: 0.036,
  2028: 0.035,
};

export const DEFAULT_APR = 0.035;

/**
 * ---------------------------------------------------------------------------
 *  SIGN-IN
 * ---------------------------------------------------------------------------
 *  A front-end gate so the walkthrough starts from a login screen, exactly as
 *  a real dashboard would.
 *
 *  This is NOT security, and it cannot be made into security by changing the
 *  values below. The check runs in the browser, so both strings are readable
 *  by anyone who opens developer tools or reads the repository — and all the
 *  account data ships in the JavaScript bundle regardless of whether anyone
 *  signs in at all. Treat it as a front door, not a lock.
 *
 *  Real per-user accounts need a server. See the Supabase notes in the README.
 */
export const SIGN_IN = {
  username: "allan.williams",
  password: "Northlake2019",
} as const;

/**
 * Prefill both fields so the demo is a single click.
 *
 * Set to `false` for an empty form, which looks more like a real bank login
 * when presenting — at the cost of having to type the credentials each time.
 */
export const PREFILL_SIGN_IN = true;

/**
 * ---------------------------------------------------------------------------
 *  DISCLAIMER — shown in the top ribbon, the footer, and on print.
 * ---------------------------------------------------------------------------
 *  Please leave this in place. It is what keeps the project on the right side
 *  of the line: an educational model rather than something that could be
 *  mistaken for a real account record.
 */
export const DISCLAIMER_SHORT = "Simulation";

export const DISCLAIMER_LONG =
  "Northlake Savings is a fictional institution. All balances, deposits and " +
  "interest payments shown are produced by a compound-interest model. This is " +
  "not a bank statement and is not evidence of funds.";
