"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { ConnectedAccountCard } from "@/components/ConnectedAccountCard";
import { HeroFigure, StatTile } from "@/components/StatTile";
import { TransactionTable } from "@/components/TransactionTable";
import { GrowthChart } from "@/components/charts/GrowthChart";
import { InterestByYearChart } from "@/components/charts/InterestByYearChart";
import { ACCOUNT_HOLDER, MONTHLY_CONTRIBUTION, TRANSFER_DAY } from "@/lib/config";
import { dateLong, money, pct } from "@/lib/format";
import { getSimulation } from "@/lib/simulation";

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardView />
    </AppShell>
  );
}

/**
 * Rendered only after AppShell confirms a session, which also means it never
 * runs during prerender — so the model always reads from the real current
 * date without risking a hydration mismatch.
 */
function DashboardView() {
  const sim = useMemo(() => getSimulation(), []);

  const currentYear = Number(sim.asOf.slice(0, 4));
  const monthlyTransfer = MONTHLY_CONTRIBUTION[currentYear] ?? 0;
  const transferCount = sim.transactions.filter((t) => t.kind !== "interest").length;
  const interestPayments = sim.transactions.filter((t) => t.kind === "interest").length;

  return (
    <div className="space-y-5 rise">
      {/* --- Account header --------------------------------------------- */}
      <section className="watermark overflow-hidden rounded-xl border border-line bg-surface-1">
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[12.5px] font-medium uppercase tracking-wide text-muted">
                {ACCOUNT_HOLDER.accountLabel}
              </p>
              <p className="tnum mt-1 text-[13px] text-ink-2">
                {ACCOUNT_HOLDER.name} · {ACCOUNT_HOLDER.accountNumberMasked}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <HeroFigure
              label="Current balance"
              value={money(sim.balance)}
              detail={
                <span>
                  <span className="font-medium text-good-ink">
                    +{money(sim.totalInterest)}
                  </span>{" "}
                  earned in interest since {dateLong(sim.openedOn)}
                </span>
              }
            />
          </div>

          <p className="mt-4 text-[12px] text-muted">
            As of {dateLong(sim.asOf)} · {sim.monthsElapsed} statement cycles ·{" "}
            {interestPayments} interest payments
          </p>
        </div>
      </section>

      {/* --- Stat tiles -------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Total deposited"
          value={money(sim.totalContributions, 0)}
          detail={`Across ${transferCount} transfers`}
          accent="var(--color-series-1)"
        />
        <StatTile
          label="Interest earned"
          value={money(sim.totalInterest, 0)}
          detail={`${pct(sim.interestShare, 1)} of the balance`}
          accent="var(--color-series-2)"
        />
        <StatTile
          label="Current rate"
          value={pct(sim.currentApy)}
          detail={`APY · ${pct(sim.currentApr)} APR compounded monthly`}
        />
        <StatTile
          label="Average return"
          value={pct(sim.effectiveAnnualReturn)}
          detail={`Per year over ${sim.yearsElapsed.toFixed(1)} years`}
        />
      </div>

      {/* --- Growth ------------------------------------------------------ */}
      <GrowthChart monthly={sim.monthly} />

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <InterestByYearChart years={sim.years} />
        <ConnectedAccountCard
          monthlyTransfer={monthlyTransfer}
          transferDay={TRANSFER_DAY}
          transferCount={transferCount}
        />
      </div>

      {/* --- How the model works ---------------------------------------- */}
      <section className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          How your interest is calculated
        </h2>
        <p className="mt-1 max-w-prose text-[13px] leading-relaxed text-ink-2">
          Interest is calculated on the closing balance of each statement cycle
          and paid on the last day of the month — {sim.monthsElapsed} cycles so
          far.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-surface-2 p-4">
          <p className="tnum whitespace-nowrap text-[13.5px] text-ink">
            interest<sub className="text-muted">month</sub> = balance ×
            (APR ÷ 12)
          </p>
          <p className="tnum mt-2 whitespace-nowrap text-[13.5px] text-ink">
            balance<sub className="text-muted">next</sub> = balance + deposit +
            interest<sub className="text-muted">month</sub>
          </p>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
            Because each month&rsquo;s interest joins the balance, the following
            month&rsquo;s interest is calculated on a larger figure. That is
            compounding — and it is why {pct(sim.interestShare, 1)} of this
            balance was never deposited by anyone.
          </p>
        </div>

        <p className="mt-3 text-[12.5px] text-ink-2">
          Try the numbers yourself on the{" "}
          <Link href="/projection" className="font-medium text-brand-ink underline underline-offset-2">
            projection page
          </Link>
          .
        </p>
      </section>

      {/* --- Recent activity --------------------------------------------- */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-ink">
              Recent activity
            </h2>
            <p className="text-[13px] text-ink-2">
              The eight most recent entries of {sim.transactions.length}.
            </p>
          </div>
          <Link
            href="/transactions"
            className="whitespace-nowrap text-[13px] font-medium text-brand-ink underline underline-offset-2"
          >
            View all
          </Link>
        </div>
        <TransactionTable transactions={sim.transactions.slice(0, 8)} />
      </section>
    </div>
  );
}
