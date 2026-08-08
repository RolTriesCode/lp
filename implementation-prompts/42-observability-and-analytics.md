STEP:
42 — Observability and Analytics

REASONING:
MEDIUM

OBJECTIVE:
Add privacy-conscious error monitoring and product analytics after the core workflow is stable.

REFERENCE:
Sections 5 and 25 of `implementation.md`

FILES / AREAS:
Sentry configuration, Vercel Analytics integration, error boundaries, privacy filters, environment configuration, monitoring documentation

IMPLEMENTATION:
- Read current Next.js 16 integration guidance for Sentry and Vercel Analytics before adding packages.
- Add Sentry for server, edge, and browser errors with environment separation, release identification, and source maps configured securely.
- Redact lesson content, teacher instructions, uploaded document text, provider prompts, generated outputs, access tokens, and personal profile fields from events.
- Add route-level and application-level error boundaries with teacher-friendly recovery actions.
- Add Vercel Analytics only for coarse page and performance signals required to understand the product workflow.
- Define a small event vocabulary for lesson-generation start, success, failure category, editor open, and export completion without sending content values.
- Disable or clearly isolate monitoring in local development as appropriate.
- Document environment variables and a verification procedure.

DO NOT:
- Capture raw lesson or document content, keystrokes, provider payloads, or secrets.
- Add session replay without explicit approval and privacy review.
- Let monitoring failures break the application.

ACCEPTANCE CRITERIA:
- Test errors are reported in the correct environment with sensitive data removed.
- Error boundaries recover without losing local editor state where possible.
- Analytics events contain no lesson content or personal data.
- The product remains functional when monitoring is unavailable.
