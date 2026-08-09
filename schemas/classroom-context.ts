import { z } from "zod";

export const ContextClassSizeSchema = z.enum(["small", "standard", "large", "overcrowded"]);
export const ContextLanguageSchema = z.enum(["english", "filipino", "bilingual", "regional"]);
export const ContextResourceSchema = z.enum(["printables", "chalkboard", "projector", "tech_lab"]);
export const ContextDurationSchema = z.enum(["45 mins", "50 mins", "60 mins", "90 mins", "2 hours"]);
export const LearnerNeedSchema = z.enum([
  "reading_scaffolds",
  "language_scaffolds",
  "visual_supports",
  "step_by_step_instructions",
  "extension_activities",
  "movement_breaks",
]);

const SENSITIVE_CONTEXT_PATTERN = /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?63|0)9\d{9}\b|\b(?:diagnos(?:is|ed)|medical condition|student named|learner named|autis(?:m|tic)|adhd|home address|contact number)\b)/i;

export const SafeTeacherNotesSchema = z
  .string()
  .trim()
  .max(400, "Keep general teaching notes under 400 characters.")
  .superRefine((value, context) => {
    if (SENSITIVE_CONTEXT_PATTERN.test(value)) {
      context.addIssue({
        code: "custom",
        message: "Remove names, contact details, diagnoses, medical information, or other learner-identifying details.",
      });
    }
  });

export const ClassroomContextApplicationSchema = z.object({
  classSize: ContextClassSizeSchema,
  language: ContextLanguageSchema,
  availableResources: z.array(ContextResourceSchema).min(1).max(4),
  learnerNeeds: z.array(LearnerNeedSchema).max(6),
  preferredDuration: ContextDurationSchema,
  teacherNotes: SafeTeacherNotesSchema.default(""),
});

export const ClassroomContextSchema = ClassroomContextApplicationSchema.extend({
  schemaVersion: z.literal("1.0").default("1.0"),
  revision: z.number().int().positive(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const classroomContextDefaults: z.infer<typeof ClassroomContextApplicationSchema> = {
  classSize: "standard",
  language: "english",
  availableResources: ["chalkboard"],
  learnerNeeds: [],
  preferredDuration: "60 mins",
  teacherNotes: "",
};

export type ClassroomContextApplication = z.infer<typeof ClassroomContextApplicationSchema>;
export type ClassroomContext = z.infer<typeof ClassroomContextSchema>;

export function toClassroomContextApplication(context: ClassroomContext): ClassroomContextApplication {
  return ClassroomContextApplicationSchema.parse(context);
}

export function buildBoundedClassroomContext(context?: ClassroomContextApplication): string {
  if (!context) return "";
  const safe = ClassroomContextApplicationSchema.parse(context);
  return JSON.stringify({
    classSize: safe.classSize,
    language: safe.language,
    availableResources: safe.availableResources,
    learnerNeeds: safe.learnerNeeds,
    preferredDuration: safe.preferredDuration,
    teacherNotes: safe.teacherNotes,
  });
}
