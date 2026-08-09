import { z } from "zod";

export const BloomTaxonomyLevelSchema = z.enum([
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
]);

export const PedagogySectionSchema = z.enum([
  "lesson",
  "objectives",
  "subjectMatter",
  "procedures",
  "assessment",
  "reflection",
]);

export const DifferentiationCategorySchema = z.enum([
  "learner_readiness",
  "language_support",
  "enrichment",
  "accessibility",
  "resource_constraints",
]);

const STIGMATIZING_PATTERN = /\b(?:slow|weak|low[- ]ability|normal|deficient|disabled|autis(?:m|tic)|adhd|diagnos(?:is|ed)|special needs|remedial learner|gifted learner)s?\b/i;

function rejectsStigmatizingLanguage(value: string, context: z.RefinementCtx) {
  if (STIGMATIZING_PATTERN.test(value)) {
    context.addIssue({
      code: "custom",
      message: "Describe an optional instructional support without diagnostic, ability-based, or stigmatizing learner labels.",
    });
  }
}

export const DifferentiationSuggestionDraftSchema = z.object({
  category: DifferentiationCategorySchema,
  title: z.string().trim().min(3).max(100).superRefine(rejectsStigmatizingLanguage),
  strategy: z.string().trim().min(10).max(600).superRefine(rejectsStigmatizingLanguage),
  rationale: z.string().trim().min(5).max(320).superRefine(rejectsStigmatizingLanguage),
  appliesTo: z.array(PedagogySectionSchema.exclude(["lesson"])).min(1).max(3),
  bloomLevels: z.array(BloomTaxonomyLevelSchema).max(3).default([]),
});

export const DifferentiationSuggestionBatchSchema = z.object({
  suggestions: z.array(DifferentiationSuggestionDraftSchema).min(1).max(8),
});

export const DifferentiationRecordSchema = DifferentiationSuggestionDraftSchema.extend({
  id: z.uuid(),
  source: z.enum(["teacher", "ai"]),
  acceptedAt: z.iso.datetime({ offset: true }),
});

export const LessonPedagogySchema = z.object({
  bloomTargets: z.array(BloomTaxonomyLevelSchema).min(1).max(3).default(["understand", "apply"]),
  differentiation: z.array(DifferentiationRecordSchema).max(24).default([]),
});

const PRIVATE_NOTE_SENSITIVE_PATTERN = /(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?63|0)9\d{9}\b|\b(?:diagnos(?:is|ed)|medical condition|student named|learner named|home address|contact number)\b)/i;

export const PrivateTeacherNoteSchema = z.object({
  id: z.uuid(),
  section: PedagogySectionSchema,
  text: z.string().trim().max(1_000).superRefine((value, context) => {
    if (PRIVATE_NOTE_SENSITIVE_PATTERN.test(value)) {
      context.addIssue({
        code: "custom",
        message: "Remove learner names, contact details, diagnoses, medical information, or addresses.",
      });
    }
  }),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export const CurriculumProvenanceSnapshotSchema = z.object({
  recordId: z.string().trim().min(1).max(120),
  verificationStatus: z.enum(["VERIFIED_DEPED_OFFICIAL", "VERIFIED_REGIONAL_OFFICIAL"]),
  sourceReference: z.string().trim().min(1).max(500),
});

export const AnalysisStatusSchema = z.enum(["pass", "warning", "fail", "not_checked"]);
export const AlignmentDimensionSchema = z.enum([
  "verified_context",
  "competency_claim",
  "objective_coverage",
  "procedure_coverage",
  "assessment_coverage",
]);

export const AlignmentCheckSchema = z.object({
  id: z.string().trim().min(1).max(80),
  dimension: AlignmentDimensionSchema,
  status: AnalysisStatusSchema,
  source: z.literal("deterministic"),
  message: z.string().trim().min(1).max(500),
  evidence: z.array(z.string().trim().min(1).max(300)).max(6),
});

export const CurriculumAlignmentReportSchema = z.object({
  verificationState: z.enum(["verified", "unverified", "unsupported_claim"]),
  record: CurriculumProvenanceSnapshotSchema.nullable(),
  checks: z.array(AlignmentCheckSchema).min(1).max(12),
  disclaimer: z.literal("Deterministic checks are planning aids, not official curriculum certification."),
});

export const ObjectiveCriterionSchema = z.enum([
  "measurability",
  "clarity",
  "grade_appropriateness",
  "assessment_alignment",
]);

export const ObjectiveFindingSchema = z.object({
  criterion: ObjectiveCriterionSchema,
  status: AnalysisStatusSchema,
  message: z.string().trim().min(1).max(400),
});

export const ObjectiveValidationItemSchema = z.object({
  index: z.number().int().nonnegative(),
  objective: z.string().trim().min(1).max(1_000),
  detectedBloomLevel: BloomTaxonomyLevelSchema.nullable(),
  findings: z.array(ObjectiveFindingSchema).length(4),
});

export const ObjectiveValidationReportSchema = z.object({
  items: z.array(ObjectiveValidationItemSchema).min(1).max(20),
  disclaimer: z.literal("Objective checks are deterministic heuristics and remain subject to teacher judgment."),
});

export const TeachingSlideKindSchema = z.enum([
  "opening",
  "objectives",
  "subject_matter",
  "procedure",
  "assessment",
  "assignment",
]);

export const TeachingSlideSchema = z.object({
  id: z.string().trim().min(1),
  kind: TeachingSlideKindSchema,
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(200),
  lines: z.array(z.string().trim().min(1).max(1_000)).max(12),
  section: PedagogySectionSchema,
});

export type BloomTaxonomyLevel = z.infer<typeof BloomTaxonomyLevelSchema>;
export type PedagogySection = z.infer<typeof PedagogySectionSchema>;
export type DifferentiationCategory = z.infer<typeof DifferentiationCategorySchema>;
export type DifferentiationSuggestionDraft = z.infer<typeof DifferentiationSuggestionDraftSchema>;
export type DifferentiationRecord = z.infer<typeof DifferentiationRecordSchema>;
export type LessonPedagogy = z.infer<typeof LessonPedagogySchema>;
export type PrivateTeacherNote = z.infer<typeof PrivateTeacherNoteSchema>;
export type CurriculumAlignmentReport = z.infer<typeof CurriculumAlignmentReportSchema>;
export type ObjectiveValidationReport = z.infer<typeof ObjectiveValidationReportSchema>;
export type TeachingSlide = z.infer<typeof TeachingSlideSchema>;
