STEP:
23 — Section-Level AI Actions

REASONING:
HIGH

OBJECTIVE:
Add targeted AI actions that modify one selected lesson section while preserving the rest of the lesson.

REFERENCE:
Sections 9 and 14 of `implementation.md`

FILES / AREAS:
Section-action route handler, `lib/ai/rewrite-section.ts`, action schemas, editor controls, draft-store patch actions, tests

IMPLEMENTATION:
- Define validated actions for improve, simplify, expand, shorten, formalize, regenerate, add activity, and create assessment where contextually appropriate.
- Send only the selected section, minimal neighboring context, lesson metadata, curriculum constraints, and teacher instruction required for the action.
- Route rewriting through the provider abstraction and validate the returned section against its exact Zod subsection schema.
- Preserve stable IDs where the action edits content; generate new IDs only for genuinely new blocks.
- Apply the result as an atomic patch to the selected section, leaving all other lesson fields untouched.
- Provide pending, cancel, error, retry, and success feedback near the affected section.
- Preserve the previous section value for undo and restore it if validation or generation fails.
- Add mocked service and store tests proving unrelated sections never change.

DO NOT:
- Regenerate the entire lesson for a section request.
- Send unnecessary student, teacher, or full-document context.
- Apply unvalidated provider output.

ACCEPTANCE CRITERIA:
- Each action updates only its intended section.
- Failed actions leave the lesson unchanged and recoverable.
- Output respects the selected curriculum and lesson type.
- Keyboard and screen-reader users receive clear action state feedback.
