const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

function publicFlag(value: string | undefined): boolean {
  return value ? TRUE_VALUES.has(value.toLowerCase()) : false;
}

export function monitoringEnvironment(): string {
  return process.env.NEXT_PUBLIC_APP_ENV
    || process.env.VERCEL_ENV
    || process.env.NODE_ENV
    || "unknown";
}

export function monitoringRelease(): string | undefined {
  return process.env.NEXT_PUBLIC_SENTRY_RELEASE
    || process.env.SENTRY_RELEASE
    || process.env.VERCEL_GIT_COMMIT_SHA
    || undefined;
}

function isDefaultLocalEnvironment(): boolean {
  return new Set(["development", "local", "test"]).has(monitoringEnvironment().toLowerCase());
}

export function isSentryEnabled(): boolean {
  return publicFlag(process.env.NEXT_PUBLIC_SENTRY_ENABLED)
    && Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
    && !isDefaultLocalEnvironment();
}

export function isVercelObservabilityEnabled(): boolean {
  return publicFlag(process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED)
    && !isDefaultLocalEnvironment();
}

export function speedInsightsSampleRate(): number {
  const parsed = Number(process.env.NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE ?? "0.2");
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : 0.2;
}
