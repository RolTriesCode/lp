STEP:
39 — Calendar, Weekly Planner, and Classroom Context

REASONING:
HIGH

OBJECTIVE:
Expand the local dashboard schedule into useful planning workflows and reusable classroom context without building an enterprise calendar system.

REFERENCE:
Sections 24 and 30 of `implementation.md`

FILES / AREAS:
`app/calendar/`, schedule schemas and repositories, dashboard schedule integration, classroom-context settings, lesson-create defaults

IMPLEMENTATION:
- Define typed schedule entries linked optionally to lessons, assessments, and teaching packs.
- Build week and month views with accessible date navigation, create, edit, move, and delete behavior.
- Keep interactions practical for keyboard and touch; use native or Radix primitives for dialogs and selects.
- Update the dashboard’s weekly schedule from persisted schedule data with clear empty states.
- Add reusable classroom context for class size, language, available resources, learner needs, preferred duration, and teacher notes.
- Let teachers intentionally apply classroom context as defaults during lesson creation and AI actions.
- Keep sensitive learner information out of free-form context guidance and document safe usage.
- Use URL state for shareable calendar date and filters.

DO NOT:
- Add external calendar sync, reminders, notifications, recurrence engines, or drag-heavy behavior that excludes keyboard users.
- Put calendar filters into global Zustand state without need.
- Send classroom context to AI when it is unrelated to the request.

ACCEPTANCE CRITERIA:
- Teachers can manage a useful weekly and monthly teaching plan.
- Dashboard schedule reflects the same data source.
- Classroom context can populate relevant lesson defaults by explicit choice.
- Calendar and settings work responsively and accessibly.
