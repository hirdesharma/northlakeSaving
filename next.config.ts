import type { NextConfig } from "next";

/**
 * Two deploy targets from one codebase:
 *
 *   npm run build    → standard Next build. Use this for Vercel / Netlify / Node hosting.
 *   npm run export   → fully static HTML in ./out. Upload to any domain, cPanel,
 *                      GitHub Pages, S3 — no Node runtime required.
 *
 * The app is entirely client-rendered from a deterministic model, so both
 * targets produce identical output.
 */
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  ...(isStaticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
  trailingSlash: isStaticExport,
  reactStrictMode: true,
};

export default nextConfig;
