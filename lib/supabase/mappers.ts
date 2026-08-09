import { AssessmentSchema, type Assessment } from "@/schemas/assessment";
import { LessonPlanSchema, type LessonPlan } from "@/schemas/lesson";
import { PresentationSchema, type Presentation } from "@/schemas/presentation";
import { TeachingResourceSchema, type TeachingResource } from "@/schemas/resource";
import { LessonTemplateSchema, type LessonTemplate } from "@/schemas/template";
import { WorksheetSchema, type Worksheet } from "@/schemas/worksheet";
import type {
  Enums,
  Json,
  Tables,
  TablesInsert,
} from "./database.types";

export type RecordStatus = Enums<"record_status">;

function toJson(value: unknown): Json {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("Canonical content must be JSON serializable.");
  }
  return JSON.parse(serialized) as Json;
}

export function lessonPlanToInsert(
  userId: string,
  lesson: LessonPlan,
  status: RecordStatus = "draft"
): TablesInsert<"lesson_plans"> {
  return {
    user_id: userId,
    title: lesson.title,
    curriculum: lesson.curriculum,
    lesson_type: lesson.lessonType,
    grade_level: lesson.gradeLevel,
    subject: lesson.subject,
    quarter: lesson.quarter,
    topic: lesson.subjectMatter.topic,
    status,
    schema_version: lesson.schemaVersion,
    content: toJson(lesson),
  };
}

export function lessonPlanFromRow(row: Tables<"lesson_plans">): LessonPlan {
  return LessonPlanSchema.parse({
    ...(row.content as Record<string, Json>),
    id: row.id,
    curriculum: row.curriculum,
    lessonType: row.lesson_type,
    title: row.title,
    gradeLevel: row.grade_level,
    subject: row.subject,
    quarter: row.quarter,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function presentationToInsert(
  userId: string,
  lessonPlanId: string,
  presentation: Presentation,
  status: RecordStatus = "draft"
): TablesInsert<"presentations"> {
  return {
    user_id: userId,
    lesson_plan_id: lessonPlanId,
    title: presentation.title,
    theme: presentation.theme,
    slide_count: presentation.slides.length,
    status,
    schema_version: presentation.schemaVersion,
    content: toJson(presentation),
  };
}

export function presentationFromRow(row: Tables<"presentations">): Presentation {
  return PresentationSchema.parse({
    ...(row.content as Record<string, Json>),
    lessonId: row.lesson_plan_id,
    title: row.title,
    theme: row.theme,
    schemaVersion: row.schema_version,
  });
}

export function assessmentToInsert(
  userId: string,
  lessonPlanId: string,
  assessment: Assessment,
  status: RecordStatus = "draft"
): TablesInsert<"assessments"> {
  return {
    user_id: userId,
    lesson_plan_id: lessonPlanId,
    title: assessment.title,
    difficulty: assessment.difficulty,
    item_count: assessment.items.length,
    status,
    schema_version: assessment.schemaVersion,
    content: toJson(assessment),
  };
}

export function assessmentFromRow(row: Tables<"assessments">): Assessment {
  return AssessmentSchema.parse({
    ...(row.content as Record<string, Json>),
    lessonId: row.lesson_plan_id,
    title: row.title,
    difficulty: row.difficulty,
    schemaVersion: row.schema_version,
  });
}

export function worksheetToInsert(
  userId: string,
  lessonPlanId: string,
  worksheet: Worksheet,
  status: RecordStatus = "draft"
): TablesInsert<"worksheets"> {
  return {
    user_id: userId,
    lesson_plan_id: lessonPlanId,
    title: worksheet.title,
    difficulty: worksheet.difficulty,
    item_count: worksheet.items.length,
    status,
    schema_version: worksheet.schemaVersion,
    content: toJson(worksheet),
  };
}

export function worksheetFromRow(row: Tables<"worksheets">): Worksheet {
  return WorksheetSchema.parse({
    ...(row.content as Record<string, Json>),
    lessonId: row.lesson_plan_id,
    title: row.title,
    difficulty: row.difficulty,
    schemaVersion: row.schema_version,
  });
}

export function templateToInsert(
  userId: string,
  template: LessonTemplate,
  sourceLessonId?: string,
  status: RecordStatus = "ready"
): TablesInsert<"templates"> {
  return {
    user_id: userId,
    source_lesson_id: sourceLessonId ?? null,
    name: template.name,
    description: template.description,
    curriculum: template.defaults.curriculum,
    grade_level: `Grade ${template.defaults.grade}`,
    subject: template.defaults.subject,
    status,
    schema_version: "1.0",
    content: toJson(template),
  };
}

export function templateFromRow(row: Tables<"templates">): LessonTemplate {
  return LessonTemplateSchema.parse({
    ...(row.content as Record<string, Json>),
    id: row.id,
    name: row.name,
    description: row.description,
    sourceLessonId: row.source_lesson_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function resourceToInsert(
  userId: string,
  resource: TeachingResource,
  storage?: { bucket: string; path: string },
  status: RecordStatus = "ready"
): TablesInsert<"uploaded_resources"> {
  return {
    user_id: userId,
    name: resource.name,
    mime_type: resource.mimeType,
    byte_size: resource.byteSize,
    extraction_status: resource.extractionStatus,
    storage_bucket: storage?.bucket ?? null,
    storage_path: storage?.path ?? null,
    status,
    schema_version: "1.0",
    content: toJson(resource),
  };
}

export function resourceFromRow(row: Tables<"uploaded_resources">): TeachingResource {
  return TeachingResourceSchema.parse({
    ...(row.content as Record<string, Json>),
    id: row.id,
    name: row.name,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    extractionStatus: row.extraction_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
