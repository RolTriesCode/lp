STEP:
21 — Lesson Draft State and Routing

REASONING:
HIGH

OBJECTIVE:
Establish stable lesson routes and a minimal shared draft architecture for generated lessons before database persistence.

REFERENCE:
Sections 14 and 21 of `implementation.md`

FILES / AREAS:
`app/lesson/[id]/page.tsx`, Zustand lesson store, local persistence adapter, lesson selectors, not-found and recovery UI

IMPLEMENTATION:
- Use the lesson ID in the URL as the canonical selected-lesson identity.
- Create a focused Zustand store for generated lesson drafts, unsaved status, selected block, and generation state. Keep transient component-only UI out of the store.
- Define store actions with strongly typed inputs and immutable updates.
- Add a prototype-safe persistence adapter, such as versioned local storage, solely to survive reloads before Supabase is introduced.
- Validate rehydrated data through the canonical lesson schema and discard or quarantine incompatible records safely.
- Prevent server-client hydration mismatch by delaying browser-only rehydration state appropriately.
- Provide loading, missing-draft, incompatible-draft, and recovery paths on `/lesson/[id]`.
- Keep persistence behind an interface that can be replaced by Supabase in Step 36.

DO NOT:
- Put all editor UI state into Zustand.
- Trust local-storage JSON without validation.
- Add authentication or Supabase yet.

ACCEPTANCE CRITERIA:
- A generated lesson opens at a stable `/lesson/[id]` URL.
- Refresh restores a valid prototype draft without hydration errors.
- Missing or invalid drafts produce a clear recovery path.
- Store boundaries remain focused and replaceable.
