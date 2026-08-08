STEP:
37 — Supabase Persistence and Storage

REASONING:
EXTRA HIGH

OBJECTIVE:
Replace prototype repositories with Supabase-backed persistence and add secure uploaded-reference storage while preserving the same application interfaces.

REFERENCE:
Sections 18, 20, 21, and 30 of `implementation.md`

FILES / AREAS:
Supabase repository implementations, server actions or route handlers, editor autosave, artifact persistence, Storage buckets and policies, migration utility

IMPLEMENTATION:
- Implement repository adapters for lesson plans, presentations, assessments, worksheets, templates, and uploaded resources using the interfaces established during the prototype.
- Validate every JSONB payload against its canonical Zod schema on write and read.
- Add create, list, read, update, duplicate, and delete operations with ownership-ready query boundaries.
- Replace editor prototype saving with debounced remote autosave that exposes saving, saved, offline, conflict, and failed states.
- Prevent stale writes using updated timestamps or a revision field and provide a clear conflict recovery path.
- Create private Supabase Storage buckets and policies for teacher references, school logos, lesson attachments, and generated images when an implemented workflow produces them.
- Upload references through validated server or signed flows, persist metadata, and delete files when their owning resource is permanently removed.
- Continue generating DOCX and PPTX exports on demand rather than storing them permanently.
- Provide an explicit one-time import path for valid local prototype lessons.

DO NOT:
- Trust JSONB content without schema validation.
- Use public buckets for private teacher documents.
- Hide failed saves or overwrite newer remote data silently.

ACCEPTANCE CRITERIA:
- Core artifacts persist and reload through Supabase repositories.
- Autosave state is accurate and conflict-aware.
- Uploaded references are private and ownership-scoped.
- Prototype local data can be imported safely or left untouched.
