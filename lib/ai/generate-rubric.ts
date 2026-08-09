if (typeof window !== "undefined") {
  throw new Error("AI rubric generation modules cannot be imported in client components.");
}

import { executeAICapability } from "./router";
import { compileRubricSystemPrompt, compileRubricUserPrompt } from "./prompts/rubric";
import { RubricSchema, type Rubric, normalizeRubric } from "@/schemas/rubric";
import type { LessonPlan } from "@/schemas/lesson";

export type GenerateRubricOptions = {
  lesson: LessonPlan;
  taskDescription: string;
  scaleLevels: string[];
  timeoutMs?: number;
};

/**
 * Validated AI Service converting LessonPlan and task description into a structured Rubric.
 */
export async function generateRubric(options: GenerateRubricOptions) {
  const { lesson, taskDescription, scaleLevels, timeoutMs } = options;

  const systemPrompt = compileRubricSystemPrompt();
  const userPrompt = compileRubricUserPrompt({
    lesson,
    taskDescription,
    scaleLevels,
  });

  const res = await executeAICapability({
    capability: "rubric_generation",
    systemPrompt,
    userPrompt,
    schema: RubricSchema,
    timeoutMs,
  });

  // Authoritative identity and normalization checks
  const rubric: Rubric = {
    ...normalizeRubric({ ...res.data, levels: scaleLevels }),
    lessonId: lesson.id || "unlinked",
  };

  return {
    ...res,
    data: rubric,
  };
}
