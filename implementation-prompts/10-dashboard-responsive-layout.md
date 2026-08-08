STEP:
10 — Responsive Dashboard Layout

REASONING:
HIGH

OBJECTIVE:
Adapt the desktop dashboard design for 1024px, 768px, 430px, and 375px widths without merely shrinking the desktop canvas.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Dashboard shell, sidebar, header, form, content-section styles, responsive navigation component

IMPLEMENTATION:
- Preserve the desktop reference as the primary visual source.
- At tablet widths, collapse the fixed sidebar into an accessible menu, reduce nonessential header content, and keep the main task prominent.
- At mobile widths, stack dashboard regions, use full-width form controls, keep tap targets comfortable, and prevent dense table content from widening the page.
- Use layout systems and intentional breakpoints rather than arbitrary absolute positioning.
- Make the mobile navigation keyboard accessible, focus-safe, dismissible, and reusable from the sidebar data.
- Verify the content canvas has no horizontal overflow at 375, 430, 768, 1024, and 1440 CSS pixels.
- Preserve heading hierarchy, form labels, primary actions, and readable content density at every target.
- Respect safe wrapping and truncation for long lesson titles.

DO NOT:
- Hide the primary lesson creation workflow on mobile.
- Solve responsiveness by scaling the entire page or shrinking text below comfortable sizes.
- Introduce a second independent navigation definition.

ACCEPTANCE CRITERIA:
- All target widths have intentional layouts and no page-level horizontal overflow.
- Sidebar navigation collapses cleanly and remains keyboard usable.
- Forms, menus, cards, and tables remain usable with touch.
- Desktop proportions remain faithful to the reference.
