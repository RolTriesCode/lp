import { findVerifiedCurriculumRecords, getVerifiedCurriculumRecordById } from "@/lib/curriculum/lookup";
import type { CurriculumRecord } from "@/lib/curriculum/types";
import type { LessonPlan } from "@/schemas/lesson";
import {
  BloomTaxonomyLevelSchema,
  CurriculumAlignmentReportSchema,
  ObjectiveValidationReportSchema,
  type BloomTaxonomyLevel,
  type CurriculumAlignmentReport,
  type ObjectiveValidationReport,
} from "@/schemas/pedagogy";

const BLOOM_VERBS: Record<BloomTaxonomyLevel, string[]> = {
  remember: ["define", "identify", "label", "list", "name", "recall", "recognize", "state"],
  understand: ["classify", "compare", "describe", "discuss", "explain", "interpret", "summarize"],
  apply: ["calculate", "construct", "demonstrate", "perform", "practice", "solve", "use"],
  analyze: ["analyze", "contrast", "differentiate", "examine", "infer", "organize", "investigate"],
  evaluate: ["assess", "critique", "defend", "evaluate", "judge", "justify", "recommend"],
  create: ["compose", "create", "design", "develop", "formulate", "plan", "produce"],
};

const STOP_WORDS = new Set([
  "about", "after", "before", "between", "could", "from", "have", "into", "lesson", "learners",
  "their", "these", "they", "through", "using", "what", "when", "where", "which", "with", "will",
]);

