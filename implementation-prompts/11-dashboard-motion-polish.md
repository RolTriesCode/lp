STEP:
11 — Dashboard Motion Polish

REASONING:
MEDIUM

OBJECTIVE:
Add subtle Motion-based feedback that improves hierarchy and interaction clarity without distracting from lesson planning.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Dashboard Motion wrappers, cards, active navigation indicator, menus, form validation messages, reduced-motion styles

IMPLEMENTATION:
- Use Motion for a short initial content fade and vertical settle, the sidebar active indicator, light card feedback, dropdown appearance where Radix CSS is insufficient, and form-error entrance.
- Keep durations between 150ms and 300ms with restrained easing.
- Animate opacity and transforms rather than layout-affecting properties.
- Preserve immediate access to content and interactions during entrance motion.
- Use Motion’s reduced-motion utilities and CSS `prefers-reduced-motion` handling to disable nonessential movement.
- Keep animation components narrowly scoped so static server-rendered content does not become client-rendered unnecessarily.
- Check that hover feedback does not move surrounding content or produce flicker.

DO NOT:
- Add GSAP, ScrollTrigger, scroll-jacking, parallax, staggered spectacle, or looping effects.
- Animate every component.
- Delay navigation or form submission for animation.

ACCEPTANCE CRITERIA:
- Motion is subtle, fast, and productivity-focused.
- Reduced-motion mode removes nonessential transitions.
- No hydration warnings, layout shifts, or animation-related console errors occur.
- Dashboard visual hierarchy remains faithful to the static reference.
