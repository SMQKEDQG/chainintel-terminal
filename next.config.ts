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
  // Sentry build options
  org: "chainintel",
  project: "chainintel-terminal",
  
  // Suppress source map upload logs
  silent: !process.env.CI,
  
  // Upload source maps for better stack traces
  widenClientFileUpload: true,
  
  // Automatically tree-shake debug logging
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
  },
});
