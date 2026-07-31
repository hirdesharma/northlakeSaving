/**
 * Sign-in.
 *
 * A front-end gate so the walkthrough starts where a real dashboard would.
 * Deliberately NOT security — the comparison happens in the browser, so the
 * credentials are readable by anyone who looks, and the account data ships in
 * the bundle either way. See the README for swapping in Supabase Auth when
 * there is a real backend.
 */

import { SIGN_IN } from "./config";

const KEY = "northlake.session";

/**
 * `remember` decides which store the session lands in: localStorage survives
 * closing the browser, sessionStorage ends with the tab.
 */
export function signIn(username: string, password: string, remember = false): boolean {
  const ok =
    username.trim().toLowerCase() === SIGN_IN.username.toLowerCase() &&
    password === SIGN_IN.password;

  if (ok && typeof window !== "undefined") {
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(KEY, String(Date.now()));
  }
  return ok;
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  // Clear both, so signing out always signs out regardless of which box was ticked.
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
}

export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.localStorage.getItem(KEY) !== null ||
    window.sessionStorage.getItem(KEY) !== null
  );
}
