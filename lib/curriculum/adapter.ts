import type { LessonPlanFormValues } from "@/lib/lesson-plan-schema";
import { getCurriculumConfig } from "./config";
import { getCurriculumProvenance } from "./lookup";
import type { CurriculumContext } from "./types";

/**
 * Assembles a structured CurriculumContext for AI model generation, server actions,
 * document generators, and alignment validation tools.
 *
 * GUARANTEES:
 * 1. Source-of-truth verified records are locked and attached when available.
 * 2. Unverified or custom inputs never fabricate DepEd competency codes.
 * 3. Framework-specific rules (e.g. ILAW mandatory values integration) are enforced.
 */
export function assembleCurriculumContext(input: LessonPlanFormValues): CurriculumContext {
  const config = getCurriculumConfig(input.curriculum);
  const provenance = getCurriculumProvenance(
    input.curriculum,
    `Grade ${input.grade}`,
    input.subject,
    input.topic
  );

  let finalCompetencyText = input.competency?.trim() || "";
  let finalCompetencyCode = "";
  let isOfficialCode = false;

  if (provenance.matchedRecord) {
    const record = provenance.matchedRecord;
    finalCompetencyText = finalCompetencyText || record.competencyText;
    if (record.isOfficialCode && record.competencyCode) {
      finalCompetencyCode = record.competencyCode;
      isOfficialCode = true;
    }
  }

  // If user typed a custom competency code, verify whether it matches official record
  if (input.competency?.trim() && !isOfficialCode) {
    // If unverified, keep code empty or treat strictly as unverified text
    finalCompetencyCode = "";
    isOfficialCode = false;
  }

  return {
    curriculum: input.curriculum,
    config,
    gradeLevel: `Grade ${input.grade}`,
    subject: input.subject,
    quarter: input.quarter,
    topic: input.topic,
    matchedRecord: provenance.matchedRecord,
    competencyText: finalCompetencyText,
    competencyCode: finalCompetencyCode,
    sourceReference: provenance.sourceReference,
    verificationStatus: provenance.verificationStatus,
    isOfficialCode,
    valuesIntegrationRequired: config.requiresValuesIntegration,
  };
}
