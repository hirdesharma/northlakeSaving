import { LINKED_ACCOUNT } from "@/lib/config";
import { dateLong, money } from "@/lib/format";

/**
 * The fictional external account the recurring transfers arrive from.
 * "Cedar Street Credit Union" is invented for this project.
 */
export function ConnectedAccountCard({
  monthlyTransfer,
  transferDay,
  transferCount,
}: {
  monthlyTransfer: number;
  transferDay: number;
  transferCount: number;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-1 p-4 sm:p-5">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink">
        Connected account
      </h2>
      <p className="mt-0.5 text-[13px] text-ink-2">Where the monthly deposits come from.</p>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft"
        >
          <svg viewBox="0 0 20 20" className="h-4.5 w-4.5" fill="none" stroke="var(--color-brand-ink)" strokeWidth="1.5">
            <path d="M3 8l7-4 7 4" strokeLinejoin="round" />
            <path d="M4.5 8v7M15.5 8v7M8 8v7M12 8v7" strokeLinecap="round" />
            <path d="M2.5 15.5h15" strokeLinecap="round" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium text-ink">
            {LINKED_ACCOUNT.institution}
          </p>
          <p className="tnum mt-0.5 text-[12.5px] text-ink-2">
            {LINKED_ACCOUNT.type} · {LINKED_ACCOUNT.numberMasked}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface-3 px-2 py-0.5 text-[11.5px] font-medium text-ink-2">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-good" />
            {LINKED_ACCOUNT.status}
          </p>
        </div>
      </div>

      <dl className="mt-4 space-y-2.5">
        <Row label="Recurring transfer" value={`${money(monthlyTransfer)} monthly`} />
        <Row label="Transfer date" value={`${transferDay}${ordinal(transferDay)} of each month`} />
        <Row label="Transfers completed" value={String(transferCount)} />
        <Row label="Linked since" value={dateLong(LINKED_ACCOUNT.linkedOn)} />
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5 last:border-0 last:pb-0">
      <dt className="text-[12.5px] text-ink-2">{label}</dt>
      <dd className="tnum text-right text-[13px] font-medium text-ink">{value}</dd>
    </div>
  );
}

const ordinal = (n: number) => {
  const remainder = n % 100;
  if (remainder >= 11 && remainder <= 13) return "th";
  return ["th", "st", "nd", "rd"][n % 10] ?? "th";
};
