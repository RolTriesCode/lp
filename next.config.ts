import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SENTRY_RELEASE:
      process.env.NEXT_PUBLIC_SENTRY_RELEASE
      || process.env.SENTRY_RELEASE
      || process.env.VERCEL_GIT_COMMIT_SHA
      || "",
  },
};

const canUploadSourceMaps = Boolean(
  process.env.SENTRY_AUTH_TOKEN
  && process.env.SENTRY_ORG
  && process.env.SENTRY_PROJECT,
);

export default withSentryConfig(nextConfig, {
  applicationKey: "aralai",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
    excludeTracing: true,
  },
  errorHandler(error) {
    console.warn("Sentry source-map processing was skipped:", error.message);
  },
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  release: {
    create: canUploadSourceMaps,
    name: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
  },
  silent: !canUploadSourceMaps,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
    disable: !canUploadSourceMaps,
  },
  telemetry: false,
  webpack: {
    automaticVercelMonitors: false,
    treeshake: {
      excludeReplayCompressionWorker: true,
      excludeReplayIframe: true,
      excludeReplayShadowDOM: true,
      removeDebugLogging: true,
      removeTracing: true,
    },
  },
});
