import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'coin-images.coingecko.com' },
      { protocol: 'https', hostname: 'assets.coingecko.com' },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "chainintel",
  project: "chainintel-terminal",
  silent: true,
  widenClientFileUpload: true,
  // Skip source map upload if no auth token (prevents Vercel build failures)
  authToken: process.env.SENTRY_AUTH_TOKEN || '',
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
