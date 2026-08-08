STEP:
41 — Remaining Product Pages and Navigation Integration

REASONING:
HIGH

OBJECTIVE:
Complete the authenticated application shell by connecting every intended navigation destination to a functional, coherent product page.

REFERENCE:
Sections 1, 6, 30, and the completed dashboard design language in `implementation.md`

FILES / AREAS:
Presentation, assessment, worksheet, template, resource, lesson-library, calendar, and settings routes; sidebar and header navigation; shared empty and loading states

IMPLEMENTATION:
- Audit every sidebar, header, quick-action, lesson-row, editor, and teaching-pack control for dead or placeholder behavior.
- Connect My Lesson Plans, Presentations, Assessments, Worksheets, Templates, Resources, Calendar, School and Profile, Preferences, and Help Center to functional routes.
- Build list, search, filter, empty, loading, error, and primary-action states backed by existing repositories.
- Use URL state for shareable filters and selected IDs where useful.
- Keep pages focused on teacher tasks rather than analytics.
- Reuse established application shell, typography, controls, tables, badges, menus, and responsive patterns.
- Add useful Help Center content for the implemented workflows without adding email campaigns or a support-ticket backend.
- Verify deep links, back navigation, not-found behavior, and mobile navigation.

DO NOT:
- Add admin dashboards, social feeds, teams, subscriptions, or advanced theme customization.
- Create visually inconsistent generic CRUD pages.
- Leave controls that look active but do nothing.

ACCEPTANCE CRITERIA:
- Every intended application navigation target resolves to a functional page.
- Lists and filters are typed, accessible, and repository-backed.
- Empty and error states provide a valid next action.
- The whole application remains visually consistent and responsive.
