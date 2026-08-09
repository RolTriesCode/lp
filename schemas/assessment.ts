import { z } from "zod";

export const AssessmentItemTypeSchema = z.enum([
  "multiple_choice",
  "true_or_false",
  "identification",
  "essay",
  "performance_task",
]);

export type AssessmentItemType = z.infer<typeof AssessmentItemTypeSchema>;

export const AssessmentItemSchema = z.object({
  id: z.string(),
  type: AssessmentItemTypeSchema,
  question: z.string().min(1, "Question text cannot be empty"),
  points: z.number().min(1, "Points must be at least 1"),
  choices: z.array(z.string()).optional(),
  answer: z.string().min(1, "Correct answer key cannot be empty"),
  rubric: z.string().optional(),
});

export type AssessmentItem = z.infer<typeof AssessmentItemSchema>;

export const AssessmentSchema = z.object({
  schemaVersion: z.string().default("1.0"),
  lessonId: z.string(),
  title: z.string().min(1, "Assessment title is required"),
  instructions: z.string().min(1, "Instructions are required"),
  difficulty: z.enum(["easy", "average", "difficult"]),
  items: z.array(AssessmentItemSchema).min(1, "Assessment must contain at least 1 item"),
});

export type Assessment = z.infer<typeof AssessmentSchema>;

export function safeParseAssessment(data: unknown) {
  return AssessmentSchema.safeParse(data);
}

export function normalizeAssessment(data: any): Assessment {
  const items = Array.isArray(data?.items) ? data.items : [];
  const normalizedItems = items.map((item: any, idx: number) => {
    const id = item?.id || `item-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
    const type = AssessmentItemTypeSchema.safeParse(item?.type).success ? item.type : "multiple_choice";
    const points = typeof item?.points === "number" ? item.points : type === "essay" || type === "performance_task" ? 5 : 1;
    const question = item?.question || "Sample Question Text";
    const choices = Array.isArray(item?.choices) ? item.choices : type === "multiple_choice" ? ["Option A", "Option B", "Option C", "Option D"] : type === "true_or_false" ? ["True", "False"] : undefined;
    const answer = item?.answer || (type === "true_or_false" ? "True" : "Correct Answer");

    return {
      id,
      type,
      question,
      points,
      choices,
      answer,
      rubric: item?.rubric || (type === "essay" || type === "performance_task" ? "Graded based on clarity, structure, and accuracy." : undefined),
    };
  });

  return {
    schemaVersion: data?.schemaVersion || "1.0",
    lessonId: data?.lessonId || "unlinked",
    title: data?.title || "Classroom Assessment Check",
    instructions: data?.instructions || "Answer all questions honestly on the space provided.",
    difficulty: ["easy", "average", "difficult"].includes(data?.difficulty) ? data.difficulty : "average",
    items: normalizedItems,
  };
}
