"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { isVercelObservabilityEnabled, speedInsightsSampleRate } from "@/lib/monitoring/config";
import { sanitizeCoarsePageEvent } from "@/lib/monitoring/privacy";

export function ProductObservability() {
  if (!isVercelObservabilityEnabled()) return null;

  return (
    <>
      <Analytics
        beforeSend={(event) => sanitizeCoarsePageEvent(event)}
        debug={false}
        mode="production"
      />
      <SpeedInsights
        beforeSend={(event) => sanitizeCoarsePageEvent(event)}
        debug={false}
        sampleRate={speedInsightsSampleRate()}
      />
    </>
  );
}
