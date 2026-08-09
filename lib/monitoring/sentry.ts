import * as Sentry from "@sentry/nextjs";
import { isSentryEnabled, monitoringEnvironment, monitoringRelease } from "./config";
import { sanitizeSentryEvent } from "./privacy";

export type MonitoringRuntime = "browser" | "edge" | "server";

export function sentryOptions(runtime: MonitoringRuntime): Parameters<typeof Sentry.init>[0] {
  return {
    attachStacktrace: true,
    beforeBreadcrumb: () => null,
    beforeSend: (event) => sanitizeSentryEvent(event),
    beforeSendLog: () => null,
    beforeSendTransaction: () => null,
    dataCollection: {
      cookies: false,
      databaseQueryData: false,
      frameContextLines: 0,
      genAI: { inputs: false, outputs: false },
      graphQL: { document: false, variables: false },
      httpBodies: [],
      httpHeaders: { request: false, response: false },
      stackFrameVariables: false,
      urlQueryParams: false,
      userInfo: false,
    },
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enableLogs: false,
    enabled: isSentryEnabled(),
    environment: monitoringEnvironment(),
    integrations: (defaults) => defaults.filter((integration) => integration.name !== "VercelAI"),
    maxBreadcrumbs: 0,
    release: monitoringRelease(),
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    sampleRate: 1,
    sendClientReports: false,
    sendDefaultPii: false,
    tracePropagationTargets: [],
    tracesSampleRate: 0,
    initialScope: { tags: { runtime } },
  };
}

export function initializeSentry(runtime: MonitoringRuntime): void {
  try {
    Sentry.init(sentryOptions(runtime));
  } catch {
    // Monitoring is deliberately fail-open.
  }
}

export function captureMonitoringException(
  error: unknown,
  tags: Partial<Record<"area" | "category" | "recovery_boundary", string>> = {},
): void {
  if (!isSentryEnabled()) return;
  try {
    Sentry.withScope((scope) => {
      Object.entries(tags).forEach(([key, value]) => {
        if (value) scope.setTag(key, value);
      });
      Sentry.captureException(error);
    });
  } catch {
    // Error reporting must never affect the teacher workflow.
  }
}
