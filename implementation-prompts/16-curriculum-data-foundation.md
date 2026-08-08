STEP:
16 — Curriculum Data Foundation

REASONING:
EXTRA HIGH

OBJECTIVE:
Create explicit MATATAG and ILAW curriculum structures and a safe foundation for verified curriculum records.

REFERENCE:
Sections 8 and 35 of `implementation.md`

FILES / AREAS:
`lib/curriculum/`, `data/curriculum/`, curriculum schemas, lesson schema adapters, curriculum tests

IMPLEMENTATION:
- Audit the lesson schemas and keep their shared core stable.
- Define curriculum-specific configuration for required sections, terminology, procedure expectations, and validation rules where MATATAG and ILAW differ.
- Create typed curriculum-record schemas for grade, subject, quarter, competency text, competency code, source reference, and verification status.
- Keep verified local records separate from AI prompt text and UI option labels.
- Provide lookup and filtering functions that return only known data and make unavailable data explicit.
- Ensure the generation path can omit a competency code when no verified code exists.
- Add adapters that assemble curriculum context from form input and verified records without letting a model overwrite source-of-truth fields.
- Add tests proving MATATAG and ILAW use distinct configurations and that unverified codes are never presented as official.

DO NOT:
- Populate fabricated DepEd competency codes or claim completeness for partial datasets.
- Encode curriculum rules solely inside React components or provider prompts.
- Fetch unofficial curriculum content at runtime without provenance.

ACCEPTANCE CRITERIA:
- MATATAG and ILAW are represented by distinct typed configurations.
- Curriculum lookups expose provenance and verification state.
- Missing verified competency data is handled safely and visibly.
- The module is reusable by forms, generation, validation, and alignment tools.
