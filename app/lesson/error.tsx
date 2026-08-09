"use client";

import { RouteErrorBoundary } from "@/components/monitoring/route-error-boundary";

export default function LessonError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteErrorBoundary area="lesson" backHref="/lesson" backLabel="Open lesson library" error={error} retry={retry} />;
}
