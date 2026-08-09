import { z } from "zod";

/**
 * Version identifier for schema compatibility and database migration support.
 */
export const LESSON_SCHEMA_VERSION = "1.0" as const;

/**
 * Unique ID generator for procedure blocks and assessment items.
 */
export function generateBlockId(prefix: string = "block"): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
}

/**
 * Educational framework supported by AralAI.
 */
export const CurriculumTypeSchema = z.enum(["MATATAG", "ILAW"]);
export type CurriculumType = z.infer<typeof CurriculumTypeSchema>;

/**
 * Lesson plan format (Detailed vs Semi-Detailed vs Daily Lesson Log).
 */
export const LessonTypeSchema = z.enum(["DETAILED", "SEMI_DETAILED", "DAILY_LOG"]);
export type LessonType = z.infer<typeof LessonTypeSchema>;

/**
 * Curriculum standards and competency definitions.
 */
export const LessonStandardsSchema = z.object({
  contentStandard: z.string().trim().max(1000).optional(),
  performanceStandard: z.string().trim().max(1000).optional(),
  learningCompetency: z.string().trim().max(1000).optional(),
  competencyCode: z.string().trim().max(100).optional(),
});
export type LessonStandards = z.infer<typeof LessonStandardsSchema>;

/**
 * Subject matter, references, teaching materials, and values integration.
 */
export const SubjectMatterSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, "Topic is required.")
    .max(200, "Topic cannot exceed 200 characters."),
  references: z.array(z.string().trim().min(1)).optional().default([]),
  materials: z.array(z.string().trim().min(1)).optional().default([]),
  valuesIntegration: z.array(z.string().trim().min(1)).optional().default([]),
});
export type SubjectMatter = z.infer<typeof SubjectMatterSchema>;

/**
 * Individual procedure step within a lesson plan.
 * Supports Detailed (teacher & student activity dialogues) and Semi-Detailed (summary content) formats.
 */
export const LessonProcedureSchema = z.object({
  id: z.string().trim().min(1).default(() => generateBlockId("proc")),
  title: z
    .string()
    .trim()
    .min(1, "Procedure step title is required.")
    .max(150, "Step title cannot exceed 150 characters."),
  teacherActivity: z.string().trim().max(5000).optional(),
  studentActivity: z.string().trim().max(5000).optional(),
  content: z.string().trim().max(5000).optional(),
});
export type LessonProcedure = z.infer<typeof LessonProcedureSchema>;

/**
 * Assessment item types.
 */
export const AssessmentTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "identification",
  "essay",
  "performance_task",
]);
export type AssessmentType = z.infer<typeof AssessmentTypeSchema>;

/**
 * Individual assessment item / quiz question.
 */
export const AssessmentItemSchema = z.object({
  id: z.string().trim().min(1).default(() => generateBlockId("eval")),
  type: AssessmentTypeSchema.optional().default("multiple_choice"),
  question: z
    .string()
    .trim()
    .min(1, "Assessment question is required.")
    .max(1000, "Question text cannot exceed 1000 characters."),
  choices: z.array(z.string().trim().min(1)).optional().default([]),
  answer: z.string().trim().max(500).optional().default(""),
  points: z.number().positive().optional().default(1),
});
export type AssessmentItem = z.infer<typeof AssessmentItemSchema>;

/**
 * Canonical Root Lesson Plan Schema.
 * Powers editor state, AI model structured output, exports (DOCX/PPTX/PDF), and database persistence.
 */
export const LessonPlanSchema = z.object({
  schemaVersion: z.literal(LESSON_SCHEMA_VERSION).default(LESSON_SCHEMA_VERSION),
  id: z.string().trim().optional(),
  curriculum: CurriculumTypeSchema,
  lessonType: LessonTypeSchema,
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(200, "Title cannot exceed 200 characters."),
  gradeLevel: z.string().trim().min(1, "Grade level is required."),
  subject: z.string().trim().min(1, "Subject / Learning Area is required."),
  quarter: z.string().trim().optional().default("Q1"),
  week: z.string().trim().optional().default(""),
  duration: z.string().trim().optional().default("60 mins"),
  standards: LessonStandardsSchema.optional().default({}),
  objectives: z
    .array(
      z
        .string()
        .trim()
        .min(3, "Objective must be at least 3 characters.")
    )
    .min(1, "At least one learning objective is required."),
  subjectMatter: SubjectMatterSchema,
  procedures: z
    .array(LessonProcedureSchema)
    .min(1, "At least one lesson procedure block is required."),
  assessment: z.array(AssessmentItemSchema).optional().default([]),
  assignment: z.string().trim().max(2000).optional().default(""),
  reflection: z.string().trim().max(2000).optional().default(""),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LessonPlan = z.infer<typeof LessonPlanSchema>;

/**
 * Strict parser for trusted internal data. Throws ZodError on failure.
 */
export function parseLessonPlan(data: unknown): LessonPlan {
  return LessonPlanSchema.parse(data);
}

/**
 * Safe parser for untrusted AI responses or API payloads.
 */
export function safeParseLessonPlan(data: unknown) {
  return LessonPlanSchema.safeParse(data);
}

/**
 * Normalizes untrusted raw JSON by generating missing procedure/assessment IDs
 * and providing safe defaults before strict parsing.
 */
export function normalizeLessonPlan(data: unknown): LessonPlan {
  if (typeof data !== "object" || data === null) {
    throw new Error("Invalid lesson data: payload must be a non-null object.");
  }

  const raw = data as Record<string, unknown>;

  // Ensure procedure blocks have valid IDs
  const procedures = Array.isArray(raw.procedures)
    ? raw.procedures.map((proc: unknown, idx: number) => {
        if (typeof proc === "object" && proc !== null) {
          const p = proc as Record<string, unknown>;
          return {
            ...p,
            id: typeof p.id === "string" && p.id.trim() ? p.id : generateBlockId(`proc-${idx + 1}`),
          };
        }
        return proc;
      })
    : [];

  // Ensure assessment items have valid IDs
  const assessment = Array.isArray(raw.assessment)
    ? raw.assessment.map((item: unknown, idx: number) => {
        if (typeof item === "object" && item !== null) {
          const a = item as Record<string, unknown>;
          return {
            ...a,
            id: typeof a.id === "string" && a.id.trim() ? a.id : generateBlockId(`eval-${idx + 1}`),
          };
        }
        return item;
      })
    : [];

  const normalized = {
    ...raw,
    schemaVersion: raw.schemaVersion || LESSON_SCHEMA_VERSION,
    procedures,
    assessment,
  };

  return LessonPlanSchema.parse(normalized);
}
