import { z } from "zod";
import {
  curriculumValues,
  durationValues,
  languageValues,
  lessonTypeValues,
} from "@/lib/lesson-plan-schema";

const OptionalProfileText = (maximum: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().min(1).max(maximum).nullable()
  );

export const TeacherProfileInputSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters.").max(120),
  schoolName: OptionalProfileText(180),
  roleTitle: z.string().trim().min(2).max(80).default("Teacher"),
  preferredGradeLevel: OptionalProfileText(40),
  preferredSubjects: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
});

export const TeacherProfileSchema = TeacherProfileInputSchema.extend({
  id: z.uuid(),
  schoolLogoPath: z.string().max(500).nullable().default(null),
  status: z.enum(["active", "suspended"]),
  schemaVersion: z.string().regex(/^\d+\.\d+$/),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type TeacherProfile = z.infer<typeof TeacherProfileSchema>;
export type TeacherProfileInput = z.infer<typeof TeacherProfileInputSchema>;

export type HeaderTeacherProfile = Pick<
  TeacherProfile,
  "displayName" | "schoolName" | "roleTitle" | "schoolLogoPath" | "updatedAt"
>;

export const TeacherPreferencesSchema = z.object({
  defaultCurriculum: z.enum(curriculumValues).default("MATATAG"),
  defaultLessonType: z.enum(lessonTypeValues).default("detailed"),
  defaultDuration: z.enum(durationValues).default("60 mins"),
  defaultLanguage: z.enum(languageValues).default("english"),
});

export type TeacherPreferences = z.infer<typeof TeacherPreferencesSchema>;
