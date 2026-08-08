STEP:
18 — Curriculum-Specific AI Lesson Prompts

REASONING:
EXTRA HIGH

OBJECTIVE:
Implement structured prompt builders for MATATAG and ILAW lesson generation while protecting verified curriculum facts.

REFERENCE:
Sections 7, 8, and 9 of `implementation.md`

FILES / AREAS:
`lib/ai/prompts/matatag.ts`, `lib/ai/prompts/ilaw.ts`, shared prompt utilities, curriculum context builder, prompt tests

IMPLEMENTATION:
- Build separate MATATAG and ILAW prompt modules that share only genuinely common instructions.
- Accept the validated lesson input, curriculum configuration, verified competency context, teacher instructions, class context, available resources, language, lesson type, and duration.
- Instruct the model to produce the canonical lesson schema rather than prose wrapped in Markdown.
- Require coherent standards, measurable objectives, materials, procedures, assessment, assignment, and reflection appropriate to the selected curriculum and lesson type.
- Explicitly prohibit invention of official competency codes. When no verified code is supplied, require the code field to be omitted.
- Bound prompt content, normalize teacher-entered instructions, and clearly separate trusted system constraints from untrusted user content.
- Add tests or snapshots covering both curricula, both lesson types, optional fields, Filipino and English language choices, and absent competency data.

DO NOT:
- Treat MATATAG and ILAW as a label substituted into the same full prompt.
- Ask for one giant Markdown document.
- Put provider selection or API calls in prompt modules.

ACCEPTANCE CRITERIA:
- Each curriculum has an explicit prompt builder and structure.
- Prompt output requests data compatible with the canonical Zod schema.
- Verified curriculum fields cannot be silently replaced by model output.
- Tests confirm safe behavior when curriculum records are missing.
