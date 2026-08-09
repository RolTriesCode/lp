import { z } from "zod";
import type { SectionType } from "@/lib/ai/rewrite-section";
import {
  AssessmentItemSchema,
  LessonProcedureSchema,
  LessonStandardsSchema,
  SubjectMatterSchema,
} from "@/schemas/lesson";

const schemas: Record<SectionType, z.ZodType> = {
  objectives: z.array(z.string().trim().min(3).max(1_000)).min(1).max(20),
  procedures: z.array(LessonProcedureSchema).min(1).max(30),
  assessment: z.array(AssessmentItemSchema).max(40),
  reflection: z.object({
    assignment: z.string().trim().max(2_000).optional(),
    reflection: z.string().trim().max(2_000),
  }),
  standards: LessonStandardsSchema,
  subjectMatter: SubjectMatterSchema,
};

export function validateSectionSuggestion(sectionType: SectionType, value: unknown): unknown {
  return schemas[sectionType].parse(value);
}
