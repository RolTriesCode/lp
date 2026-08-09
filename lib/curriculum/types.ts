import { z } from "zod";
import type { CurriculumType } from "@/schemas/lesson";

/**
 * Provenance / Verification Status for curriculum competency records.
 */
export const VerificationStatusSchema = z.enum([
  "VERIFIED_DEPED_OFFICIAL",
  "VERIFIED_REGIONAL_OFFICIAL",
  "UNVERIFIED_TEACHER_DRAFT",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

/**
 * Typed Curriculum Record Schema representing verified DepEd / Regional competencies.
 */
export const CurriculumRecordSchema = z.object({
  id: z.string().trim().min(1),
  curriculum: z.enum(["MATATAG", "ILAW"]),
  gradeLevel: z.string().trim().min(1),
  subject: z.string().trim().min(1),
  quarter: z.string().trim().min(1),
  topic: z.string().trim().min(1),
  competencyText: z.string().trim().min(1),
  competencyCode: z.string().trim().optional().default(""),
  sourceReference: z.string().trim().min(1),
  verificationStatus: VerificationStatusSchema,
  isOfficialCode: z.boolean(),
});
export type CurriculumRecord = z.infer<typeof CurriculumRecordSchema>;

/**
 * Section requirement definition for a specific curriculum framework.
 */
export type SectionExpectation = {
  sectionKey: string;
  label: string;
  isRequired: boolean;
  guidelines: string;
};

/**
 * Framework-specific terminology map.
 */
export type CurriculumTerminology = {
  contentStandardLabel: string;
  performanceStandardLabel: string;
  competencyLabel: string;
  valuesIntegrationLabel: string;
  procedureFrameworkName: string;
};

/**
 * Explicit Configuration object governing MATATAG vs ILAW behavior.
 */
export type CurriculumConfig = {
  id: CurriculumType;
  name: string;
  version: string;
  description: string;
  terminology: CurriculumTerminology;
  sections: SectionExpectation[];
  procedureStages: string[];
  requiresValuesIntegration: boolean;
  supportsOfficialCodes: boolean;
  validateLessonPlan: (lesson: Record<string, unknown>) => { valid: boolean; errors: string[] };
};

/**
 * Assembled Context Payload prepared for AI prompt generation & server actions.
 */
export type CurriculumContext = {
  curriculum: CurriculumType;
  config: CurriculumConfig;
  gradeLevel: string;
  subject: string;
  quarter: string;
  topic: string;
  matchedRecord?: CurriculumRecord;
  competencyText: string;
  competencyCode: string;
  sourceReference: string;
  verificationStatus: VerificationStatus;
  isOfficialCode: boolean;
  valuesIntegrationRequired: boolean;
};
