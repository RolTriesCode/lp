STEP:
22 — Structured Lesson Editor

REASONING:
EXTRA HIGH

OBJECTIVE:
Build the main lesson editor around the canonical structured lesson object with Tiptap for rich editable fields.

REFERENCE:
Section 14 of `implementation.md`; use `/public/reference/lesson-editor.png` if it exists when executed.

FILES / AREAS:
Lesson editor route and components, Tiptap extensions, lesson draft store, section navigation, editor styles

IMPLEMENTATION:
- Read installed Tiptap and Next.js integration documentation before implementation and install only the required Tiptap packages.
- Render lesson metadata, standards, objectives, subject matter, procedures, assessment, assignment, and reflection as distinct structured sections.
- Use Tiptap where rich text provides value while keeping arrays, IDs, and section boundaries in the canonical lesson object.
- Synchronize editor changes to the draft store through focused adapters without replacing the complete lesson on each keystroke.
- Support adding, removing, and reordering suitable list or procedure blocks with stable IDs and accessible controls.
- Provide an editor toolbar with only necessary formatting and preserve heading semantics in display and export data.
- Show saved or unsaved prototype state without claiming remote persistence.
- Make the content and assistant rail responsive and keyboard navigable.

DO NOT:
- Convert the lesson into one HTML blob.
- Rebuild Tiptap state during every React render.
- Add collaboration, comments, or database autosave in this phase.

ACCEPTANCE CRITERIA:
- Every canonical lesson section is editable without losing structure.
- Changes update only the intended field or block.
- Reloaded prototype drafts preserve valid edits.
- Editor interactions have no console, hydration, focus, or TypeScript errors.
