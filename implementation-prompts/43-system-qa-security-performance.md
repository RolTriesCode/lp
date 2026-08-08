STEP:
43 — Full-System QA, Security, Accessibility, and Performance

REASONING:
EXTRA HIGH

OBJECTIVE:
Perform a comprehensive quality gate across the complete application before marketing and release work.

REFERENCE:
Sections 23 through 25 and 32 of `implementation.md`, plus every available design reference in `/public/reference/`

FILES / AREAS:
Entire application, automated tests, QA reports, security configuration, bundle and performance diagnostics

IMPLEMENTATION:
- Test the complete teacher journey: dashboard, lesson intake, generation, editor, section actions, save, presentation, PPTX export, DOCX export, assessment, worksheet, templates, resources, calendar, profile, and sign-out.
- Compare every referenced screen against its visual source at matching viewport and state.
- Verify 375, 430, 768, 1024, and 1440 pixel layouts with no unintended horizontal overflow.
- Audit keyboard navigation, focus order, labels, headings, errors, dialogs, menus, touch targets, contrast, and reduced motion.
- Test authorization boundaries, RLS, storage access, input validation, upload limits, prompt-injection handling, open redirects, secret exposure, and sanitized errors.
- Exercise AI timeouts, invalid structured output, fallback exhaustion, cancellation, duplicate submissions, offline edits, autosave conflict, and corrupted persisted JSON.
- Open exported DOCX and PPTX fixtures and verify structure and Unicode content.
- Run lint, strict TypeScript, production build, unit and integration tests, browser console checks, hydration checks, and dependency audit.
- Record evidence and fix all high- and medium-severity issues.

DO NOT:
- Waive failed checks without documenting a concrete blocker.
- Use build success as a substitute for browser or export verification.
- Redesign reference screens during QA.

ACCEPTANCE CRITERIA:
- The ten prototype success criteria in `implementation.md` work end to end.
- No unresolved high- or medium-severity defects remain.
- Security and ownership tests pass.
- Visual, accessibility, performance, and technical QA reports include reproducible evidence.
