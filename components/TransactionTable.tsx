"use client";

import { useMemo, useState } from "react";
import type { Transaction } from "@/lib/simulation";
import { dateShort, money } from "@/lib/format";

const KIND_LABEL: Record<Transaction["kind"], string> = {
  opening: "Opening deposit",
  deposit: "Deposit",
  interest: "Interest",
};

function KindIcon({ kind }: { kind: Transaction["kind"] }) {
  const isInterest = kind === "interest";
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
      style={{
        background: isInterest
          ? "color-mix(in srgb, var(--color-series-2) 14%, transparent)"
          : "color-mix(in srgb, var(--color-series-1) 14%, transparent)",
      }}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-4 w-4"
        fill="none"
        stroke={isInterest ? "var(--color-series-2)" : "var(--color-series-1)"}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {isInterest ? (
          <path d="M2.5 12.5L6 8l3 2.5 4.5-6M13.5 4.5H10M13.5 4.5V8" />
        ) : (
          <path d="M8 3v9M4.5 8.5L8 12l3.5-3.5" />
        )}
      </svg>
    </span>
  );
}

export function TransactionTable({
  transactions,
  filterable = false,
  emptyNote = "No activity in this period.",
}: {
  transactions: Transaction[];
  filterable?: boolean;
  emptyNote?: string;
}) {
  const [year, setYear] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");

  const years = useMemo(
    () => [...new Set(transactions.map((t) => t.date.slice(0, 4)))].sort((a, b) => b.localeCompare(a)),
    [transactions],
  );

  const rows = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (year === "all" || t.date.startsWith(year)) &&
          (kind === "all" || t.kind === kind || (kind === "deposit" && t.kind === "opening")),
      ),
    [transactions, year, kind],
  );

  const totals = useMemo(
    () => ({
      count: rows.length,
      deposits: rows.filter((t) => t.kind !== "interest").reduce((a, t) => a + t.amount, 0),
      interest: rows.filter((t) => t.kind === "interest").reduce((a, t) => a + t.amount, 0),
    }),
    [rows],
  );

  return (
    <div>
      {/* One filter row above everything it scopes */}
      {filterable && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface-1 p-3">
          <Select
            label="Year"
            value={year}
            onChange={setYear}
            options={[{ value: "all", label: "All years" }, ...years.map((y) => ({ value: y, label: y }))]}
          />
          <Select
            label="Type"
            value={kind}
            onChange={setKind}
            options={[
              { value: "all", label: "All activity" },
              { value: "deposit", label: "Deposits" },
              { value: "interest", label: "Interest" },
            ]}
          />
          <p className="tnum ml-auto text-[12.5px] text-ink-2">
            {totals.count} entries · {money(totals.deposits)} in · {money(totals.interest)} interest
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-muted">{emptyNote}</p>
        ) : (
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Simulated account activity, most recent first
            </caption>
            <thead>
              <tr className="border-b border-line bg-surface-2">
                <th scope="col" className="px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-2 sm:px-4">
                  Description
                </th>
                <th scope="col" className="hidden px-3 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide text-ink-2 sm:table-cell sm:px-4">
                  Date
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide text-ink-2 sm:px-4">
                  Amount
                </th>
                <th scope="col" className="hidden px-3 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide text-ink-2 md:table-cell sm:px-4">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="px-3 py-2.5 sm:px-4">
                    <div className="flex items-center gap-3">
                      <KindIcon kind={t.kind} />
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {t.description}
                        </p>
                        <p className="truncate text-[12px] text-muted">{t.detail}</p>
                        <p className="tnum mt-0.5 text-[12px] text-muted sm:hidden">
                          {dateShort(t.date)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="tnum hidden whitespace-nowrap px-3 py-2.5 text-[13px] text-ink-2 sm:table-cell sm:px-4">
                    {dateShort(t.date)}
                  </td>
                  <td className="tnum whitespace-nowrap px-3 py-2.5 text-right text-[13.5px] font-medium text-ink sm:px-4">
                    <span className="sr-only">{KIND_LABEL[t.kind]}: </span>+{money(t.amount)}
                  </td>
                  <td className="tnum hidden whitespace-nowrap px-3 py-2.5 text-right text-[13px] text-ink-2 md:table-cell sm:px-4">
                    {money(t.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-line bg-surface-1 px-2.5 py-1.5 text-[13px] text-ink"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
