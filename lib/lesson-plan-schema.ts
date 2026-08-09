import { z } from "zod";
import { UploadedReferenceListSchema } from "@/schemas/reference";

export const curriculumValues = ["MATATAG", "ILAW"] as const;
export const gradeValues = ["7", "8", "9", "10", "1", "2", "3", "4", "5", "6", "11", "12", "Kindergarten"] as const;
export const subjectValues = [
  "Science",
  "Mathematics",
  "English",
  "Araling Panlipunan",
  "Filipino",
  "MAPEH",
  "Values Education",
  "Technology & Livelihood Education",
] as const;
export const lessonTypeValues = ["detailed", "semi-detailed", "daily-log"] as const;
export const quarterValues = ["Q1", "Q2", "Q3", "Q4"] as const;
export const durationValues = ["45 mins", "50 mins", "60 mins", "90 mins", "2 hours"] as const;
export const classSizeValues = ["small", "standard", "large", "overcrowded"] as const;
export const resourceValues = ["printables", "chalkboard", "projector", "tech_lab"] as const;
export const languageValues = ["english", "filipino", "bilingual", "regional"] as const;

export const curriculumOptions = [
  {
    value: "MATATAG",
    label: "MATATAG Curriculum",
    description: "DepEd 2024 revised, outcome-based framework",
  },
  {
    value: "ILAW",
    label: "ILAW Curriculum",
    description: "Values-integrated & contextualized framework",
  },
] as const;

export const lessonTypeOptions = [
  {
    value: "detailed",
    label: "Detailed Lesson Plan (DLP)",
    description: "Full teacher & student dialogue scripts with complete procedures",
  },
  {
    value: "semi-detailed",
    label: "Semi-Detailed Lesson Plan",
    description: "Structured procedural outline with key teaching activities",
  },
  {
    value: "daily-log",
    label: "Daily Lesson Log (DLL)",
    description: "Concise tabular log for tracking weekly competencies & tasks",
  },
] as const;

export const gradeOptions = [
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
  { value: "10", label: "Grade 10" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" },
  { value: "11", label: "Grade 11" },
  { value: "12", label: "Grade 12" },
  { value: "Kindergarten", label: "Kindergarten" },
] as const;

export const subjectOptions = [
  { value: "Science", label: "Science" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "English", label: "English" },
  { value: "Araling Panlipunan", label: "Araling Panlipunan" },
  { value: "Filipino", label: "Filipino" },
  { value: "MAPEH", label: "MAPEH" },
  { value: "Values Education", label: "Values Education" },
  { value: "Technology & Livelihood Education", label: "TLE / TVL" },
] as const;

export const quarterOptions = [
  { value: "Q1", label: "Quarter 1 (Q1)" },
  { value: "Q2", label: "Quarter 2 (Q2)" },
  { value: "Q3", label: "Quarter 3 (Q3)" },
  { value: "Q4", label: "Quarter 4 (Q4)" },
] as const;

export const durationOptions = [
  { value: "45 mins", label: "45 Minutes (Single Period)" },
  { value: "50 mins", label: "50 Minutes (Standard Period)" },
  { value: "60 mins", label: "60 Minutes (1 Hour)" },
  { value: "90 mins", label: "90 Minutes (Block Period)" },
  { value: "2 hours", label: "2 Hours (Double Period)" },
] as const;

export const classSizeOptions = [
  { value: "small", label: "Small (1–20 learners)" },
  { value: "standard", label: "Standard (21–40 learners)" },
  { value: "large", label: "Large (41–60 learners)" },
  { value: "overcrowded", label: "Overcrowded (60+ learners)" },
] as const;

export const resourceOptions = [
  { value: "printables", label: "Printables & Worksheets only" },
  { value: "chalkboard", label: "Chalkboard / Manila Paper" },
  { value: "projector", label: "TV Screen / Projector Available" },
  { value: "tech_lab", label: "1:1 Learner Devices / Computer Lab" },
] as const;

export const languageOptions = [
  { value: "english", label: "English" },
  { value: "filipino", label: "Filipino" },
  { value: "bilingual", label: "Bilingual (English & Filipino)" },
  { value: "regional", label: "Mother Tongue / Regional" },
] as const;

export const lessonPlanFormSchema = z.object({
  curriculumRecordId: z.string().trim().min(1).max(120).optional(),
  curriculum: z.enum(curriculumValues),
  grade: z.enum(gradeValues),
  subject: z.enum(subjectValues),
  type: z.enum(lessonTypeValues),
  quarter: z.enum(quarterValues),
  topic: z
    .string()
    .trim()
    .min(3, "Enter a topic or learning competency (at least 3 characters).")
    .max(160, "Keep the topic under 160 characters."),
  competency: z.string().trim().max(250, "Keep competency under 250 characters.").optional(),
  duration: z.enum(durationValues),
  classSize: z.enum(classSizeValues),
  resources: z.enum(resourceValues),
  language: z.enum(languageValues),
  instructions: z.string().trim().max(500, "Keep instructions under 500 characters.").optional(),
  uploadedReferences: UploadedReferenceListSchema.optional(),
});

export type LessonPlanFormValues = z.infer<typeof lessonPlanFormSchema>;

export const lessonPlanDefaults: LessonPlanFormValues = {
  curriculum: "MATATAG",
  grade: "7",
  subject: "Science",
  type: "detailed",
  quarter: "Q1",
  topic: "Photosynthesis in Plants",
  competency: "",
  duration: "60 mins",
  classSize: "standard",
  resources: "projector",
  language: "english",
  instructions: "",
  uploadedReferences: [],
};

export function toLessonPlanSearchParams(values: Partial<LessonPlanFormValues>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "") {
      params.set(key, String(val));
    }
  });
  return params;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

