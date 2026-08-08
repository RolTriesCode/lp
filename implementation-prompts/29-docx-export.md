STEP:
29 — DOCX Lesson Export

REASONING:
HIGH

OBJECTIVE:
Generate formal, teacher-ready Word lesson-plan documents from the canonical lesson object using `docx`.

REFERENCE:
Section 16 of `implementation.md`

FILES / AREAS:
`lib/documents/docx/`, export route or server action, editor export menu, document fixtures and tests

IMPLEMENTATION:
- Read the installed `docx` package documentation before implementation.
- Build a structured document renderer for metadata, standards, objectives, subject matter, procedures, assessment, assignment, and reflection.
- Support distinct formatting needs for Detailed and Semi-Detailed plans and curriculum-specific section labels where required.
- Use formal teacher-document typography, margins, headings, tables, page breaks, headers, and footers where they improve clarity.
- Define optional profile fields for school, teacher, date, grade level, learning area, and quarter without requiring authentication yet.
- Generate files on demand with safe filenames and the correct MIME type.
- Preserve Unicode Filipino content and list formatting.
- Add tests that inspect document structure and confirm valid output for both curricula and lesson types.

DO NOT:
- Export the editor’s raw HTML or a Markdown string.
- Add persistent file storage in this step.
- Allow missing optional profile data to break export.

ACCEPTANCE CRITERIA:
- Valid lessons download as openable `.docx` files.
- Document sections reflect structured lesson data accurately.
- Detailed and Semi-Detailed formats are distinguishable and readable.
- Export errors are surfaced clearly without losing editor state.
