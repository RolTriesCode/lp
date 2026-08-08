STEP:
31 — Assessment Generator

REASONING:
HIGH

OBJECTIVE:
Build a structured assessment generator with answer keys that derives context from a lesson plan.

REFERENCE:
Sections 7, 14, 30, and 32 of `implementation.md`

FILES / AREAS:
`schemas/assessment.ts`, `lib/ai/generate-assessment.ts`, `lib/ai/prompts/assessment.ts`, `app/assessments/`, assessment components and tests

IMPLEMENTATION:
- Define Zod schemas for assessment metadata, instructions, sections, item IDs, points, answer keys, and multiple choice, true or false, identification, essay, and performance-task item types.
- Accept a validated lesson, selected objectives or sections, difficulty, item counts, language, and teacher instructions.
- Generate through the provider abstraction and validate all output before display.
- Prevent answer leakage in the student version and create a separate answer-key view.
- Build a responsive generator and editor that lets teachers review, edit, add, remove, and reorder items.
- Provide printable student and answer-key layouts.
- Connect assessment actions from the dashboard and lesson editor using lesson IDs or validated prototype state.
- Add tests for item-type validation, option and answer consistency, point totals, and provider failure.

DO NOT:
- Store the assessment as one unstructured text response.
- Assume every assessment must contain every item type.
- Save remotely before the persistence phase.

ACCEPTANCE CRITERIA:
- Teachers can generate and edit all required assessment types.
- Student and answer-key views remain separate and internally consistent.
- Assessment output is aligned to selected lesson objectives.
- Invalid model output never reaches the editor.
