if (typeof window !== "undefined") {
  throw new Error("AI section rewrite modules cannot be imported in client components.");
}

import { z } from "zod";
import { getLanguageDirective, SHARED_SYSTEM_CONSTRAINTS } from "@/lib/ai/prompts/common";
import { executeAICapability } from "@/lib/ai/router";
import { AIProviderError } from "@/lib/ai/types";
import {
  AssessmentItemSchema,
  generateBlockId,
  LessonProcedureSchema,
  type AssessmentItem,
  type LessonProcedure,
} from "@/schemas/lesson";

export type SectionActionType =
  | "simplify"
  | "expand"
  | "shorten"
  | "formalize"
  | "regenerate"
  | "add_activity"
  | "create_assessment";

export type SectionType =
  | "objectives"
  | "procedures"
  | "assessment"
  | "reflection"
  | "standards"
  | "subjectMatter";

export type RewriteSectionOptions = {
  action: SectionActionType;
  sectionType: SectionType;
  currentContent: any;
  curriculum: "MATATAG" | "ILAW";
  lessonType: "DETAILED" | "SEMI_DETAILED" | "DAILY_LOG";
  gradeLevel: string;
  subject: string;
  topic: string;
  language?: string;
  customPrompt?: string;
};

export type RewriteSectionResult =
  | { success: true; updatedContent: any; durationMs: number; provider: string }
  | { success: false; error: { category: string; message: string; retryable: boolean } };

/**
 * Returns human-readable action description.
 */
function getActionDirective(action: SectionActionType, customPrompt?: string): string {
  if (customPrompt && customPrompt.trim()) {
    return `CUSTOM TEACHER INSTRUCTION: ${customPrompt.trim()}`;
  }

  switch (action) {
    case "simplify":
      return "SIMPLIFY INSTRUCTION: Simplify vocabulary, sentence structure, and activities for struggling learners while keeping learning targets intact.";
    case "expand":
      return "EXPAND INSTRUCTION: Add rich detail, concrete real-life Philippine examples, deeper teacher explanations, and interactive student activities.";
    case "shorten":
      return "SHORTEN INSTRUCTION: Make concise and focused for a shorter class period or rapid review.";
    case "formalize":
      return "FORMALIZE INSTRUCTION: Enhance academic rigor, formal DepEd terminology, and curriculum alignment.";
    case "add_activity":
      return "ADD ACTIVITY INSTRUCTION: Add 1 new engaging group activity or hands-on practice step.";
    case "create_assessment":
      return "CREATE ASSESSMENT INSTRUCTION: Generate 2 new formative assessment questions with multiple choice options and answer keys.";
    case "regenerate":
    default:
      return "REGENERATE INSTRUCTION: Re-generate this section with fresh, creative pedagogical ideas.";
  }
}

/**
 * Core Section Rewrite Pipeline.
 * Rewrites ONLY the specified section, leaving all other sections untouched.
 */
export async function rewriteLessonSection(
  options: RewriteSectionOptions
): Promise<RewriteSectionResult> {
  const {
    action,
    sectionType,
    currentContent,
    curriculum,
    lessonType,
    gradeLevel,
    subject,
    topic,
    language = "english",
    customPrompt,
  } = options;

  const actionDirective = getActionDirective(action, customPrompt);
  const languageDirective = getLanguageDirective(language);

  const systemPrompt = `You are an expert ${curriculum} Curriculum Master Teacher and Instructional Designer.

YOUR TASK:
Rewrite ONLY the '${sectionType}' section of a ${gradeLevel} ${subject} lesson plan focused on "${topic}".

${SHARED_SYSTEM_CONSTRAINTS}

CRITICAL SCOPING RULE:
- You must output ONLY the updated JSON data matching the requested schema for '${sectionType}'.
- Do NOT output any other lesson sections.

${actionDirective}
${languageDirective}`;

  const userPrompt = `Current Section Content for '${sectionType}':
${JSON.stringify(currentContent, null, 2)}

Context:
- Curriculum: ${curriculum}
- Lesson Type: ${lessonType}
- Grade & Subject: ${gradeLevel} ${subject}
- Topic Focus: ${topic}

Perform the requested action and return the updated '${sectionType}' section object matching schema.`;

  try {
    let resultData: any;
    let durationMs = 0;
    let provider = "groq";

    if (sectionType === "objectives") {
      const schema = z.object({ objectives: z.array(z.string()) });
      const res = await executeAICapability({
        capability: "fast_text_rewrite",
        systemPrompt,
        userPrompt,
        schema,
      });
      resultData = res.data.objectives;
      durationMs = res.durationMs;
      provider = res.provider;
    } else if (sectionType === "procedures") {
      const schema = z.object({ procedures: z.array(LessonProcedureSchema) });
      const res = await executeAICapability({
        capability: "fast_text_rewrite",
        systemPrompt,
        userPrompt,
        schema,
      });
      // Preserve existing block IDs where possible
      const list: LessonProcedure[] = res.data.procedures.map((proc, idx) => {
        const originalId = Array.isArray(currentContent) && currentContent[idx]?.id;
        return {
          ...proc,
          id: originalId || proc.id || generateBlockId("proc"),
        };
      });
      resultData = list;
      durationMs = res.durationMs;
      provider = res.provider;
    } else if (sectionType === "assessment") {
      const schema = z.object({ assessment: z.array(AssessmentItemSchema) });
      const res = await executeAICapability({
        capability: "fast_text_rewrite",
        systemPrompt,
        userPrompt,
        schema,
      });
      // Preserve existing block IDs where possible
      const list: AssessmentItem[] = res.data.assessment.map((item, idx) => {
        const originalId = Array.isArray(currentContent) && currentContent[idx]?.id;
        return {
          ...item,
          id: originalId || item.id || generateBlockId("eval"),
        };
      });
      resultData = list;
      durationMs = res.durationMs;
      provider = res.provider;
    } else if (sectionType === "reflection") {
      const schema = z.object({
        assignment: z.string().optional(),
        reflection: z.string(),
      });
      const res = await executeAICapability({
        capability: "fast_text_rewrite",
        systemPrompt,
        userPrompt,
        schema,
      });
      resultData = res.data;
      durationMs = res.durationMs;
      provider = res.provider;
    } else {
      const schema = z.object({ content: z.string() });
      const res = await executeAICapability({
        capability: "fast_text_rewrite",
        systemPrompt,
        userPrompt,
        schema,
      });
      resultData = res.data.content;
      durationMs = res.durationMs;
      provider = res.provider;
    }

    return {
      success: true,
      updatedContent: resultData,
      durationMs,
      provider,
    };
  } catch (err) {
    if (err instanceof AIProviderError) {
      return {
        success: false,
        error: {
          category: err.category,
          message: err.message,
          retryable: err.retryable,
        },
      };
    }

    const rawMessage = err instanceof Error ? err.message : "Section rewrite failed.";
    return {
      success: false,
      error: {
        category: "UPSTREAM_FAILURE",
        message: rawMessage,
        retryable: true,
      },
    };
  }
}
