STEP:
04 — Dashboard Header

REASONING:
MEDIUM

OBJECTIVE:
Implement the fixed dashboard header with reference-matched search, program badge, notifications, and teacher profile controls.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
Dashboard header component, shared header styles, local avatar asset, Radix dropdown components if already available

IMPLEMENTATION:
- Read the project guide and inspect the full-resolution reference header.
- Match the header height, white background, bottom border, grid alignment, sidebar-column brand placement, MATATAG and ILAW badge, control spacing, and right inset.
- Implement the search control with a semantic input, reference placeholder, Lucide Search icon, visible focus state, and Command or Control plus K focus shortcut.
- Implement an accessible notification button with the reference dot treatment and a small prototype dropdown state.
- Implement the teacher avatar, name, role, chevron, and a compact accessible profile menu using Radix primitives.
- Keep icon sizes, border radii, profile divider, control heights, and typography aligned with the screenshot.
- Ensure the header can host the responsive navigation trigger built later.

DO NOT:
- Implement global search, notification delivery, authentication, or profile persistence.
- Add extra utility controls not shown or required.
- Add elaborate menu animation or GSAP.

ACCEPTANCE CRITERIA:
- Header composition matches the desktop reference.
- Search and menus are keyboard accessible and have visible focus states.
- Prototype interactions do not trigger errors or navigation to missing routes.
- The header remains fixed without covering dashboard content.
