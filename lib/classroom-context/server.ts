import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";
import {
  ClassroomContextApplicationSchema,
  ClassroomContextSchema,
  classroomContextDefaults,
  type ClassroomContext,
  type ClassroomContextApplication,
} from "@/schemas/classroom-context";

export class ClassroomContextRepositoryError extends Error {
  readonly code: string;

  constructor(message: string, error?: PostgrestError | null) {
    super(message);
    this.name = "ClassroomContextRepositoryError";
    this.code = error?.code || "CLASSROOM_CONTEXT_DATABASE_ERROR";
  }
}

export class ClassroomContextConflictError extends Error {
  readonly code = "CLASSROOM_CONTEXT_CONFLICT";

  constructor(readonly remote: ClassroomContext) {
    super("These classroom defaults changed in another tab. Review the latest version before saving again.");
    this.name = "ClassroomContextConflictError";
  }
}

function assertDatabase(error: PostgrestError | null, message: string): void {
  if (error) throw new ClassroomContextRepositoryError(message, error);
}

function fromRow(row: Tables<"classroom_contexts">): ClassroomContext {
  return ClassroomContextSchema.parse({
    classSize: row.class_size,
    language: row.language,
    availableResources: row.available_resources,
    learnerNeeds: row.learner_needs,
    preferredDuration: row.preferred_duration,
    teacherNotes: row.teacher_notes,
    schemaVersion: row.schema_version,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function toRow(userId: string, input: ClassroomContextApplication): TablesInsert<"classroom_contexts"> {
  const value = ClassroomContextApplicationSchema.parse(input);
  return {
    user_id: userId,
    class_size: value.classSize,
    language: value.language,
    available_resources: value.availableResources,
    learner_needs: value.learnerNeeds,
    preferred_duration: value.preferredDuration,
    teacher_notes: value.teacherNotes,
  };
}

export class SupabaseClassroomContextRepository {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly userId: string
  ) {}

  async get(): Promise<ClassroomContext | null> {
    const { data, error } = await this.client
      .from("classroom_contexts")
      .select("*")
      .eq("user_id", this.userId)
      .maybeSingle();
    assertDatabase(error, "Classroom defaults could not be loaded.");
    return data ? fromRow(data) : null;
  }

  async save(input: ClassroomContextApplication, expectedRevision: number | null): Promise<ClassroomContext> {
    const canonical = ClassroomContextApplicationSchema.parse(input);
    if (expectedRevision === null) {
      const { data, error } = await this.client
        .from("classroom_contexts")
        .insert(toRow(this.userId, canonical))
        .select("*")
        .maybeSingle();
      if (error?.code === "23505") {
        const remote = await this.get();
        if (remote) throw new ClassroomContextConflictError(remote);
      }
      assertDatabase(error, "Classroom defaults could not be saved.");
      if (!data) throw new ClassroomContextRepositoryError("The saved classroom defaults were not returned.");
      return fromRow(data);
    }

    const revision = z.number().int().positive().parse(expectedRevision);
    const payload: TablesUpdate<"classroom_contexts"> = toRow(this.userId, canonical);
    const { data, error } = await this.client
      .from("classroom_contexts")
      .update(payload)
      .eq("user_id", this.userId)
      .eq("revision", revision)
      .select("*")
      .maybeSingle();
    assertDatabase(error, "Classroom defaults could not be saved.");
    if (data) return fromRow(data);
    const remote = await this.get();
    if (remote) throw new ClassroomContextConflictError(remote);
    throw new ClassroomContextRepositoryError("Classroom defaults no longer exist. Reload and try again.");
  }

  defaults(): ClassroomContextApplication {
    return ClassroomContextApplicationSchema.parse(classroomContextDefaults);
  }
}

