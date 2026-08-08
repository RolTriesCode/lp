STEP:
30 — PDF Export

REASONING:
HIGH

OBJECTIVE:
Add a reliable on-demand PDF export for structured lesson plans after the higher-priority DOCX export is complete.

REFERENCE:
Sections 7 and 17 of `implementation.md`

FILES / AREAS:
`lib/documents/pdf/`, export route or server action, editor export menu, print or server-rendered document styles, PDF fixtures and tests

IMPLEMENTATION:
- Inspect the deployed runtime requirements and compare reliable server-side PDF generation strategies that are compatible with Next.js 16 and Vercel.
- Select the smallest maintainable strategy that produces consistent teacher-document output; document the choice and its runtime constraints.
- Render from the canonical LessonPlan object rather than from the current browser DOM or editor HTML.
- Support lesson metadata, standards, objectives, subject matter, procedures, assessment, assignment, reflection, page numbers, and optional teacher profile fields.
- Keep formatting aligned with the DOCX teacher-document style while adapting tables, page breaks, margins, fonts, and headers for PDF.
- Validate the lesson before export and return a correctly named PDF with the correct MIME type and download headers.
- Preserve Unicode Filipino content and verify Detailed, Semi-Detailed, MATATAG, and ILAW fixtures.
- Add pending, success, and failure feedback without losing editor state.

DO NOT:
- Treat PDF export as higher priority than DOCX or PPTX.
- Export screenshots, raw browser chrome, or unvalidated editor markup.
- Use the PDF ingestion parser as the PDF generation mechanism.
- Store generated PDF files permanently during the prototype.

ACCEPTANCE CRITERIA:
- Valid lessons download as openable, selectable-text PDF files.
- Pagination, tables, headings, and Unicode text remain legible and stable.
- Output comes from structured lesson data and matches the formal export language.
- Export failures are recoverable and expose no server internals.
