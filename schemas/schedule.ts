import { z } from "zod";

export const ScheduleEntryKindSchema = z.enum([
  "lesson",
  "assessment",
  "teaching_pack",
  "other",
]);
export const ScheduleEntryStatusSchema = z.enum(["planned", "completed", "cancelled"]);

const OptionalUuidSchema = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.uuid().nullable()
);

const ScheduleEntryFields = z.object({
  title: z.string().trim().min(2, "Enter at least 2 characters.").max(160),
  kind: ScheduleEntryKindSchema,
  status: ScheduleEntryStatusSchema.default("planned"),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  subject: z.preprocess(
    (value) => (value === undefined || (typeof value === "string" && value.trim() === "") ? null : value),
    z.string().trim().max(120).nullable()
  ),
  notes: z.string().trim().max(500).default(""),
  lessonPlanId: OptionalUuidSchema,
  assessmentId: OptionalUuidSchema,
  teachingPackLessonId: OptionalUuidSchema,
});

function validateScheduleEntry(
  value: z.infer<typeof ScheduleEntryFields>,
  context: z.RefinementCtx
) {
  const start = Date.parse(value.startsAt);
  const end = Date.parse(value.endsAt);
  if (end <= start) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time." });
  } else if (end - start > 24 * 60 * 60 * 1_000) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "Schedule entries must fit within 24 hours." });
  }

  const invalidLink =
    (value.kind === "lesson" && (value.assessmentId || value.teachingPackLessonId)) ||
    (value.kind === "assessment" && (value.lessonPlanId || value.teachingPackLessonId)) ||
    (value.kind === "teaching_pack" && (value.lessonPlanId || value.assessmentId)) ||
    (value.kind === "other" && (value.lessonPlanId || value.assessmentId || value.teachingPackLessonId));
  if (invalidLink) {
    context.addIssue({ code: "custom", path: ["kind"], message: "The linked artifact does not match this schedule type." });
  }
}

export const ScheduleEntryInputSchema = ScheduleEntryFields.superRefine(validateScheduleEntry);

export const ScheduleEntrySchema = ScheduleEntryFields.extend({
  id: z.uuid(),
  revision: z.number().int().positive(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
}).superRefine(validateScheduleEntry);

export const ScheduleEntryListSchema = z.array(ScheduleEntrySchema).max(500);

export type ScheduleEntryKind = z.infer<typeof ScheduleEntryKindSchema>;
export type ScheduleEntryStatus = z.infer<typeof ScheduleEntryStatusSchema>;
export type ScheduleEntryInput = z.infer<typeof ScheduleEntryInputSchema>;
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;
