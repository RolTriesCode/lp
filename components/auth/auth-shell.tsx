import { BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-context" aria-label="About AralAI">
        <Link className="auth-brand" href="/">
          <BookOpen aria-hidden="true" strokeWidth={1.8} />
          <span><strong>AralAI</strong><small>Lesson Planning Assistant</small></span>
        </Link>
        <div className="auth-context-copy">
          <h1>Your lessons, resources, and classroom work stay together.</h1>
          <p>Plan with verified curriculum context and return to every saved draft from one private teacher workspace.</p>
          <ul>
            <li><CheckCircle2 aria-hidden="true" /> Ownership-scoped lesson and resource access</li>
            <li><CheckCircle2 aria-hidden="true" /> Private reference and school asset storage</li>
            <li><CheckCircle2 aria-hidden="true" /> Structured, editable teaching materials</li>
          </ul>
        </div>
        <p className="auth-context-foot">Built for focused lesson planning, not classroom surveillance.</p>
      </section>
      <section className="auth-form-region">{children}</section>
    </main>
  );
}
