STEP:
07 — Dashboard Recent Lesson Plans

REASONING:
MEDIUM

OBJECTIVE:
Implement the Recent Lesson Plans section using centralized mock data and reference-matched rows.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Recent lessons component, dashboard mock data, dashboard styles, Radix or shadcn dropdown menu

IMPLEMENTATION:
- Match the section header, View all control, column rhythm, row height, dividers, lesson icons, typography, curriculum badges, dates, statuses, and overflow menu from the reference.
- Render only the lesson information required by the design.
- Use semantic table roles or a real table with correct headers while preserving the responsive visual layout.
- Add an accessible action menu for each lesson using Radix or the project’s shadcn dropdown primitive.
- Include prototype actions: Open, Duplicate, Generate PPT, Export, and Delete.
- Keep actions non-destructive and local in this phase; selecting them must not throw errors.
- Add subtle row, button, highlighted-menu, and focus feedback.

DO NOT:
- Add backend mutations, confirmation flows, persistence, or routes not yet implemented.
- Add lesson metadata absent from the reference.
- Use custom menu positioning logic when Radix provides it.

ACCEPTANCE CRITERIA:
- The section is driven by the central mock lesson data.
- Rows match the reference density and visual hierarchy.
- Every menu works with mouse and keyboard and remains within the viewport.
- The layout has a safe responsive treatment without page-level horizontal overflow.
