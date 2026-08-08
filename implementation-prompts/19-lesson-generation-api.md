STEP:
19 — Lesson Generation API

REASONING:
EXTRA HIGH

OBJECTIVE:
Build the server-side lesson generation pipeline from validated input through provider routing to validated structured lesson JSON.

REFERENCE:
Sections 7 through 9 and the prototype success criteria in `implementation.md`

FILES / AREAS:
`app/api/ai/lesson/route.ts` or a focused server action, `lib/ai/generate-lesson.ts`, provider router, prompt builders, lesson schemas, API tests

IMPLEMENTATION:
- Accept only the shared lesson-input shape and validate the request before any provider call.
- Resolve verified curriculum context and choose the correct MATATAG or ILAW prompt builder.
- Call the provider abstraction using the Vercel AI SDK structured-output capability supported by the installed version.
- Validate the returned object with the canonical lesson schema and preserve authoritative input fields such as curriculum, grade, subject, and verified competency code.
- Return a stable typed success envelope and a sanitized error envelope suitable for the UI.
- Handle malformed model output, provider unavailability, timeout, cancellation, rate limiting, and fallback exhaustion.
- Include request correlation IDs and privacy-safe diagnostics without logging raw lesson content.
- Add tests with mocked providers for success, validation failure, timeout, and fallback cases.

DO NOT:
- Expose provider keys or upstream stack traces.
- Return unvalidated JSON, Markdown, or partially trusted objects.
- Save to Supabase in this phase.

ACCEPTANCE CRITERIA:
- Valid input returns a complete canonical LessonPlan object.
- Invalid client input never reaches a provider.
- Invalid model output is rejected and reported safely.
- Provider fallback and error behavior are covered by tests.
