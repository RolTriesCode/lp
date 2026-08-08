STEP:
17 — AI Provider Abstraction

REASONING:
EXTRA HIGH

OBJECTIVE:
Implement a secure internal AI provider layer using the Vercel AI SDK with Groq, Cerebras, and OpenRouter routing and fallback support.

REFERENCE:
Sections 5 and 9 of `implementation.md`

FILES / AREAS:
`lib/ai/router.ts`, `lib/ai/providers/`, environment validation, AI error types, provider tests, package configuration

IMPLEMENTATION:
- Read the installed Vercel AI SDK and provider documentation versions before coding; do not rely on stale APIs.
- Install only required AI SDK and provider packages that are not already present.
- Define provider-independent request capabilities for structured generation, rewriting, and fallback rather than exposing raw provider clients.
- Implement server-only provider adapters for Groq, Cerebras, and OpenRouter with environment-variable validation and normalized errors.
- Route fast rewriting or assistant work toward Groq, long structured lesson generation toward the configured long-context provider, and unavailable or failed primary requests toward OpenRouter when safe.
- Make routing policy configurable through server-side environment settings without exposing provider choice to normal users.
- Add timeout, cancellation, retry-boundary, and error-classification behavior. Avoid automatic retries for invalid input or safety failures.
- Ensure prompts and responses are logged only through privacy-safe metadata, never raw classroom or teacher content.

DO NOT:
- Import provider SDKs in client components.
- Expose keys, model IDs, provider selectors, or raw upstream errors to users.
- Couple lesson schemas to a single model.

ACCEPTANCE CRITERIA:
- Server code can request a capability without knowing the concrete provider.
- Missing configuration and provider failures produce normalized actionable errors.
- Fallback behavior is deterministic and testable.
- Client bundles contain no provider keys or server-only modules.
