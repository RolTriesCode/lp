STEP:
34 — Reference Document Ingestion

REASONING:
HIGH

OBJECTIVE:
Allow teachers to attach DOCX and PDF references and safely convert them into bounded generation context.

REFERENCE:
Sections 5, 17, and 20 of `implementation.md`

FILES / AREAS:
`app/api/uploads/`, `lib/documents/import/`, Mammoth integration, PDF parser integration, upload UI, reference schemas and tests

IMPLEMENTATION:
- Read current Mammoth and chosen PDF.js or parser documentation before coding and install only required packages.
- Define an uploaded-reference schema containing ID, name, MIME type, byte size, extraction status, extracted text, page or section metadata, and warnings.
- Validate file type and size before parsing. Reject unsupported, encrypted, malformed, or oversized files with clear messages.
- Use Mammoth for DOCX text extraction and a reliable PDF parser for PDF text extraction.
- Normalize extracted text, preserve useful section boundaries, and bound the context sent to AI services.
- Treat uploaded content as untrusted data and isolate it from system instructions to reduce prompt-injection risk.
- Add accessible upload, parsing, removal, and error states to lesson creation and editor reference controls.
- Keep files temporary or local in this phase; persistent Supabase Storage arrives later.

DO NOT:
- Execute macros, embedded scripts, external links, or active document content.
- Send entire unbounded documents to providers.
- Claim OCR support unless it is actually implemented and tested.

ACCEPTANCE CRITERIA:
- Supported DOCX and text-based PDF files produce bounded reference records.
- Unsupported or unsafe files fail before AI use.
- Teachers can inspect and remove extracted context.
- Parsing errors do not erase lesson form or editor state.
