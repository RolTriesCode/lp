STEP:
27 — Presentation Builder and Preview

REASONING:
HIGH

OBJECTIVE:
Build a presentation workflow for generating, previewing, editing, reordering, and theming slide JSON before export.

REFERENCE:
Section 15 of `implementation.md`; use `/public/reference/ppt-maker.png` if available when executed.

FILES / AREAS:
`app/presentations/`, presentation components, Zustand presentation store, generation endpoint integration, preview styles

IMPLEMENTATION:
- Create a presentation route that can start from a lesson ID and load the validated source lesson.
- Let the teacher select a supported theme and generation options before requesting slide JSON.
- Render a real HTML preview from structured slide data with a thumbnail rail, selected slide canvas, and focused editing controls.
- Support editing text, speaker notes, layout selection, adding and removing slides, and keyboard-accessible reordering.
- Use a focused Zustand store for the presentation draft, selection, unsaved state, and generation state.
- Keep theme tokens shared between preview and the later PptxGenJS renderer.
- Provide empty, generating, validation-error, and recovery states.
- Make the builder usable at desktop and tablet widths, with a practical mobile review experience.

DO NOT:
- Render fake PowerPoint screenshots.
- Put PptxGenJS objects in client state.
- Add collaboration, cloud persistence, or image generation yet.

ACCEPTANCE CRITERIA:
- A lesson can generate a validated editable presentation draft.
- Preview reflects theme, layout, edits, notes, and order accurately.
- Invalid slide data cannot enter the store.
- Generate PPT actions from the dashboard and editor reach this workflow safely.
