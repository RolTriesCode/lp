STEP:
26 — Presentation Schema and Generation

REASONING:
EXTRA HIGH

OBJECTIVE:
Create the canonical presentation schema and a validated AI service that transforms lesson JSON into slide JSON.

REFERENCE:
Section 15 and the structured-data architecture in `implementation.md`

FILES / AREAS:
`schemas/presentation.ts`, `lib/ai/generate-presentation.ts`, `lib/ai/prompts/presentation.ts`, presentation fixtures and tests

IMPLEMENTATION:
- Define Zod schemas for presentation metadata, supported theme, slides, slide IDs, title, subtitle, bullets, body, speaker notes, layout, and optional image prompt.
- Define explicit supported layouts and content limits so generated slides remain readable.
- Build a provider-independent generation service that accepts a validated LessonPlan and presentation options.
- Instruct the model to transform lesson structure into an age-appropriate teaching sequence, not copy the entire lesson into slides.
- Validate slide JSON and preserve source lesson identity and curriculum metadata outside model-controlled fields.
- Support Minimal, Academic, Classroom, Elementary, Professional, Science, and Mathematics themes as typed choices.
- Add tests for valid transformations, overlong content, empty slides, unknown layouts, missing source sections, and provider failure.

DO NOT:
- Generate a `.pptx` in this step.
- Use screenshots as slide output.
- Store presentation content as Markdown or raw provider text.

ACCEPTANCE CRITERIA:
- A LessonPlan can be converted to a validated Presentation object.
- Slide count and content limits are enforced.
- Themes and layouts are typed and independent of PptxGenJS.
- Provider failure cannot corrupt the source lesson.
