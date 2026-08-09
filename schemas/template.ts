import { z } from "zod";
import { lessonPlanDefaults, lessonPlanFormSchema, type LessonPlanFormValues } from "@/lib/lesson-plan-schema";
import {
  AssessmentItemSchema,
  LessonProcedureSchema,
  LessonStandardsSchema,
  SubjectMatterSchema,
  normalizeLessonPlan,
  type LessonPlan,
} from "@/schemas/lesson";

export const MAX_TEMPLATE_CONTEXT_CHARACTERS = 8_000;

export const TemplateDefaultsSchema = lessonPlanFormSchema.omit({
  instructions: true,
  uploadedReferences: true,
});

const TemplateProcedurePatternSchema = LessonProcedureSchema.omit({ id: true });
const TemplateAssessmentPatternSchema = AssessmentItemSchema.omit({ id: true });

export const TemplateSectionPatternsSchema = z.object({
  standards: LessonStandardsSchema,
  objectives: z.array(z.string().trim().min(3).max(1000)).max(12),
  subjectMatter: SubjectMatterSchema,
  procedures: z.array(TemplateProcedurePatternSchema).max(16),
  assessment: z.array(TemplateAssessmentPatternSchema).max(12),
  assignment: z.string().trim().max(2000),
});

export const LessonTemplateSchema = z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(2, "Template name must contain at least 2 characters.").max(80),
  description: z.string().trim().max(240),
  sourceLessonId: z.string().trim().min(1).max(100).optional(),
  defaults: TemplateDefaultsSchema,
  sectionPatterns: TemplateSectionPatternsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const LessonTemplateApplicationSchema = LessonTemplateSchema.pick({
  id: true,
  name: true,
  defaults: true,
  sectionPatterns: true,
});

export type LessonTemplate = z.infer<typeof LessonTemplateSchema>;
export type LessonTemplateApplication = z.infer<typeof LessonTemplateApplicationSchema>;
export type TemplateDefaults = z.infer<typeof TemplateDefaultsSchema>;

function toFormDefaults(lesson: LessonPlan): TemplateDefaults {
  const lessonType =
    lesson.lessonType === "DETAILED"
      ? "detailed"
      : lesson.lessonType === "SEMI_DETAILED"
        ? "semi-detailed"
        : "daily-log";
  const candidate = lessonPlanFormSchema.parse({
    ...lessonPlanDefaults,
    curriculum: lesson.curriculum,
    grade: lesson.gradeLevel.replace(/^Grade\s+/i, ""),
    subject: lesson.subject,
    type: lessonType,
    quarter: lesson.quarter,
    topic: lesson.subjectMatter.topic,
    competency: lesson.standards.learningCompetency ?? "",
    duration: lesson.duration,
    instructions: "",
    uploadedReferences: [],
  });
  return TemplateDefaultsSchema.parse(candidate);
}

export function createTemplateFromLesson(
  lessonInput: unknown,
  name: string,
  description: string = ""
): LessonTemplate {
  const lesson = normalizeLessonPlan(lessonInput);
  const timestamp = new Date().toISOString();
  return LessonTemplateSchema.parse({
    id: `template-${crypto.randomUUID()}`,
    name,
    description,
    sourceLessonId: lesson.id,
    defaults: toFormDefaults(lesson),
    sectionPatterns: {
      standards: lesson.standards,
      objectives: lesson.objectives,
      subjectMatter: lesson.subjectMatter,
      procedures: TemplateProcedurePatternSchema.array().parse(lesson.procedures),
      assessment: TemplateAssessmentPatternSchema.array().parse(lesson.assessment ?? []),
      assignment: lesson.assignment,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export function applyTemplateToLessonForm(
  template: LessonTemplate,
  current: LessonPlanFormValues = lessonPlanDefaults
): LessonPlanFormValues {
  return lessonPlanFormSchema.parse({
    ...current,
    ...template.defaults,
    instructions: current.instructions ?? "",
    uploadedReferences: current.uploadedReferences ?? [],
  });
}

/** Produces a compact, provider-neutral pattern description for generation. */
export function buildTemplateGenerationContext(
  application: LessonTemplateApplication | undefined
): string {
  const parsed = LessonTemplateApplicationSchema.safeParse(application);
  if (!parsed.success) return "No reusable template pattern applied.";

  const template = parsed.data;
  const context = {
    templateName: template.name,
    standards: template.sectionPatterns.standards,
    objectivePatterns: template.sectionPatterns.objectives.slice(0, 6).map((item) => item.slice(0, 220)),
    subjectMatterPattern: {
      materials: template.sectionPatterns.subjectMatter.materials.slice(0, 8),
      valuesIntegration: template.sectionPatterns.subjectMatter.valuesIntegration.slice(0, 8),
    },
    procedurePatterns: template.sectionPatterns.procedures.slice(0, 6).map((item) => ({
      title: item.title.slice(0, 120),
      teacherActivity: item.teacherActivity?.slice(0, 240),
      studentActivity: item.studentActivity?.slice(0, 240),
      content: item.content?.slice(0, 240),
    })),
    assessmentPatterns: template.sectionPatterns.assessment.slice(0, 4).map((item) => ({
      type: item.type,
      question: item.question.slice(0, 180),
    })),
    assignmentPattern: template.sectionPatterns.assignment.slice(0, 300),
  };
  const serialized = JSON.stringify(context, null, 2);
  return serialized.length <= MAX_TEMPLATE_CONTEXT_CHARACTERS
    ? serialized
    : JSON.stringify({
        templateName: template.name,
        objectivePatterns: context.objectivePatterns,
        procedureTitles: context.procedurePatterns.map((item) => item.title),
        assessmentTypes: context.assessmentPatterns.map((item) => item.type),
      }, null, 2);
}
