STEP:
09 — Dashboard Teaching Schedule

REASONING:
MEDIUM

OBJECTIVE:
Implement the local weekly teaching schedule panel shown in the dashboard reference.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Teaching schedule component, dashboard mock data, dashboard styles

IMPLEMENTATION:
- Render the section from typed schedule mock data.
- Match the reference heading, View Calendar control, date column, lesson title, grade and subject metadata, row dividers, Teach and Assess badges, and full-calendar action.
- Use semantic time or date markup where practical and meaningful button labels.
- Keep the panel compact and aligned with Recent Lesson Plans at the reference viewport.
- Add restrained hover and focus feedback to interactive controls.
- Provide a sensible stacked or hidden-lower-priority treatment at narrower breakpoints, coordinated with the responsive dashboard step.

DO NOT:
- Build full calendar logic, drag-and-drop scheduling, recurrence, reminders, or notifications.
- Add schedule fields not visible in the reference.
- Generate dates at render time.

ACCEPTANCE CRITERIA:
- The panel is visually faithful and data-driven.
- Schedule rows have consistent alignment and accessible labels.
- Buttons remain prototype-safe and do not navigate to broken pages.
- The panel does not cause horizontal overflow.
