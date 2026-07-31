"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND, PREFILL_SIGN_IN, SIGN_IN } from "@/lib/config";
import { isSignedIn, signIn } from "@/lib/session";
import { BrandMark } from "@/components/Brand";
import { SiteFooter } from "@/components/AppShell";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState<string>(
    PREFILL_SIGN_IN ? SIGN_IN.username : "",
  );
  const [password, setPassword] = useState<string>(
    PREFILL_SIGN_IN ? SIGN_IN.password : "",
  );
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isSignedIn()) router.replace("/dashboard");
  }, [router]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    if (signIn(username, password, remember)) {
      router.push("/dashboard");
    } else {
      setError("Incorrect username or password.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rise">
          <div className="mb-6 flex items-center justify-between">
            <BrandMark size={44} />
            <ThemeToggle />
          </div>

          <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-ink">
            {BRAND.name}
          </h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">
            {BRAND.tagline}. Sign in to view your savings account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <Field
              id="username"
              label="Username"
              value={username}
              onChange={setUsername}
              autoComplete="username"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />

            {error && (
              <p role="alert" className="text-[12.5px] text-ink-2">
                {error}
              </p>
            )}

            <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--color-brand)]"
              />
              Keep me signed in
            </label>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-[14px] font-semibold text-brand-contrast transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Opening…" : "Sign in"}
            </button>
          </form>

          {/* The disclaimer lives in the footer on this page — no need to say
              it twice on one screen. */}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-ink-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-line bg-surface-1 px-3 py-2.5 text-[14px] text-ink placeholder:text-muted"
      />
    </div>
  );
}
