import { z } from "zod";

export const ReferenceDocumentSchema = z.object({
  id: z.string(),
  filename: z.string().min(1, "Filename is required"),
  fileType: z.enum(["docx", "pdf"]),
  sizeBytes: z.number().min(1, "File size cannot be 0"),
  extractedText: z.string(),
  truncatedText: z.string(),
  warnings: z.array(z.string()).optional(),
});

export type ReferenceDocument = z.infer<typeof ReferenceDocumentSchema>;

export function safeParseReferenceDocument(data: unknown) {
  return ReferenceDocumentSchema.safeParse(data);
}