function isEnumValue<T extends readonly string[]>(allowed: T, val: unknown): val is T[number] {
  return typeof val === "string" && allowed.includes(val as T[number]);
}

export function parseLessonPlanSearchParams(searchParams: RawSearchParams): LessonPlanFormValues {
  const firstValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const rawCurriculum = firstValue(searchParams.curriculum);
  const rawGrade = firstValue(searchParams.grade);
  const rawSubject = firstValue(searchParams.subject);
  const rawType = firstValue(searchParams.type);
  const rawQuarter = firstValue(searchParams.quarter);
  const rawTopic = firstValue(searchParams.topic)?.trim();
  const rawCompetency = firstValue(searchParams.competency)?.trim();
  const rawDuration = firstValue(searchParams.duration);
  const rawClassSize = firstValue(searchParams.classSize);
  const rawResources = firstValue(searchParams.resources);
  const rawLanguage = firstValue(searchParams.language);
  const rawInstructions = firstValue(searchParams.instructions)?.trim();

  const candidate: LessonPlanFormValues = {
    curriculum: isEnumValue(curriculumValues, rawCurriculum) ? rawCurriculum : lessonPlanDefaults.curriculum,
    grade: isEnumValue(gradeValues, rawGrade) ? rawGrade : lessonPlanDefaults.grade,
    subject: isEnumValue(subjectValues, rawSubject) ? rawSubject : lessonPlanDefaults.subject,
    type: isEnumValue(lessonTypeValues, rawType) ? rawType : lessonPlanDefaults.type,
    quarter: isEnumValue(quarterValues, rawQuarter) ? rawQuarter : lessonPlanDefaults.quarter,
    topic: rawTopic && rawTopic.length >= 3 ? rawTopic.slice(0, 160) : lessonPlanDefaults.topic,
    competency: rawCompetency ? rawCompetency.slice(0, 250) : "",
    duration: isEnumValue(durationValues, rawDuration) ? rawDuration : lessonPlanDefaults.duration,
    classSize: isEnumValue(classSizeValues, rawClassSize) ? rawClassSize : lessonPlanDefaults.classSize,
    resources: isEnumValue(resourceValues, rawResources) ? rawResources : lessonPlanDefaults.resources,
    language: isEnumValue(languageValues, rawLanguage) ? rawLanguage : lessonPlanDefaults.language,
    instructions: rawInstructions ? rawInstructions.slice(0, 500) : "",
    uploadedReferences: [],
  };

  const parsed = lessonPlanFormSchema.safeParse(candidate);
  if (parsed.success) {
    return parsed.data;
  }

  return lessonPlanDefaults;
}
