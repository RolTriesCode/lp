"use client";

import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { captureMonitoringException } from "@/lib/monitoring/sentry";

type RouteErrorBoundaryProps = {
  area: "application" | "lesson";
  backHref: string;
  backLabel: string;
  error: Error & { digest?: string };
  retry: () => void;
};

export function RouteErrorBoundary({ area, backHref, backLabel, error, retry }: RouteErrorBoundaryProps) {
  useEffect(() => {
    captureMonitoringException(error, {
      area,
      recovery_boundary: area === "lesson" ? "lesson_route" : "application_route",
    });
  }, [area, error]);

  const isLesson = area === "lesson";

  return (
    <DashboardShell currentPath={isLesson ? "/lesson" : ""}>
      <main className="route-terminal panel" role="alert">
        <AlertTriangle aria-hidden="true" />
        <h1>{isLesson ? "This lesson workspace needs to recover" : "This workspace view could not load"}</h1>
        <p>
          {isLesson
            ? "Your saved lesson and browser-held editor draft have not been cleared. Retry the view or return to the lesson library."
            : "Your saved content was not changed. Retry this view or return to a stable workspace page."}
        </p>
        {error.digest ? <small>Recovery reference: {error.digest}</small> : null}
        <div>
          <button className="library-primary-action" onClick={retry} type="button">
            <RefreshCw aria-hidden="true" /> Try again
          </button>
          <Link className="library-secondary-action" href={backHref}>
            <ArrowLeft aria-hidden="true" /> {backLabel}
          </Link>
        </div>
      </main>
    </DashboardShell>
  );
}
