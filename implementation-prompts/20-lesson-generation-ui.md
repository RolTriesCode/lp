STEP:
20 — Lesson Generation UI

REASONING:
HIGH

OBJECTIVE:
Connect `/lesson/create` to the generation API with honest structured progress, cancellation, errors, and successful editor navigation.

REFERENCE:
Section 13 of `implementation.md`; use a lesson-create reference if available.

FILES / AREAS:
Lesson create form, generation status component, API client helper, draft store, navigation to `/lesson/[id]`

IMPLEMENTATION:
- Submit validated form values to the lesson generation endpoint from a focused client component.
- Show staged status labels: reading lesson details, preparing curriculum context, creating objectives, designing activities, building assessment, and finalizing lesson.
- Mark only locally completed preflight stages as complete. For generation stages without server telemetry, use an indeterminate current state and never show invented percentages or timed fake completion.
- Disable duplicate submissions while preserving form values.
- Support AbortController cancellation and a clear retry path after recoverable failure.
- Map server error categories to concise teacher-friendly messages while retaining accessible status announcements.
- On success, create a prototype lesson ID, place the validated lesson in the shared draft state, and navigate to `/lesson/[id]`.
- Preserve the generated lesson if navigation must be retried.

DO NOT:
- Simulate a successful lesson when the API fails.
- Discard the teacher’s input after errors.
- Reveal provider names or raw technical errors in the normal UI.

ACCEPTANCE CRITERIA:
- Valid submissions call the API exactly once and expose cancel and retry behavior.
- Progress is structured, accessible, and does not claim unsupported percentages.
- Errors preserve user input and focus an actionable message.
- Successful generation navigates with a validated draft ready for editing.
