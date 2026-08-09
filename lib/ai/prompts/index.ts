import { assembleCurriculumContext } from "@/lib/curriculum/adapter";
import type { CurriculumContext } from "@/lib/curriculum/types";
import type { LessonPlanFormValues } from "@/lib/lesson-plan-schema";
import { buildIlawLessonPrompt } from "./ilaw";
import { buildMatatagLessonPrompt, type PromptBundle } from "./matatag";

export type FullPromptResult = PromptBundle & {
  context: CurriculumContext;
};

/**
 * Main AI Lesson Prompt Router.
 * Assembles curriculum context and routes to framework-specific prompt builders.
 */
export function buildLessonPrompt(input: LessonPlanFormValues): FullPromptResult {
  const context = assembleCurriculumContext(input);

  const bundle =
    input.curriculum === "ILAW"
      ? buildIlawLessonPrompt(input, context)
      : buildMatatagLessonPrompt(input, context);

  return {
    ...bundle,
    context,
  };
}

export * from "./common";
export * from "./ilaw";
export * from "./matatag";
