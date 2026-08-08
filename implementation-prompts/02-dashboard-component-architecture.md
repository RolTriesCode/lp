STEP:
02 — Dashboard Component Architecture

REASONING:
HIGH

OBJECTIVE:
Refactor the dashboard shell into a clean, reusable component architecture without changing its reference-matched appearance.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
`app/dashboard/page.tsx`, `components/dashboard/`, dashboard styles, shared utility modules

IMPLEMENTATION:
- Read `implementation.md`, `AGENTS.md`, and inspect the current dashboard before editing.
- Separate the dashboard into coherent feature components such as shell, sidebar, header, welcome section, create-lesson card, quick actions, recent lessons, and teaching schedule.
- Keep data, presentation, and interaction responsibilities clear. Use small focused components, but do not extract one-off wrappers that add no reuse or clarity.
- Preserve server-component rendering where possible. Keep interactive forms, menus, and Motion wrappers in narrow client components.
- Centralize stable navigation definitions and mock-data interfaces instead of repeating markup.
- Preserve all current layout measurements, classes, accessible labels, and working interactions unless a change is required for the architecture.
- Confirm that server components are passed across client boundaries only through supported serializable props or rendered slots.
- Run lint, TypeScript, and build checks after the refactor.

DO NOT:
- Redesign, restyle, or change visible dashboard content.
- Create a generic component framework or premature abstraction layer.
- Convert the entire dashboard into a client component.
- Add dependencies solely for file organization.

ACCEPTANCE CRITERIA:
- Dashboard features live in logically named, reusable components.
- Repetitive navigation and mock content are data-driven.
- The rendered dashboard remains visually unchanged from the established reference implementation.
- No hydration, import, TypeScript, lint, or build errors are introduced.
