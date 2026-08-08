STEP:
35 — Templates, Curriculum Browser, and Resources

REASONING:
HIGH

OBJECTIVE:
Build reusable template, verified curriculum browsing, and teaching-resource workflows on top of the existing structured schemas.

REFERENCE:
Sections 1, 18, and 30 of `implementation.md`

FILES / AREAS:
`app/templates/`, curriculum browser route, resources route, template schemas, local repositories, dashboard and editor navigation

IMPLEMENTATION:
- Define a template schema that stores reusable lesson defaults and structured section patterns without embedding provider-specific instructions.
- Build template list, preview, create-from-lesson, apply-to-new-lesson, rename, duplicate, and delete prototype behavior.
- Build a curriculum browser over verified local curriculum records with filters for curriculum, grade, subject, and quarter.
- Display provenance and verification state and allow a verified competency to populate the create-lesson flow.
- Build a resource library view for uploaded references and reusable teaching resources using the existing local repository interfaces.
- Preserve the application shell, reference-derived UI language, accessible tables or lists, empty states, and responsive behavior.
- Keep all local repositories replaceable by Supabase implementations.

DO NOT:
- Fabricate missing official curriculum content.
- Create a template marketplace, social sharing, billing, or team collaboration.
- Duplicate canonical lesson or curriculum validation logic.

ACCEPTANCE CRITERIA:
- Templates can be created, previewed, applied, duplicated, and deleted locally.
- Verified curriculum records can safely populate lesson inputs.
- Resource records are centralized and reusable.
- Navigation from dashboard and editor reaches functional pages rather than dead controls.
