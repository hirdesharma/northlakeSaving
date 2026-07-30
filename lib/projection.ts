/**
 * The what-if calculator behind /projection.
 *
 * Same arithmetic as the account engine, run forward over adjustable inputs so
 * the effect of each variable can be isolated. This is the part of the project
 * that actually answers the maths question: how much of a long-run balance is
 * contributed, and how much is compounding?
 */

export interface ProjectionInput {
  /** Balance the projection starts from. */
  startingBalance: number;
  monthlyContribution: number;
  /** Nominal annual rate, compounded monthly. */
  annualRate: number;
  years: number;
}

export interface ProjectionPoint {
  monthIndex: number;
  /** Years elapsed, for the x-axis. */
  t: number;
  /** Cumulative money paid in, including the starting balance. */
  contributions: number;
  interest: number;
  balance: number;
  /** The same deposits with no interest at all — the comparison line. */
  withoutInterest: number;
}

export interface ProjectionResult {
  points: ProjectionPoint[];
  finalBalance: number;
  totalContributions: number;
  totalInterest: number;
  withoutInterest: number;
  /** How much of the final balance came from compounding. */
  interestShare: number;
  /** Effective annual yield implied by monthly compounding. */
  apy: number;
  /** Years until the balance doubles at this rate with no further deposits. */
  doublingYears: number;
}

export function project(input: ProjectionInput): ProjectionResult {
  const { startingBalance, monthlyContribution, annualRate, years } = input;
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = annualRate / 12;

  let balance = startingBalance;
  let contributions = startingBalance;
  let interest = 0;

  const points: ProjectionPoint[] = [
    {
      monthIndex: 0,
      t: 0,
      contributions: startingBalance,
      interest: 0,
      balance: startingBalance,
      withoutInterest: startingBalance,
    },
  ];

  for (let m = 1; m <= months; m++) {
    balance += monthlyContribution;
    contributions += monthlyContribution;

    const earned = balance * monthlyRate;
    balance += earned;
    interest += earned;

    points.push({
      monthIndex: m,
      t: m / 12,
      contributions: round2(contributions),
      interest: round2(interest),
      balance: round2(balance),
      withoutInterest: round2(startingBalance + monthlyContribution * m),
    });
  }

  const finalBalance = round2(balance);
  const withoutInterest = round2(startingBalance + monthlyContribution * months);

  return {
    points,
    finalBalance,
    totalContributions: round2(contributions),
    totalInterest: round2(interest),
    withoutInterest,
    interestShare: finalBalance > 0 ? interest / finalBalance : 0,
    apy: (1 + monthlyRate) ** 12 - 1,
    // Rule of 72 is the classroom shortcut; this is the exact solve.
    doublingYears:
      annualRate > 0 ? Math.log(2) / (12 * Math.log(1 + monthlyRate)) : Infinity,
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
