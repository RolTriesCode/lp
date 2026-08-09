import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import {
  ScheduleEntryInputSchema,
  ScheduleEntryKindSchema,
  ScheduleEntrySchema,
  ScheduleEntryStatusSchema,
  type ScheduleEntry,
  type ScheduleEntryInput,
} from "@/schemas/schedule";

export const ScheduleListQuerySchema = z.object({
  start: z.iso.datetime({ offset: true }),
  end: z.iso.datetime({ offset: true }),
  kind: ScheduleEntryKindSchema.optional(),
  status: ScheduleEntryStatusSchema.optional(),
}).superRefine((value, context) => {
  const start = Date.parse(value.start);
  const end = Date.parse(value.end);
  if (end <= start) {
    context.addIssue({ code: "custom", path: ["end"], message: "The schedule range must end after it starts." });
  } else if (end - start > 370 * 24 * 60 * 60 * 1_000) {
    context.addIssue({ code: "custom", path: ["end"], message: "Schedule queries are limited to one year." });
  }
});

export type ScheduleListQuery = z.infer<typeof ScheduleListQuerySchema>;

export class ScheduleRepositoryError extends Error {
  readonly code: string;

  constructor(message: string, error?: PostgrestError | null) {
    super(message);
    this.name = "ScheduleRepositoryError";
    this.code = error?.code || "SCHEDULE_DATABASE_ERROR";
  }
}

export class ScheduleConflictError extends Error {
  readonly code = "SCHEDULE_CONFLICT";

  constructor(readonly remote: ScheduleEntry) {
    super("This schedule entry changed in another tab. Review the latest version before saving again.");
    this.name = "ScheduleConflictError";
  }
}

function assertDatabase(error: PostgrestError | null, message: string): void {
  if (error) throw new ScheduleRepositoryError(message, error);
}

function fromRow(row: Tables<"schedule_entries">): ScheduleEntry {
  return ScheduleEntrySchema.parse({
    id: row.id,
    title: row.title,
    kind: row.kind,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    subject: row.subject,
    notes: row.notes,
    lessonPlanId: row.lesson_plan_id,
    assessmentId: row.assessment_id,
    teachingPackLessonId: row.teaching_pack_lesson_id,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toRow(userId: string, input: ScheduleEntryInput): TablesInsert<"schedule_entries"> {
  const value = ScheduleEntryInputSchema.parse(input);
  return {
    user_id: userId,
    title: value.title,
    kind: value.kind,
    status: value.status,
    starts_at: value.startsAt,
    ends_at: value.endsAt,
    subject: value.subject,
    notes: value.notes,
    lesson_plan_id: value.lessonPlanId,
    assessment_id: value.assessmentId,
    teaching_pack_lesson_id: value.teachingPackLessonId,
  };
}

export class SupabaseScheduleRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly userId: string
  ) {}

  async list(rawQuery: ScheduleListQuery): Promise<ScheduleEntry[]> {
    const query = ScheduleListQuerySchema.parse(rawQuery);
    let request = this.client
      .from("schedule_entries")
      .select("*")
      .eq("user_id", this.userId)
      .lt("starts_at", query.end)
      .gt("ends_at", query.start)
      .order("starts_at", { ascending: true })
      .limit(500);
    if (query.kind) request = request.eq("kind", query.kind);
    if (query.status) request = request.eq("status", query.status);
    const { data, error } = await request;
    assertDatabase(error, "The schedule could not be loaded.");
    return (data ?? []).map(fromRow);
  }

  async get(id: string): Promise<ScheduleEntry | null> {
    const safeId = z.uuid().parse(id);
    const { data, error } = await this.client
      .from("schedule_entries")
      .select("*")
      .eq("id", safeId)
      .eq("user_id", this.userId)
      .maybeSingle();
    assertDatabase(error, "The schedule entry could not be loaded.");
    return data ? fromRow(data) : null;
  }

  async create(input: ScheduleEntryInput): Promise<ScheduleEntry> {
    const { data, error } = await this.client
      .from("schedule_entries")
      .insert(toRow(this.userId, input))
      .select("*")
      .single();
    assertDatabase(error, "The schedule entry could not be created.");
    if (!data) throw new ScheduleRepositoryError("The created schedule entry was not returned.");
    return fromRow(data);
  }

  async update(id: string, input: ScheduleEntryInput, expectedRevision: number): Promise<ScheduleEntry | null> {
    const safeId = z.uuid().parse(id);
    const revision = z.number().int().positive().parse(expectedRevision);
    const payload: TablesUpdate<"schedule_entries"> = toRow(this.userId, input);
    const { data, error } = await this.client
      .from("schedule_entries")
      .update(payload)
      .eq("id", safeId)
      .eq("user_id", this.userId)
      .eq("revision", revision)
      .select("*")
      .maybeSingle();
    assertDatabase(error, "The schedule entry could not be saved.");
    if (data) return fromRow(data);
    const remote = await this.get(safeId);
    if (remote) throw new ScheduleConflictError(remote);
    return null;
  }

  async delete(id: string): Promise<void> {
    const safeId = z.uuid().parse(id);
    const { error } = await this.client
      .from("schedule_entries")
      .delete()
      .eq("id", safeId)
      .eq("user_id", this.userId);
    assertDatabase(error, "The schedule entry could not be deleted.");
  }
}

