import {
  MAX_REFERENCE_CONTEXT_CHARACTERS,
  UploadedReferenceListSchema,
  type UploadedReference,
} from "@/schemas/reference";

export type BoundedReferenceContext = {
  text: string;
  includedReferenceIds: string[];
  omittedCharacterCount: number;
};

/**
 * Serializes uploaded text as bounded, quoted user data. JSON encoding prevents
 * document text from breaking out of the surrounding data structure.
 */
export function buildBoundedReferenceContext(
  references: UploadedReference[] | undefined
): BoundedReferenceContext {
  const parsed = UploadedReferenceListSchema.safeParse(references ?? []);
  if (!parsed.success || parsed.data.length === 0) {
    return { text: "No uploaded reference material.", includedReferenceIds: [], omittedCharacterCount: 0 };
  }

  let remaining = MAX_REFERENCE_CONTEXT_CHARACTERS;
  let omittedCharacterCount = 0;
  const includedReferenceIds: string[] = [];
  const records: Array<{ id: string; name: string; mimeType: string; content: string }> = [];

  for (const reference of parsed.data) {
    if (remaining <= 0) {
      omittedCharacterCount += reference.extractedText.length;
      continue;
    }

    const content = reference.extractedText.slice(0, remaining);
    omittedCharacterCount += reference.extractedText.length - content.length;
    remaining -= content.length;
    includedReferenceIds.push(reference.id);
    records.push({
      id: reference.id,
      name: reference.name,
      mimeType: reference.mimeType,
      content,
    });
  }

  return {
    text: JSON.stringify(records, null, 2),
    includedReferenceIds,
    omittedCharacterCount,
  };
}
