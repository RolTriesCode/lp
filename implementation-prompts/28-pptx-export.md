STEP:
28 — PPTX Export

REASONING:
EXTRA HIGH

OBJECTIVE:
Generate real PowerPoint files from validated presentation data using PptxGenJS.

REFERENCE:
Section 15 of `implementation.md`

FILES / AREAS:
`lib/documents/pptx/`, presentation theme tokens, export route or server action, download UI, export tests

IMPLEMENTATION:
- Read the installed PptxGenJS documentation and runtime constraints before coding.
- Build a renderer that maps each supported structured slide layout and theme to PptxGenJS elements.
- Use shared typography, color, spacing, and layout tokens so the HTML preview and exported deck remain consistent.
- Support titles, subtitles, bullets, body copy, speaker notes when supported, and safe fallbacks for optional imagery.
- Add text fitting and overflow detection; reject or adapt content that cannot fit legibly rather than clipping silently.
- Generate the file on demand and return a correctly named `.pptx` with an appropriate content type.
- Add pending, success, and recoverable error feedback to the presentation builder.
- Test file creation, slide count, theme mapping, Unicode Filipino text, long content, and invalid input.

DO NOT:
- Export screenshots or raw HTML as PowerPoint slides.
- Persist generated files permanently during the prototype.
- Accept unvalidated slide JSON.

ACCEPTANCE CRITERIA:
- Downloaded files open as valid PowerPoint presentations.
- Slide structure, ordering, themes, and notes reflect the preview data.
- Text does not silently overflow common slide layouts.
- Export runs without exposing server internals or provider credentials.
