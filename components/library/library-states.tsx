import { AlertTriangle, LoaderCircle, type LucideIcon } from "lucide-react";
import Link from "next/link";

export function LibraryLoadingState({ label }: { label: string }) {
  return (
    <div aria-live="polite" className="library-state library-state-loading" role="status">
      <LoaderCircle aria-hidden="true" />
      <div><strong>{label}</strong><span>Validating your saved records…</span></div>
    </div>
  );
}

export function LibraryErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="library-state library-state-error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div><strong>Saved records could not be loaded</strong><span>{message}</span></div>
      <button onClick={onRetry} type="button">Try again</button>
    </div>
  );
}

export function LibraryEmptyState({
  icon: Icon,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="library-empty-state compact">
      <Icon aria-hidden="true" size={27} />
      <h2>{title}</h2>
      <p>{body}</p>
      <Link href={actionHref}>{actionLabel}</Link>
    </div>
  );
}

export function LinkedLessonUnavailable({ message }: { message: string }) {
  return (
    <main className="linked-record-state">
      <AlertTriangle aria-hidden="true" />
      <h1>Linked lesson unavailable</h1>
      <p>{message}</p>
      <div><Link href="/lesson">Open lesson plans</Link><Link href="/dashboard">Return to dashboard</Link></div>
    </main>
  );
}
