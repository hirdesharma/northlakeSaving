"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatTile } from "@/components/StatTile";
import { ProjectionChart } from "@/components/charts/ProjectionChart";
import { money, pct } from "@/lib/format";
import { project } from "@/lib/projection";
import { getSimulation } from "@/lib/simulation";

export default function ProjectionPage() {
  return (
    <AppShell>
      <ProjectionView />
    </AppShell>
  );
}

/**
 * The interactive half of the project.
 *
 * The dashboard shows what one particular set of choices produced; this page
 * lets each variable move independently so its effect can be isolated. Change
 * the rate alone and the wedge between the two lines is the whole answer.
 */
function ProjectionView() {
  const sim = useMemo(() => getSimulation(), []);

  const [monthly, setMonthly] = useState(750);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(20);
  const [fromToday, setFromToday] = useState(true);

  const startingBalance = fromToday ? sim.balance : 0;

  const result = useMemo(
    () =>
      project({
        startingBalance,
        monthlyContribution: monthly,
        annualRate: rate / 100,
        years,
      }),
    [startingBalance, monthly, rate, years],
  );

  const growthMultiple =
    result.withoutInterest > 0 ? result.finalBalance / result.withoutInterest : 0;

  return (
    <div className="space-y-5 rise">
      <header className="rounded-xl border border-line bg-surface-1 p-5 sm:p-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-ink">
          Projection
        </h1>
        <p className="mt-1 max-w-prose text-[13.5px] leading-relaxed text-ink-2">
          Move any of the three inputs and watch what compounding does with the
          difference. Time is the variable that matters most — try dragging the
          years slider on its own.
        </p>
      </header>

      {/* One control row above everything it scopes */}
      <section className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
        <div className="grid gap-5 sm:grid-cols-3">
          <Slider
            label="Monthly deposit"
            value={monthly}
            display={money(monthly, 0)}
            min={0}
            max={2000}
            step={25}
            onChange={setMonthly}
          />
          <Slider
            label="Annual rate"
            value={rate}
            display={`${rate.toFixed(1)}%`}
            min={0}
            max={10}
            step={0.1}
            onChange={setRate}
          />
          <Slider
            label="Years"
            value={years}
            display={`${years} ${years === 1 ? "year" : "years"}`}
            min={1}
            max={40}
            step={1}
            onChange={setYears}
          />
        </div>

        <label className="mt-4 flex items-center gap-2.5 border-t border-line pt-4 text-[13px] text-ink-2">
          <input
            type="checkbox"
            checked={fromToday}
            onChange={(event) => setFromToday(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-brand)]"
          />
          Start from the current simulated balance of {money(sim.balance, 0)}
        </label>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Projected balance"
          value={money(result.finalBalance, 0)}
          detail={`After ${years} ${years === 1 ? "year" : "years"}`}
        />
        <StatTile
          label="Total deposited"
          value={money(result.totalContributions, 0)}
          detail="Including the starting balance"
          accent="var(--color-series-1)"
        />
        <StatTile
          label="Interest earned"
          value={money(result.totalInterest, 0)}
          detail={`${pct(result.interestShare, 1)} of the final balance`}
          accent="var(--color-series-2)"
        />
        <StatTile
          label="Doubling time"
          value={
            Number.isFinite(result.doublingYears)
              ? `${result.doublingYears.toFixed(1)} yrs`
              : "—"
          }
          detail="For the balance alone, with no further deposits"
        />
      </div>

      <ProjectionChart result={result} />

      <section className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          What these numbers say
        </h2>
        <ul className="mt-3 space-y-3">
          <Insight
            headline={
              rate > 0
                ? `${money(result.totalInterest, 0)} of the final balance was never deposited.`
                : "At a 0% rate, the balance is only ever what was paid in."
            }
            body={
              rate > 0
                ? `Deposits alone reach ${money(
                    result.withoutInterest,
                    0,
                  )}. Compounding turns that into ${money(
                    result.finalBalance,
                    0,
                  )} — a multiple of ${growthMultiple.toFixed(2)}×.`
                : "Raise the rate above zero and the two lines begin to separate. The gap between them is the entire subject of this project."
            }
          />
          <Insight
            headline={`${pct(rate / 100)} nominal is ${pct(result.apy)} once it compounds monthly.`}
            body="Interest paid monthly starts earning interest itself, so the effective yield is always slightly above the quoted rate. The shortfall between them widens as the rate rises."
          />
          {Number.isFinite(result.doublingYears) && (
            <Insight
              headline={`Money left alone doubles every ${result.doublingYears.toFixed(1)} years at this rate.`}
              body={`The classroom shortcut — 72 ÷ ${rate.toFixed(
                1,
              )} — estimates ${(72 / rate).toFixed(
                1,
              )} years. The rule of 72 is an approximation of exactly this calculation.`}
            />
          )}
        </ul>
      </section>
    </div>
  );
}

function Insight({ headline, body }: { headline: string; body: string }) {
  return (
    <li className="border-l-2 border-line pl-3.5">
      <p className="text-[13.5px] font-medium leading-snug text-ink">{headline}</p>
      <p className="mt-0.5 max-w-prose text-[12.5px] leading-relaxed text-ink-2">{body}</p>
    </li>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[12.5px] font-medium text-ink-2">
          {label}
        </label>
        <output htmlFor={id} className="text-[15px] font-semibold tracking-tight text-ink">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[var(--color-brand)]"
      />
    </div>
  );
}