function normalize(value: string | undefined): string {
  return (value ?? "").toLocaleLowerCase().replace(/<[^>]*>/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string): Set<string> {
  return new Set(normalize(value).split(/\s+/).filter((token) => token.length >= 4 && !STOP_WORDS.has(token)));
}

function overlaps(target: string, candidate: string): string[] {
  const targetTokens = tokens(target);
  const candidateTokens = tokens(candidate);
  return [...targetTokens].filter((token) => candidateTokens.has(token));
}

function exactRecordForLesson(lesson: LessonPlan): CurriculumRecord | undefined {
  const snapshot = lesson.curriculumProvenance?.recordId
    ? getVerifiedCurriculumRecordById(lesson.curriculumProvenance.recordId)
    : undefined;
  if (snapshot) return snapshot;

  return findVerifiedCurriculumRecords({
    curriculum: lesson.curriculum,
    gradeLevel: lesson.gradeLevel,
    subject: lesson.subject,
    quarter: lesson.quarter,
  }).find((record) => normalize(record.topic) === normalize(lesson.subjectMatter.topic));
}

function recordMatchesScope(record: CurriculumRecord, lesson: LessonPlan): boolean {
  return record.curriculum === lesson.curriculum
    && normalize(record.gradeLevel) === normalize(lesson.gradeLevel)
    && normalize(record.subject) === normalize(lesson.subject)
    && normalize(record.quarter) === normalize(lesson.quarter)
    && normalize(record.topic) === normalize(lesson.subjectMatter.topic);
}

export function checkCurriculumAlignment(lesson: LessonPlan): CurriculumAlignmentReport {
  const record = exactRecordForLesson(lesson);
  const competencyCode = lesson.standards.competencyCode?.trim() ?? "";
  const officialCodeRecord = competencyCode
    ? findVerifiedCurriculumRecords({}).find(
        (candidate) => candidate.isOfficialCode && normalize(candidate.competencyCode) === normalize(competencyCode)
      )
    : undefined;
  const unsupportedClaim = Boolean(
    competencyCode && (!officialCodeRecord || !recordMatchesScope(officialCodeRecord, lesson))
  );

  const recordSnapshot = record && recordMatchesScope(record, lesson)
    ? {
        recordId: record.id,
        verificationStatus: record.verificationStatus as "VERIFIED_DEPED_OFFICIAL" | "VERIFIED_REGIONAL_OFFICIAL",
        sourceReference: record.sourceReference,
      }
    : null;
  const target = record?.competencyText || lesson.standards.learningCompetency || lesson.subjectMatter.topic;
  const objectiveText = lesson.objectives.join(" ");
  const procedureText = lesson.procedures.map((item) => `${item.title} ${item.content ?? ""} ${item.teacherActivity ?? ""} ${item.studentActivity ?? ""}`).join(" ");
  const assessmentText = (lesson.assessment ?? []).map((item) => item.question).join(" ");
  const objectiveCoverage = overlaps(target, objectiveText);
  const procedureCoverage = overlaps(objectiveText, procedureText);
  const assessmentCoverage = overlaps(objectiveText, assessmentText);

  const checks = [
    {
      id: "verified-context",
      dimension: "verified_context" as const,
      status: recordSnapshot ? "pass" as const : "not_checked" as const,
      source: "deterministic" as const,
      message: recordSnapshot
        ? "Lesson metadata matches a verified local curriculum record."
        : "No exact verified local curriculum record matches all lesson metadata.",
      evidence: recordSnapshot ? [record!.sourceReference] : ["This lesson remains teacher-authored and unverified."],
    },
    {
      id: "competency-claim",
      dimension: "competency_claim" as const,
      status: unsupportedClaim ? "fail" as const : competencyCode ? "pass" as const : "not_checked" as const,
      source: "deterministic" as const,
      message: unsupportedClaim
        ? "The competency code is not supported for this verified curriculum scope."
        : competencyCode
          ? "The competency code matches a verified official record for this scope."
          : "No official competency-code claim is present.",
      evidence: competencyCode ? [`Code reviewed: ${competencyCode}`] : ["Blank codes are not treated as official claims."],
    },
    {
      id: "objective-coverage",
      dimension: "objective_coverage" as const,
      status: objectiveCoverage.length > 0 ? "pass" as const : "warning" as const,
      source: "deterministic" as const,
      message: objectiveCoverage.length > 0
        ? "Objectives share explicit concepts with the target competency."
        : "Objectives do not share clear concept terms with the target competency.",
      evidence: objectiveCoverage.length > 0 ? objectiveCoverage.slice(0, 6) : ["Review the objective wording against the competency statement."],
    },
    {
      id: "procedure-coverage",
      dimension: "procedure_coverage" as const,
      status: procedureCoverage.length > 0 ? "pass" as const : "warning" as const,
      source: "deterministic" as const,
      message: procedureCoverage.length > 0
        ? "Procedures use concepts named in the lesson objectives."
        : "Procedures have limited direct vocabulary overlap with the objectives.",
      evidence: procedureCoverage.length > 0 ? procedureCoverage.slice(0, 6) : ["This is a text-overlap heuristic; teacher review is required."],
    },
    {
      id: "assessment-coverage",
      dimension: "assessment_coverage" as const,
      status: !lesson.assessment?.length ? "warning" as const : assessmentCoverage.length > 0 ? "pass" as const : "warning" as const,
      source: "deterministic" as const,
      message: !lesson.assessment?.length
        ? "No assessment items are available to compare with the objectives."
        : assessmentCoverage.length > 0
          ? "Assessment prompts use concepts named in the objectives."
          : "Assessment prompts have limited direct vocabulary overlap with the objectives.",
      evidence: assessmentCoverage.length > 0 ? assessmentCoverage.slice(0, 6) : ["Check whether each objective has observable assessment evidence."],
    },
  ];

  return CurriculumAlignmentReportSchema.parse({
    verificationState: unsupportedClaim ? "unsupported_claim" : recordSnapshot ? "verified" : "unverified",
    record: recordSnapshot,
    checks,
    disclaimer: "Deterministic checks are planning aids, not official curriculum certification.",
  });
}

export function detectBloomLevel(objective: string): BloomTaxonomyLevel | null {
  const words = new Set(normalize(objective).split(/\s+/));
  const levels = BloomTaxonomyLevelSchema.options;
  for (const level of [...levels].reverse()) {
    if (BLOOM_VERBS[level].some((verb) => words.has(verb))) return level;
  }
  return null;
}

export function validateObjectives(lesson: LessonPlan): ObjectiveValidationReport {
  const assessmentText = (lesson.assessment ?? []).map((item) => item.question).join(" ");
  const numericGrade = Number(lesson.gradeLevel.match(/\d+/)?.[0]);

  const items = lesson.objectives.map((objective, index) => {
    const wordCount = objective.trim().split(/\s+/).filter(Boolean).length;
    const bloomLevel = detectBloomLevel(objective);
    const vague = /\b(?:know|learn|understand|appreciate|be aware of)\b/i.test(objective);
    const assessmentTerms = overlaps(objective, assessmentText);
    const complexForEarlyGrade = Number.isFinite(numericGrade)
      && numericGrade <= 3
      && bloomLevel !== null
      && (["analyze", "evaluate", "create"] as BloomTaxonomyLevel[]).includes(bloomLevel);

    return {
      index,
      objective,
      detectedBloomLevel: bloomLevel,
      findings: [
        {
          criterion: "measurability" as const,
          status: bloomLevel && !vague ? "pass" as const : "fail" as const,
          message: bloomLevel && !vague
            ? `Uses an observable ${bloomLevel} verb.`
            : "Use one observable action verb instead of a vague learning intention.",
        },
        {
          criterion: "clarity" as const,
          status: wordCount >= 4 && wordCount <= 35 ? "pass" as const : "warning" as const,
          message: wordCount < 4
            ? "The objective may be too brief to name a clear outcome."
            : wordCount > 35
              ? "Consider splitting this objective into one observable outcome at a time."
              : "The objective is concise enough for practical review.",
        },
        {
          criterion: "grade_appropriateness" as const,
          status: complexForEarlyGrade || wordCount > 40 ? "warning" as const : "pass" as const,
          message: complexForEarlyGrade
            ? "Higher-order demand can be suitable here when the procedure supplies concrete scaffolds."
            : wordCount > 40
              ? "Long wording may increase language demand; review it for this grade."
              : "No obvious text-complexity concern was detected for the stated grade.",
        },
        {
          criterion: "assessment_alignment" as const,
          status: !lesson.assessment?.length ? "not_checked" as const : assessmentTerms.length > 0 ? "pass" as const : "warning" as const,
          message: !lesson.assessment?.length
            ? "Add an assessment item before checking objective evidence."
            : assessmentTerms.length > 0
              ? "At least one assessment prompt shares a concept with this objective."
              : "No clear concept overlap was found in the assessment prompts.",
        },
      ],
    };
  });

  return ObjectiveValidationReportSchema.parse({
    items,
    disclaimer: "Objective checks are deterministic heuristics and remain subject to teacher judgment.",
  });
}

export const observableBloomVerbs = BLOOM_VERBS;

