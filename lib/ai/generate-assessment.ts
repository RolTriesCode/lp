if (typeof window !== "undefined") {
  throw new Error("AI assessment generation modules cannot be imported in client components.");
}

import { executeAICapability } from "./router";
import { compileAssessmentSystemPrompt, compileAssessmentUserPrompt } from "./prompts/assessment";
import { AssessmentSchema, type Assessment, type AssessmentItemType, normalizeAssessment } from "@/schemas/assessment";
import type { LessonPlan } from "@/schemas/lesson";

export type GenerateAssessmentOptions = {
  lesson: LessonPlan;
  itemTypes: AssessmentItemType[];
  difficulty: "easy" | "average" | "difficult";
  itemCount: number;
  additionalInstructions?: string;
  timeoutMs?: number;
};

/**
 * Validated AI Service converting LessonPlan into structured Assessment items.
 */
export async function generateAssessment(options: GenerateAssessmentOptions) {
  const { lesson, itemTypes, difficulty, itemCount, additionalInstructions, timeoutMs } = options;

  const systemPrompt = compileAssessmentSystemPrompt();
  const userPrompt = compileAssessmentUserPrompt({
    lesson,
    itemTypes,
    difficulty,
    itemCount,
    additionalInstructions,
  });

  const res = await executeAICapability({
    capability: "assessment_generation",
    systemPrompt,
    userPrompt,
    schema: AssessmentSchema,
    timeoutMs,
  });

  // Authoritative identity and normalization checks
  const assessment: Assessment = {
    ...normalizeAssessment(res.data),
    lessonId: lesson.id || "unlinked",
  };

  return {
    ...res,
    data: assessment,
  };
}
