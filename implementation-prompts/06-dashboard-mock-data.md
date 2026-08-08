STEP:
06 — Dashboard Mock Data

REASONING:
LOW

OBJECTIVE:
Centralize realistic prototype lesson, schedule, and quick-action data for the dashboard.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
`data/dashboard.ts` or the project’s established equivalent, dashboard type definitions, dashboard consumers

IMPLEMENTATION:
- Read the source guide and inspect the current dashboard data usage.
- Create strongly typed local mock records for recent lessons and the weekly teaching schedule.
- Include realistic examples from the guide, including Types of Metrical Feet, Photosynthesis, Fractions, and Subject-Verb Agreement, with appropriate grades, subjects, curriculum types, lesson types, update times, and statuses.
- Keep display-only metadata limited to what the reference UI requires.
- Move repeated mock values out of UI components and update consumers to import the data.
- Use stable IDs suitable for menus and future prototype routing.
- Keep the module free of React and rendering concerns.

DO NOT:
- Add Supabase, fetch calls, generated random values, or dates that change during hydration.
- Scatter fallback mock objects across components.
- Add analytics metrics that distract from the action-focused dashboard.

ACCEPTANCE CRITERIA:
- Dashboard data is defined in one dedicated typed module.
- Dashboard sections render solely from the centralized records.
- Data is deterministic across server and client rendering.
- Existing visuals and interactions remain intact.
