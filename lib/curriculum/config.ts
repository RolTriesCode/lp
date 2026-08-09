import type { CurriculumType } from "@/schemas/lesson";
import type { CurriculumConfig } from "./types";

/**
 * MATATAG Framework Configuration (DepEd 2024 Revised Curriculum)
 */
export const MATATAG_CONFIG: CurriculumConfig = {
  id: "MATATAG",
  name: "MATATAG Curriculum (DepEd 2024)",
  version: "2024.1",
  description:
    "Outcome-based basic education curriculum focusing on core competencies, 21st-century skills, and explicit Content and Performance Standards.",
  terminology: {
    contentStandardLabel: "Content Standard",
    performanceStandardLabel: "Performance Standard",
    competencyLabel: "Learning Competency (DepEd MATATAG)",
    valuesIntegrationLabel: "Values Integration",
    procedureFrameworkName: "MATATAG Structured Teaching Sequence",
  },
  sections: [
    {
      sectionKey: "standards",
      label: "Curriculum Standards",
      isRequired: true,
      guidelines:
        "Must specify Content Standard, Performance Standard, and Learning Competency.",
    },
    {
      sectionKey: "objectives",
      label: "Learning Objectives",
      isRequired: true,
      guidelines:
        "Define specific, measurable cognitive, skill, and affective learning targets.",
    },
    {
      sectionKey: "subjectMatter",
      label: "Subject Matter",
      isRequired: true,
      guidelines: "Specify topic, official DepEd references, and learning resources.",
    },
    {
      sectionKey: "procedures",
      label: "Lesson Procedures",
      isRequired: true,
      guidelines:
        "Follow structured teaching steps (Preliminary activities, Motivation, Lesson Proper, Practice, Generalization).",
    },
    {
      sectionKey: "assessment",
      label: "Assessment & Evaluation",
      isRequired: true,
      guidelines: "Include formative or summative evaluation items.",
    },
  ],
  procedureStages: [
    "A. Preliminary Activities & Prayer",
    "B. Motivation & Priming",
    "C. Lesson Proper & Discussion",
    "D. Guided & Independent Practice",
    "E. Generalization & Reflection",
  ],
  requiresValuesIntegration: false,
  supportsOfficialCodes: true,
  validateLessonPlan(lesson: Record<string, unknown>) {
    const errors: string[] = [];
    if (!lesson.title) errors.push("MATATAG lesson requires a title.");
    if (!lesson.gradeLevel) errors.push("MATATAG lesson requires a grade level.");
    if (!lesson.subject) errors.push("MATATAG lesson requires a subject area.");
    return { valid: errors.length === 0, errors };
  },
};

/**
 * ILAW Framework Configuration (Values-Integrated & Contextualized Curriculum)
 */
export const ILAW_CONFIG: CurriculumConfig = {
  id: "ILAW",
  name: "ILAW Curriculum Framework",
  version: "2023.2",
  description:
    "Contextualized, values-driven framework integrating character education, localized literacy, and community-centered learning outcomes.",
  terminology: {
    contentStandardLabel: "Learning Standard",
    performanceStandardLabel: "Performance Indicator",
    competencyLabel: "ILAW Focus Competency",
    valuesIntegrationLabel: "Core Values Integration (Mandatory)",
    procedureFrameworkName: "ILAW Values-Driven Experiential Cycle",
  },
  sections: [
    {
      sectionKey: "standards",
      label: "ILAW Learning Standards",
      isRequired: true,
      guidelines: "Focus on contextualized learning standards and competencies.",
    },
    {
      sectionKey: "objectives",
      label: "Values-Integrated Objectives",
      isRequired: true,
      guidelines: "Include character and values-centered behavioral objectives.",
    },
    {
      sectionKey: "subjectMatter",
      label: "Subject Matter & Values Focus",
      isRequired: true,
      guidelines: "Mandatory inclusion of core values integration in topic materials.",
    },
    {
      sectionKey: "procedures",
      label: "Contextualized Procedures",
      isRequired: true,
      guidelines: "Emphasize moral priming, practical discussion, and values reflection.",
    },
    {
      sectionKey: "assessment",
      label: "Values-Aligned Assessment",
      isRequired: true,
      guidelines: "Assess both academic understanding and moral application.",
    },
  ],
  procedureStages: [
    "1. Contextualized Priming & Values Focus",
    "2. Interactive Discussion & Moral Aspect",
    "3. Localized Application Activity",
    "4. Values Synthesis & Action Plan",
  ],
  requiresValuesIntegration: true,
  supportsOfficialCodes: false,
  validateLessonPlan(lesson: Record<string, unknown>) {
    const errors: string[] = [];
    if (!lesson.title) errors.push("ILAW lesson requires a title.");
    const sm = lesson.subjectMatter as Record<string, unknown> | undefined;
    const values = sm?.valuesIntegration as unknown[];
    if (!values || !Array.isArray(values) || values.length === 0) {
      errors.push("ILAW curriculum requires explicit Values Integration entries in Subject Matter.");
    }
    return { valid: errors.length === 0, errors };
  },
};

/**
 * Returns the explicit CurriculumConfig for a given curriculum type.
 */
export function getCurriculumConfig(curriculum: CurriculumType): CurriculumConfig {
  switch (curriculum) {
    case "MATATAG":
      return MATATAG_CONFIG;
    case "ILAW":
      return ILAW_CONFIG;
    default:
      return MATATAG_CONFIG;
  }
}
