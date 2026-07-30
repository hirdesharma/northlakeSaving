/**
 * Demo sign-in.
 *
 * This is a front-end gate so the walkthrough starts where a real dashboard
 * would. It is deliberately NOT security: the credentials are printed on the
 * sign-in page, and all model data ships in the JavaScript bundle regardless.
 * See the README for swapping in Supabase Auth when there is a real backend.
 */

import { DEMO_CREDENTIALS } from "./config";

const KEY = "northlake.session";

export function signIn(username: string, password: string): boolean {
  const ok =
    username.trim().toLowerCase() === DEMO_CREDENTIALS.username &&
    password === DEMO_CREDENTIALS.password;
  if (ok && typeof window !== "undefined") {
    window.sessionStorage.setItem(KEY, String(Date.now()));
  }
  return ok;
}

export function signOut(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
}

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(KEY) !== null;
}
