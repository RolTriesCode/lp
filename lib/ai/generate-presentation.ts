if (typeof window !== "undefined") {
  throw new Error("AI presentation generation modules cannot be imported in client components.");
}

import { executeAICapability } from "./router";
import { buildPresentationSystemPrompt, buildPresentationUserPrompt } from "./prompts/presentation";
import { PresentationSchema, type Presentation, type PresentationTheme } from "@/schemas/presentation";
import type { LessonPlan } from "@/schemas/lesson";

export type GeneratePresentationOptions = {
  lessonPlan: LessonPlan;
  theme: PresentationTheme;
  timeoutMs?: number;
};

/**
 * Validated AI Service converting LessonPlan into Presentation slide JSON structure.
 */
export async function generatePresentation(options: GeneratePresentationOptions) {
  const { lessonPlan, theme, timeoutMs } = options;

  const systemPrompt = buildPresentationSystemPrompt({
    theme,
    curriculum: lessonPlan.curriculum,
    lessonTitle: lessonPlan.title,
    subject: lessonPlan.subject,
    gradeLevel: lessonPlan.gradeLevel,
  });

  const userPrompt = buildPresentationUserPrompt(lessonPlan, theme);

  const res = await executeAICapability({
    capability: "presentation_generation",
    systemPrompt,
    userPrompt,
    schema: PresentationSchema,
    timeoutMs,
  });

  // Authoritative identity checks
  const presentation: Presentation = {
    ...res.data,
    schemaVersion: "1.0",
    lessonId: lessonPlan.id || "unknown",
    curriculum: lessonPlan.curriculum,
  };

  return {
    ...res,
    data: presentation,
  };
}
