"use client";

import { RouteErrorBoundary } from "@/components/monitoring/route-error-boundary";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteErrorBoundary area="application" backHref="/dashboard" backLabel="Return to dashboard" error={error} retry={retry} />;
}
