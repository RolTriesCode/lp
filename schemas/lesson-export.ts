import { z } from "zod";
import { LessonPlanSchema } from "@/schemas/lesson";

export const LessonExportRequestSchema = z.union([
  LessonPlanSchema.transform((lesson) => ({ lesson, includePrivateNotes: false })),
  z.object({
    lesson: LessonPlanSchema,
    includePrivateNotes: z.boolean().default(false),
  }),
]);

export type LessonExportRequest = z.infer<typeof LessonExportRequestSchema>;
