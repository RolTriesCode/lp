import type { LessonPlanFormValues } from "@/lib/lesson-plan-schema";
import { getCurriculumConfig } from "./config";
import { getCurriculumProvenance, getVerifiedCurriculumRecordById } from "./lookup";
import type { CurriculumContext, CurriculumRecord } from "./types";
import { lessonPlanFormSchema } from "@/lib/lesson-plan-schema";

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
  const exactRecord = input.curriculumRecordId
    ? getVerifiedCurriculumRecordById(input.curriculumRecordId)
    : undefined;
  const exactRecordMatches = exactRecord
    ? curriculumRecordMatchesLessonInput(exactRecord, input)
    : false;
  const provenance = input.curriculumRecordId
    ? exactRecordMatches && exactRecord
      ? {
          sourceReference: exactRecord.sourceReference,
          verificationStatus: exactRecord.verificationStatus,
          isOfficialCode: exactRecord.isOfficialCode,
          matchedRecord: exactRecord,
        }
      : {
          sourceReference: "Teacher inputs changed after curriculum selection (unverified)",
          verificationStatus: "UNVERIFIED_TEACHER_DRAFT" as const,
          isOfficialCode: false,
        }
    : getCurriculumProvenance(
        input.curriculum,
        `Grade ${input.grade}`,
        input.subject,
        input.topic,
        input.quarter,
        input.competency
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

export function applyVerifiedCurriculumRecord(
  current: LessonPlanFormValues,
  record: CurriculumRecord
): LessonPlanFormValues {
  if (record.verificationStatus === "UNVERIFIED_TEACHER_DRAFT") {
    throw new Error("Only verified curriculum records can populate lesson inputs.");
  }

  return lessonPlanFormSchema.parse({
    ...current,
    curriculumRecordId: record.id,
    curriculum: record.curriculum,
    grade: record.gradeLevel.replace(/^Grade\s+/i, ""),
    subject: record.subject,
    quarter: record.quarter,
    topic: record.topic,
    competency: record.competencyText,
  });
}

function normalized(value: string | undefined): string {
  return (value ?? "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function curriculumRecordMatchesLessonInput(
  record: CurriculumRecord,
  input: LessonPlanFormValues
): boolean {
  const competency = normalized(input.competency);
  return (
    record.verificationStatus !== "UNVERIFIED_TEACHER_DRAFT" &&
    record.curriculum === input.curriculum &&
    normalized(record.gradeLevel) === normalized(`Grade ${input.grade}`) &&
    normalized(record.subject) === normalized(input.subject) &&
    normalized(record.quarter) === normalized(input.quarter) &&
    normalized(record.topic) === normalized(input.topic) &&
    (competency === "" || competency === normalized(record.competencyText))
  );
}
