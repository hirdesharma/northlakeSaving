import type { Metadata, Viewport } from "next";
import { BRAND, DISCLAIMER_LONG } from "@/lib/config";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — Educational Savings Simulation`,
    template: `%s · ${BRAND.name} (Simulation)`,
  },
  description: DISCLAIMER_LONG,
  applicationName: BRAND.name,
  // Not indexed: this is a teaching model, and it has no business turning up
  // in search results where the context would be missing.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

/**
 * Applies the stored theme before first paint. Without this the page renders
 * light, then flips — jarring, and it makes the charts recolour mid-load.
 */
const THEME_SCRIPT = `
try {
  var t = localStorage.getItem('northlake.theme');
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
