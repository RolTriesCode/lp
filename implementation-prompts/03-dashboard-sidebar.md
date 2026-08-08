STEP:
03 — Dashboard Sidebar

REASONING:
MEDIUM

OBJECTIVE:
Implement the left dashboard navigation rail to match the reference and make its navigation structure reusable.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Dashboard sidebar component, navigation data, dashboard styles, active-indicator Motion component

IMPLEMENTATION:
- Read the source guide and inspect the reference at original resolution before editing.
- Match the desktop rail width, top offset, background, right border, internal padding, vertical density, typography, icon sizes, colored creation icons, and bottom promotional area.
- Keep the brand lockup aligned with the sidebar column in the fixed header.
- Represent Dashboard, Create, Manage, and Settings groups through typed navigation data rather than repeated JSX.
- Mark Dashboard as the active page with `aria-current="page"`, the reference violet foreground, and a restrained Motion active indicator.
- Use Lucide icons that most closely match the reference. Keep standard icons outlined and creation icons inside the small colored blocks shown in the design.
- Add subtle hover and visible keyboard focus states without changing row dimensions.
- Keep the component suitable for reuse inside a later mobile navigation surface.

DO NOT:
- Add full collapse state management or route-specific business logic yet.
- Add new navigation destinations not supported by the guide.
- Use decorative gradients, heavy shadows, or large animations.

ACCEPTANCE CRITERIA:
- Sidebar dimensions and vertical rhythm align with the reference.
- Navigation is generated from strongly typed reusable data.
- Active, hover, and focus states are accessible and visually restrained.
- Settings, help, and the bottom template promotion remain visible at the reference viewport.
- No horizontal overflow or desktop content overlap is introduced.
