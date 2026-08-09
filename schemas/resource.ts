import { z } from "zod";
import { UploadedReferenceSchema, type UploadedReference } from "@/schemas/reference";

export const TeachingResourceSchema = UploadedReferenceSchema.extend({
  kind: z.literal("reference_document"),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TeachingResource = z.infer<typeof TeachingResourceSchema>;

export function createTeachingResource(reference: UploadedReference): TeachingResource {
  const timestamp = new Date().toISOString();
  return TeachingResourceSchema.parse({
    ...reference,
    kind: "reference_document",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function toUploadedReference(resource: TeachingResource): UploadedReference {
  return UploadedReferenceSchema.parse(resource);
}
