STEP:
12 — Dashboard to Create Lesson Navigation

REASONING:
HIGH

OBJECTIVE:
Connect valid dashboard form submissions to `/lesson/create` while preserving typed lesson input values for the next screen.

REFERENCE:
`implementation.md`; no additional visual reference is required beyond the dashboard form.

FILES / AREAS:
Dashboard lesson form, shared lesson-input schema, Next.js router usage, `/lesson/create` route boundary

IMPLEMENTATION:
- Reuse the dashboard form’s Zod schema and inferred TypeScript type.
- On valid submission, construct safe URL search parameters for curriculum, grade, subject, lesson type, quarter, topic, duration, optional competency, and additional instructions when present.
- Navigate through the Next.js App Router to `/lesson/create`.
- Encode values with `URLSearchParams`; do not manually concatenate an unsafe query string.
- Keep optional empty values out of the URL and define deterministic defaults for the create screen.
- Preserve validation errors and focus behavior on invalid submission.
- Add a minimal `/lesson/create` receiver only if the route does not exist, without building the full screen assigned to Step 14.
- Test back navigation and direct access with partial or malformed query values.

DO NOT:
- Call AI generation, add database state, use local storage as the primary transfer mechanism, or duplicate the schema.
- Trust arbitrary search parameters without parsing them on the receiving screen.

ACCEPTANCE CRITERIA:
- Valid form data navigates to `/lesson/create` with correctly encoded values.
- Invalid data stays on the dashboard with accessible errors.
- Direct URLs with unsupported values fall back safely.
- The shared schema remains reusable for the generation API.
