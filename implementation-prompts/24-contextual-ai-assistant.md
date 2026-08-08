STEP:
24 — Contextual AI Assistant

REASONING:
HIGH

OBJECTIVE:
Build the lesson editor’s contextual AI assistant using the same secure section-action service layer.

REFERENCE:
Sections 10, 14, and 30 of `implementation.md`

FILES / AREAS:
Editor assistant panel, selection state, assistant request schema, AI service endpoint, responsive panel or dialog

IMPLEMENTATION:
- Build the assistant around the currently selected lesson section or block rather than a generic unbounded chatbot.
- Offer quick actions for improve, simplify, add activity, generate quiz questions, differentiate for learners, and a concise custom instruction field.
- Show what section will be changed before submission and require explicit application of a generated suggestion.
- Keep original and proposed values available for comparison, accept, reject, and undo.
- Reuse the provider router and subsection validation from Step 23.
- Limit context to the selected content plus necessary lesson and curriculum metadata.
- Make the desktop assistant rail and mobile dialog or drawer accessible, focus-managed, and reduced-motion aware.
- Use clear empty, pending, error, and suggestion states.

DO NOT:
- Present the assistant as having knowledge beyond provided or verified curriculum context.
- Apply suggestions automatically without teacher control.
- Create a separate provider-specific chat implementation.

ACCEPTANCE CRITERIA:
- The assistant always identifies the targeted section.
- Teachers can review, apply, reject, and undo suggestions.
- All suggestions validate before reaching lesson state.
- The assistant is usable on mobile and by keyboard.
