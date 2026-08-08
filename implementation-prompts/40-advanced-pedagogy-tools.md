STEP:
40 — Advanced Pedagogy Tools

REASONING:
EXTRA HIGH

OBJECTIVE:
Add differentiated instruction, curriculum alignment checking, objective validation, Bloom’s taxonomy controls, presentation mode, and teacher notes around the structured lesson model.

REFERENCE:
Section 30 of `implementation.md`

FILES / AREAS:
Pedagogy schemas and services, editor tools, curriculum validation utilities, presentation mode, teacher-note fields, tests

IMPLEMENTATION:
- Add structured differentiation suggestions for learner readiness, language support, enrichment, accessibility, and resource constraints while avoiding diagnostic or stigmatizing labels.
- Build an alignment checker that compares objectives, procedures, and assessments against verified curriculum context and clearly distinguishes deterministic checks from AI suggestions.
- Build an objective validator for measurability, clarity, grade appropriateness, and assessment alignment.
- Add typed Bloom’s taxonomy controls that guide generation and rewriting without overriding teacher edits.
- Add private teacher notes that remain separate from student-facing or exported content unless explicitly included.
- Build a clean presentation mode for teaching from lesson sections with keyboard navigation and reduced-motion support.
- Validate all AI-produced suggestions before application and preserve accept, reject, and undo control.
- Add tests for unsupported competency claims, section preservation, taxonomy values, and export exclusion of private notes.

DO NOT:
- Present AI judgments as official curriculum certification.
- Infer sensitive learner traits.
- Automatically rewrite lessons after analysis.

ACCEPTANCE CRITERIA:
- Each tool operates on typed lesson sections and preserves teacher control.
- Verified facts and AI suggestions are visually distinguishable.
- Private notes remain private by default.
- Presentation mode is keyboard accessible and does not alter lesson data.
