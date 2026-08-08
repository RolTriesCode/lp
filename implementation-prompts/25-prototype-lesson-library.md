STEP:
25 — Prototype Lesson Library

REASONING:
HIGH

OBJECTIVE:
Complete the local prototype lesson lifecycle before Supabase by supporting save, reopen, duplicate, delete, and draft recovery.

REFERENCE:
Sections 12, 14, 21, 30, and 32 of `implementation.md`

FILES / AREAS:
Prototype lesson repository adapter, Zustand store, dashboard recent lessons integration, lesson list route if needed, confirmation dialog, tests

IMPLEMENTATION:
- Extend the versioned prototype repository behind the existing persistence interface.
- Support create, list, read, update, duplicate, and delete operations for validated LessonPlan records.
- Track status, created time, updated time, and schema version without changing the canonical lesson content shape.
- Connect dashboard Recent Lesson Plans actions to real prototype behavior and refresh local UI consistently.
- Add a focused lesson-library page only if required to make View all functional; preserve the established application shell.
- Use an accessible confirmation dialog for deletion and make local deletion recoverable during the current session when practical.
- Add deterministic migration or invalid-record handling for previously stored prototype drafts.
- Keep the adapter API compatible with a future Supabase implementation.

DO NOT:
- Add login, remote sync, collaboration, or pretend local data is cloud-saved.
- Couple UI components directly to browser storage.
- Store invalid lesson objects.

ACCEPTANCE CRITERIA:
- Teachers can save, reopen, duplicate, and delete local prototype lessons.
- Dashboard records reflect local changes without reload errors.
- All persisted records pass the canonical schema.
- The repository can later be replaced without rewriting editor components.
