"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { DISCLAIMER_LONG } from "@/lib/config";
import { isSignedIn, signOut } from "@/lib/session";
import { SimulationChip, Wordmark } from "./Brand";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/transactions", label: "Activity" },
  { href: "/projection", label: "Projection" },
];

/**
 * Frame for every signed-in page: the simulation ribbon, header, navigation
 * and footer.
 *
 * The ribbon and the footer disclaimer are load-bearing, not decoration. They
 * are what keeps this an educational model rather than something that could be
 * mistaken for a real account record — the client's own brief asks for exactly
 * that. Please keep them in place.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) router.replace("/");
    else setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-surface-1/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Link href="/dashboard" className="rounded-md">
              <Wordmark />
            </Link>
            <span aria-hidden className="hidden text-muted/40 sm:inline">·</span>
            <SimulationChip />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                signOut();
                router.replace("/");
              }}
              className="rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>

        <nav aria-label="Sections" className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-block whitespace-nowrap border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                      active
                        ? "border-brand text-ink"
                        : "border-transparent text-ink-2 hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <p className="print-disclaimer">{DISCLAIMER_LONG}</p>
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-line bg-surface-2">
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
        <p className="max-w-3xl text-[12px] leading-relaxed text-muted">
          {DISCLAIMER_LONG}
        </p>
      </div>
    </footer>
  );
}
