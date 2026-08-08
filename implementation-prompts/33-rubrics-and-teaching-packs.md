STEP:
33 — Rubrics and Teaching Packs

REASONING:
HIGH

OBJECTIVE:
Add structured rubric generation and assemble coordinated teaching packs from existing lesson artifacts.

REFERENCE:
Sections 1, 30, and 35 of `implementation.md`

FILES / AREAS:
Rubric schemas and AI service, rubric editor, teaching-pack assembler, lesson editor actions, export navigation

IMPLEMENTATION:
- Define a rubric schema with criteria, performance levels, descriptors, weights or points, totals, and teacher notes.
- Generate rubrics from selected lesson objectives, assessment or performance-task context, grade, subject, and teacher instructions through the provider abstraction.
- Validate scoring consistency and require explicit teacher review.
- Build a compact rubric editor with accessible table semantics and a print layout.
- Define a TeachingPack aggregate that references a lesson, presentation, assessment, worksheet, and rubric by typed artifact IDs without duplicating all content in client state.
- Build a pack overview that shows artifact availability, generation state, and export entry points.
- Reuse existing generation services rather than creating one oversized pack-generation prompt.
- Support partial packs and clear missing-artifact actions.

DO NOT:
- Generate every artifact automatically without teacher intent.
- Merge all artifact schemas into the LessonPlan object.
- Introduce remote storage before Step 36.

ACCEPTANCE CRITERIA:
- Teachers can generate and edit a validated rubric.
- Rubric totals and descriptors remain internally consistent.
- A teaching pack can coordinate existing artifacts from one source lesson.
- Partial and failed artifact states are clear and recoverable.
