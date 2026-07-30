"use client";

import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { TransactionTable } from "@/components/TransactionTable";
import { dateLong, money } from "@/lib/format";
import { getSimulation } from "@/lib/simulation";

export default function TransactionsPage() {
  return (
    <AppShell>
      <ActivityView />
    </AppShell>
  );
}

function ActivityView() {
  const sim = useMemo(() => getSimulation(), []);
  const deposits = sim.transactions.filter((t) => t.kind !== "interest");
  const interest = sim.transactions.filter((t) => t.kind === "interest");

  return (
    <div className="space-y-5 rise">
      <header className="watermark rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          Account activity
        </h1>
        <p className="mt-1 max-w-prose text-[13.5px] leading-relaxed text-ink-2">
          Deposits and interest payments from the opening deposit on{" "}
          {dateLong(sim.openedOn)} through {dateLong(sim.asOf)}.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Deposits"
          value={String(deposits.length)}
          detail={`${money(sim.totalContributions, 0)} paid in`}
          accent="var(--color-series-1)"
        />
        <StatTile
          label="Interest payments"
          value={String(interest.length)}
          detail={`${money(sim.totalInterest, 0)} earned`}
          accent="var(--color-series-2)"
        />
        <StatTile
          label="Largest interest payment"
          value={money(Math.max(...interest.map((t) => t.amount)), 2)}
          detail="A later month, on a larger balance"
        />
        <StatTile
          label="Closing balance"
          value={money(sim.balance, 0)}
          detail="Deposits plus all interest"
        />
      </div>

      <TransactionTable transactions={sim.transactions} filterable />
    </div>
  );
}
