STEP:
14 — Lesson Create Screen

REASONING:
HIGH

OBJECTIVE:
Build `/lesson/create` as the complete review and adjustment screen before AI lesson generation.

REFERENCE:
`implementation.md`; use `/public/reference/lesson-create.png` if it exists when this prompt is executed, otherwise extend the established dashboard design language.

FILES / AREAS:
`app/lesson/create/page.tsx`, lesson create components, shared lesson-input schema and option data, application shell, route search-parameter parsing

IMPLEMENTATION:
- Read `implementation.md`, inspect the completed dashboard, and check for a lesson-create reference before editing.
- Parse dashboard query values with the shared Zod schema and populate a React Hook Form.
- Let teachers review and adjust curriculum, lesson type, grade, subject, quarter, competency, topic, duration, class size, available resources, language, and additional instructions.
- Provide sensible typed defaults for direct visits and safe fallbacks for malformed query parameters.
- Preserve the application shell and reference-derived typography, spacing, controls, focus states, and responsive behavior.
- Present one clear primary Generate Lesson action and an obvious path back to the dashboard.
- Reserve a structured generation-status region for Step 20 without simulating generation in this step.
- Keep the form schema suitable for server-side lesson generation.

DO NOT:
- Add model calls, fake progress, Supabase, authentication, or a rich-text editor.
- Invent a separate design direction when no screen-specific reference exists.

ACCEPTANCE CRITERIA:
- Dashboard query values hydrate the form correctly without mismatch warnings.
- All fields validate accessibly through React Hook Form and Zod.
- Direct and malformed URLs recover gracefully.
- The screen is responsive and production-ready for later API connection.
