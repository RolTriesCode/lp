import { VERIFIED_CURRICULUM_RECORDS } from "@/data/curriculum/records";
import type { CurriculumType } from "@/schemas/lesson";
import type { CurriculumRecord, VerificationStatus } from "./types";

export type CurriculumFilter = {
  curriculum?: CurriculumType;
  gradeLevel?: string;
  subject?: string;
  quarter?: string;
  topicSearch?: string;
};

/**
 * Normalizes string comparison for flexible topic matching.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Searches and filters verified curriculum records by framework, grade, subject, quarter, or topic keyword.
 */
export function findCurriculumRecords(filter: CurriculumFilter): CurriculumRecord[] {
  return VERIFIED_CURRICULUM_RECORDS.filter((record) => {
    if (filter.curriculum && record.curriculum !== filter.curriculum) {
      return false;
    }
    if (filter.gradeLevel && record.gradeLevel !== filter.gradeLevel) {
      return false;
    }
    if (filter.subject && record.subject.toLowerCase() !== filter.subject.toLowerCase()) {
      return false;
    }
    if (filter.quarter && record.quarter !== filter.quarter) {
      return false;
    }
    if (filter.topicSearch) {
      const normQuery = normalizeText(filter.topicSearch);
      const normTopic = normalizeText(record.topic);
      const normComp = normalizeText(record.competencyText);
      if (!normTopic.includes(normQuery) && !normComp.includes(normQuery)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Look up official DepEd competency code for a given curriculum, grade, subject, and topic.
 * Returns official verified code string if found and verified; otherwise returns undefined.
 * GUARANTEE: Never invents or fabricates an official code.
 */
export function getVerifiedCompetencyCode(
  curriculum: CurriculumType,
  gradeLevel: string,
  subject: string,
  topic: string
): string | undefined {
  const matches = findCurriculumRecords({ curriculum, gradeLevel, subject, topicSearch: topic });
  const official = matches.find((m) => m.isOfficialCode && Boolean(m.competencyCode));
  return official?.competencyCode;
}

export type ProvenanceInfo = {
  sourceReference: string;
  verificationStatus: VerificationStatus;
  isOfficialCode: boolean;
  matchedRecord?: CurriculumRecord;
};

/**
 * Returns provenance information and verification status for a given curriculum scope.
 */
export function getCurriculumProvenance(
  curriculum: CurriculumType,
  gradeLevel: string,
  subject: string,
  topic: string
): ProvenanceInfo {
  const matches = findCurriculumRecords({ curriculum, gradeLevel, subject, topicSearch: topic });
  if (matches.length > 0) {
    const match = matches[0];
    return {
      sourceReference: match.sourceReference,
      verificationStatus: match.verificationStatus,
      isOfficialCode: match.isOfficialCode,
      matchedRecord: match,
    };
  }

  return {
    sourceReference: "Teacher Custom Input (Unverified against official database)",
    verificationStatus: "UNVERIFIED_TEACHER_DRAFT",
    isOfficialCode: false,
  };
}
