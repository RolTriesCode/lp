STEP:
32 — Worksheet Generator

REASONING:
HIGH

OBJECTIVE:
Build a structured, printable worksheet generator with a separate answer key.

REFERENCE:
Sections 14 and 30 of `implementation.md`

FILES / AREAS:
`schemas/worksheet.ts`, `lib/ai/generate-worksheet.ts`, `lib/ai/prompts/worksheet.ts`, `app/worksheets/`, print styles and tests

IMPLEMENTATION:
- Define a Zod schema for worksheet metadata, learner directions, content blocks, item IDs, response areas, optional hints, point values, and answer-key entries.
- Accept a validated lesson or selected lesson sections, grade, language, difficulty, target length, and teacher instructions.
- Generate through the AI service layer and validate every response.
- Build an editor and preview that supports common printable item structures without coupling to a single lesson subject.
- Provide separate student and answer-key renderings with print-safe page sizing, margins, contrast, and page breaks.
- Allow teachers to edit, add, remove, and reorder worksheet blocks before printing or exporting.
- Connect worksheet actions from the dashboard and lesson editor.
- Add tests for answer consistency, printable structure, invalid output, and missing lesson context.

DO NOT:
- Use screenshots as printable output.
- Mix answer content into the student worksheet.
- Add remote persistence yet.

ACCEPTANCE CRITERIA:
- A lesson can produce a validated editable worksheet.
- Student and answer-key versions print cleanly and separately.
- Worksheet structure works across the subject examples in the guide.
- Failed generation preserves the teacher’s options and source lesson.
