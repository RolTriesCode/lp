import { z } from "zod";

export const MAX_REFERENCE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_REFERENCE_TEXT_CHARACTERS = 8_000;
export const MAX_REFERENCE_CONTEXT_CHARACTERS = 12_000;
export const MAX_REFERENCE_DOCUMENTS = 3;
export const MAX_REFERENCE_SEGMENTS = 100;

export const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PDF_MIME_TYPE = "application/pdf";

export const ReferenceMimeTypeSchema = z.enum([DOCX_MIME_TYPE, PDF_MIME_TYPE]);

export const ReferenceSegmentSchema = z.object({
  kind: z.enum(["page", "section"]),
  index: z.number().int().positive(),
  label: z.string().trim().min(1).max(80),
  characterCount: z.number().int().nonnegative(),
  includedCharacterCount: z.number().int().nonnegative(),
});

export const UploadedReferenceSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1, "File name is required.").max(255),
  mimeType: ReferenceMimeTypeSchema,
  byteSize: z
    .number()
    .int()
    .positive("File size must be greater than zero.")
    .max(MAX_REFERENCE_FILE_BYTES),
  extractionStatus: z.enum(["complete", "truncated"]),
  extractedText: z
    .string()
    .trim()
    .min(1, "Extracted reference text is required.")
    .max(MAX_REFERENCE_TEXT_CHARACTERS),
  segments: z.array(ReferenceSegmentSchema).max(MAX_REFERENCE_SEGMENTS),
  warnings: z.array(z.string().trim().min(1).max(240)).max(10),
});

export const UploadedReferenceListSchema = z
  .array(UploadedReferenceSchema)
  .max(MAX_REFERENCE_DOCUMENTS);

export type UploadedReference = z.infer<typeof UploadedReferenceSchema>;
export type ReferenceSegment = z.infer<typeof ReferenceSegmentSchema>;

// Backwards-compatible aliases for the initial ingestion prototype.
export const ReferenceDocumentSchema = UploadedReferenceSchema;
export type ReferenceDocument = UploadedReference;

export function safeParseUploadedReference(data: unknown) {
  return UploadedReferenceSchema.safeParse(data);
}

export const safeParseReferenceDocument = safeParseUploadedReference;
