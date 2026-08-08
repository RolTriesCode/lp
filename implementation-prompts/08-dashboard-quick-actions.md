STEP:
08 — Dashboard Quick Actions

REASONING:
MEDIUM

OBJECTIVE:
Implement the dashboard shortcuts for lesson plans and teaching-material generation using the reference card language.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Quick actions component, dashboard styles, Lucide icon mapping

IMPLEMENTATION:
- Build four actions: Create Lesson Plan, Generate Presentation, Create Assessment, and Create Worksheet.
- Match the reference card row’s dimensions, gaps, borders, radii, text hierarchy, colored icon containers, and right-side utility icon placement.
- Use Lucide icons with consistent optical size and stroke weight.
- Make the entire card a semantic button or link with a visible focus state.
- Make Create Lesson Plan focus or scroll to the dashboard form.
- Keep the other actions as safe prototype controls until their routes exist.
- Add only subtle hover feedback through color, border, and a very small transform if it does not cause layout shift.

DO NOT:
- Add fake generation flows, modals, counters, or extra explanatory copy.
- Use GSAP, looping animation, or large hover movement.

ACCEPTANCE CRITERIA:
- All four actions match the dashboard design language and align in one desktop row.
- Create Lesson Plan reliably moves focus to the intake form.
- Cards are keyboard accessible and responsive.
- Reduced-motion users do not receive transform animation.
