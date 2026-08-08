STEP:
36 — Supabase Foundation

REASONING:
EXTRA HIGH

OBJECTIVE:
Introduce Supabase PostgreSQL, client and server utilities, migrations, and secure access policies after the core prototype workflow is functional.

REFERENCE:
Sections 5 and 18 through 20 of `implementation.md`

FILES / AREAS:
Supabase package configuration, `lib/supabase/client.ts`, `lib/supabase/server.ts`, environment validation, SQL migrations, generated database types, repository interfaces

IMPLEMENTATION:
- Read current Supabase Next.js SSR guidance and the installed Next.js 16 server APIs before implementation.
- Install only the required Supabase JS and SSR packages.
- Add browser and server clients with cookie handling appropriate to the installed framework version, but do not add authentication UI in this step.
- Define migrations for profiles, lesson plans, presentations, assessments, worksheets, templates, and uploaded resources.
- Store generated lesson and artifact content in versioned JSONB columns while keeping searchable metadata in typed columns.
- Include timestamps, status, ownership, schema version, and necessary foreign keys and indexes.
- Add Row Level Security policies that deny anonymous cross-user access and are ready for authenticated ownership in Step 37.
- Generate or maintain strongly typed database definitions and environment validation.
- Keep repository interfaces independent of Supabase client details.

DO NOT:
- Normalize every nested lesson block into a table.
- Add Prisma, Better Auth, service-role keys to client code, or public write policies.
- Migrate local data automatically without an explicit safe path.

ACCEPTANCE CRITERIA:
- Migrations create the required tables, indexes, constraints, and RLS policies.
- Server and browser clients compile without exposing secrets.
- Database types support canonical schema mapping.
- Local development has documented environment and migration steps.
