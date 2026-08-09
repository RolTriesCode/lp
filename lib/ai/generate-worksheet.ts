if (typeof window !== "undefined") {
  throw new Error("AI worksheet generation modules cannot be imported in client components.");
}

import { executeAICapability } from "./router";
import { compileWorksheetSystemPrompt, compileWorksheetUserPrompt } from "./prompts/worksheet";
import { WorksheetSchema, type Worksheet, normalizeWorksheet } from "@/schemas/worksheet";
import type { LessonPlan } from "@/schemas/lesson";

export type GenerateWorksheetOptions = {
  lesson: LessonPlan;
  difficulty: "easy" | "average" | "difficult";
  itemCount: number;
  additionalInstructions?: string;
  timeoutMs?: number;
};

/**
 * Validated AI Service converting LessonPlan into structured Worksheet.
 */
export async function generateWorksheet(options: GenerateWorksheetOptions) {
  const { lesson, difficulty, itemCount, additionalInstructions, timeoutMs } = options;

  const systemPrompt = compileWorksheetSystemPrompt();
  const userPrompt = compileWorksheetUserPrompt({
    lesson,
    difficulty,
    itemCount,
    additionalInstructions,
  });

  const res = await executeAICapability({
    capability: "worksheet_generation",
    systemPrompt,
    userPrompt,
    schema: WorksheetSchema,
    timeoutMs,
  });

  // Authoritative identity and normalization checks
  const worksheet: Worksheet = {
    ...normalizeWorksheet(res.data),
    lessonId: lesson.id || "unlinked",
  };

  return {
    ...res,
    data: worksheet,
  };
}
