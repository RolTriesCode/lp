import * as Sentry from "@sentry/nextjs";
import { initializeSentry } from "@/lib/monitoring/sentry";

initializeSentry("browser");

export const onRouterTransitionStart: typeof Sentry.captureRouterTransitionStart = (...args) => {
  try {
    Sentry.captureRouterTransitionStart(...args);
  } catch {
    // Navigation must continue if the monitoring SDK is unavailable.
  }
};
