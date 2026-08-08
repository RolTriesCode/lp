import { z } from "zod";

export const lessonPlanFormSchema = z.object({
  curriculum: z.enum(["MATATAG", "ILAW"]),
  grade: z.enum(["7", "8", "9", "10"]),
  subject: z.enum(["Science", "Mathematics", "English", "Araling Panlipunan"]),
  type: z.enum(["detailed", "semi-detailed", "daily-log"]),
  topic: z
    .string()
    .trim()
    .min(3, "Enter a topic or learning competency.")
    .max(160, "Keep the topic under 160 characters."),
});

export type LessonPlanFormValues = z.infer<typeof lessonPlanFormSchema>;

export const lessonPlanDefaults: LessonPlanFormValues = {
  curriculum: "MATATAG",
  grade: "7",
  subject: "Science",
  type: "detailed",
  topic: "",
};

export function toLessonPlanSearchParams(values: LessonPlanFormValues) {
  return new URLSearchParams(values);
}

type RawSearchParams = Record<string, string | string[] | undefined>;

export function parseLessonPlanSearchParams(searchParams: RawSearchParams) {
  const firstValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  return lessonPlanFormSchema.safeParse({
    curriculum: firstValue(searchParams.curriculum),
    grade: firstValue(searchParams.grade),
    subject: firstValue(searchParams.subject),
    type: firstValue(searchParams.type),
    topic: firstValue(searchParams.topic),
  });
}
