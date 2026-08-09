import { z } from "zod";

export const RubricCriterionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Criterion name is required"),
  weight: z.number().min(1, "Points / Weight must be at least 1"),
  descriptors: z.record(z.string(), z.string().min(1, "Descriptor statement is required")),
});

export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const RubricSchema = z.object({
  schemaVersion: z.string().default("1.0"),
  lessonId: z.string(),
  title: z.string().min(1, "Rubric title is required"),
  instructions: z.string().min(1, "Instructions are required"),
  levels: z.array(z.string()).min(2, "Must specify at least 2 levels of achievement"),
  criteria: z.array(RubricCriterionSchema).min(1, "Rubric must contain at least 1 criterion"),
});

export type Rubric = z.infer<typeof RubricSchema>;

export function safeParseRubric(data: unknown) {
  return RubricSchema.safeParse(data);
}

export function normalizeRubric(data: any): Rubric {
  const levels: string[] = Array.isArray(data?.levels) && data.levels.length >= 2 ? data.levels : ["Excellent", "Proficient", "Basic"];

  const criteria = Array.isArray(data?.criteria) ? data.criteria : [];
  const normalizedCriteria = criteria.map((crit: any, idx: number) => {
    const id = crit?.id || `crit-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
    const name = crit?.name || "Grading Criterion Focus";
    const weight = typeof crit?.weight === "number" ? crit.weight : 5;

    const descriptors: Record<string, string> = {};
    levels.forEach((lvl: string) => {
      descriptors[lvl] = crit?.descriptors?.[lvl] || `Performance guidelines for level ${lvl}`;
    });

    return {
      id,
      name,
      weight,
      descriptors,
    };
  });

  return {
    schemaVersion: data?.schemaVersion || "1.0",
    lessonId: data?.lessonId || "unlinked",
    title: data?.title || "Grading Assessment Rubric",
    instructions: data?.instructions || "Use this rubric guidelines to evaluate student outputs.",
    levels,
    criteria: normalizedCriteria,
  };
}
