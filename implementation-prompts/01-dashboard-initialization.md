STEP:
01 — Dashboard Initialization

REASONING:
MEDIUM

OBJECTIVE:
Establish `/dashboard` as the prototype entry point and recreate the static dashboard shell from the supplied reference without adding backend, authentication, or generation behavior.

REFERENCE:
`implementation.md` and `/public/reference/dashboard.png`

FILES / AREAS:
`app/page.tsx`, `app/dashboard/page.tsx`, `app/layout.tsx`, global styles, dashboard styles, dashboard component directory, package configuration

IMPLEMENTATION:
- Read `implementation.md`, the repository `AGENTS.md`, and the relevant Next.js 16 documentation in `node_modules/next/dist/docs/` before editing.
- Inspect the existing repository and preserve working features, conventions, and user changes.
- Make the root route open or redirect directly to `/dashboard` during prototype development.
- Build the desktop dashboard frame shown in the reference: fixed top header, fixed left sidebar, main content canvas, welcome area, lesson creation area, quick actions, recent lessons, and schedule regions.
- Establish shared visual tokens for the reference palette, typography, borders, radii, shadows, spacing, and focus treatment without inventing a new design system.
- Use server components by default and introduce client boundaries only where interaction requires them.
- Keep the result static and use local placeholder data only where the reference requires content.
- Run lint, TypeScript, and production build checks.

DO NOT:
- Add authentication, Supabase, AI providers, persistence, billing, analytics, or landing-page work.
- Redesign the reference or substitute a generic SaaS dashboard.
- Add GSAP or ScrollTrigger to the dashboard.
- Rewrite unrelated project files.

ACCEPTANCE CRITERIA:
- `/` opens `/dashboard` for prototype development.
- `/dashboard` contains the complete reference-shaped shell at desktop size.
- The layout uses the existing stack and has no broken imports or TypeScript errors.
- The page has no obvious horizontal overflow at the reference viewport.
- Lint, type checking, and the production build pass.
