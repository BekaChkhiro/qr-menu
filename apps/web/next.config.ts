import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@digital-menu/database', '@digital-menu/types'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload source maps for better error tracking
  widenClientFileUpload: true,

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Webpack-specific options
  webpack: {
    // Tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Automatically instrument for Vercel performance monitoring
    automaticVercelMonitors: true,
  },
};

// Apply both plugins - withNextIntl first, then Sentry
const configWithIntl = withNextIntl(nextConfig);

// Only wrap with Sentry when DSN is configured — avoids breaking local dev
// when Sentry deps are not fully installed.
export default process.env.SENTRY_DSN
  ? withSentryConfig(configWithIntl, sentryWebpackPluginOptions)
  : configWithIntl;
