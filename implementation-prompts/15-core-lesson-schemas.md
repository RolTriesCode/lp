STEP:
15 — Core Structured Lesson Schemas

REASONING:
EXTRA HIGH

OBJECTIVE:
Define the canonical Zod-validated lesson data architecture that will power editing, generation, exports, assessments, worksheets, and presentations.

REFERENCE:
Sections 7, 8, 9, and 35 of `implementation.md`

FILES / AREAS:
`schemas/lesson.ts`, lesson input schema, shared types, schema tests, ID helpers

IMPLEMENTATION:
- Read the full guide and audit existing lesson-related schemas before changing them.
- Model curriculum type, lesson type, title, grade, subject, quarter, week, duration, standards, objectives, subject matter, references, materials, values integration, procedure blocks, assessment items, assignment, and reflection as Zod schemas.
- Infer TypeScript types from Zod rather than maintaining parallel handwritten interfaces.
- Give editable nested blocks stable IDs and define clear required, optional, default, and length constraints.
- Support Detailed and Semi-Detailed lesson plans without collapsing both into one unstructured text field.
- Provide safe parse helpers for untrusted AI or persistence data and strict parse paths for trusted internal construction.
- Add schema versioning or an explicit version field so stored JSON can evolve later.
- Add representative valid fixtures and tests for invalid curriculum values, incomplete procedures, malformed assessments, and missing required lesson metadata.
- Export schemas for the editor, AI service, route handlers, and document generators.

DO NOT:
- Store the lesson as one Markdown or HTML string.
- Use `any`, provider-specific fields, database client types, or UI component state in the schema.
- Invent official curriculum codes.

ACCEPTANCE CRITERIA:
- One canonical lesson schema supports every downstream product surface.
- Valid MATATAG and ILAW Detailed and Semi-Detailed fixtures parse successfully.
- Invalid or incomplete external data fails with actionable Zod issues.
- Tests, lint, type checking, and build pass.
