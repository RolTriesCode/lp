import { z } from "zod";

export const WorksheetItemSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question statement is required"),
  points: z.number().min(1, "Points must be at least 1"),
  hint: z.string().optional(),
  answer: z.string().min(1, "Correct answer key is required"),
});

export type WorksheetItem = z.infer<typeof WorksheetItemSchema>;

export const WorksheetSchema = z.object({
  schemaVersion: z.string().default("1.0"),
  lessonId: z.string(),
  title: z.string().min(1, "Worksheet title is required"),
  instructions: z.string().min(1, "Instructions are required"),
  difficulty: z.enum(["easy", "average", "difficult"]),
  items: z.array(WorksheetItemSchema).min(1, "Worksheet must contain at least 1 item"),
});

export type Worksheet = z.infer<typeof WorksheetSchema>;

export function safeParseWorksheet(data: unknown) {
  return WorksheetSchema.safeParse(data);
}

export function normalizeWorksheet(data: any): Worksheet {
  const items = Array.isArray(data?.items) ? data.items : [];
  const normalizedItems = items.map((item: any, idx: number) => {
    const id = item?.id || `ws-item-${Date.now().toString(36)}-${idx}-${Math.random().toString(36).substring(2, 5)}`;
    const question = item?.question || "Fill in the blank or answer this activity question.";
    const points = typeof item?.points === "number" ? item.points : 5;
    const hint = item?.hint || "Think about the key terms discussed in class.";
    const answer = item?.answer || "Expected Correct Answer Key / Solution";

    return {
      id,
      question,
      points,
      hint,
      answer,
    };
  });

  return {
    schemaVersion: data?.schemaVersion || "1.0",
    lessonId: data?.lessonId || "unlinked",
    title: data?.title || "Classroom Activity Worksheet",
    instructions: data?.instructions || "Read the prompts carefully and write your answers in the spaces provided.",
    difficulty: ["easy", "average", "difficult"].includes(data?.difficulty) ? data.difficulty : "average",
    items: normalizedItems,
  };
}
