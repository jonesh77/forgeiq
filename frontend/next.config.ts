import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Build-time TS errors are tolerated so deployments don't break on type-only issues.
    // Errors are still shown in `pnpm dev`.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async rewrites() {
    return [
      // Static design-system preview lives under public/redesign/. Next.js
      // doesn't auto-resolve index.html for public folders, so we map the
      // pretty URL to the actual file. /redesign/assets/* still works as-is.
      { source: "/redesign", destination: "/redesign/index.html" },
      { source: "/redesign/", destination: "/redesign/index.html" },
      { source: "/redesign-v2", destination: "/redesign-v2/index.html" },
      { source: "/redesign-v2/", destination: "/redesign-v2/index.html" },
      // Design System (7) — four variants under /redesign-v3/*
      { source: "/redesign-v3", destination: "/redesign-v3/index.html" },
      { source: "/redesign-v3/", destination: "/redesign-v3/index.html" },
      { source: "/redesign-v3/light", destination: "/redesign-v3/index-light.html" },
      { source: "/redesign-v3/robotis", destination: "/redesign-v3/index-robotis.html" },
      { source: "/redesign-v3/dashboard", destination: "/redesign-v3/dashboard.html" },
    ];
  },
};

export default nextConfig;
