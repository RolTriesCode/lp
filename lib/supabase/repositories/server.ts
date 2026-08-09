import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type {
  PersistedEntity,
  PersistenceStatus,
  RepositoryListQuery,
} from "@/lib/persistence/types";
import { AssessmentSchema, type Assessment } from "@/schemas/assessment";
import { LessonPlanSchema, type LessonPlan } from "@/schemas/lesson";
import { PresentationSchema, type Presentation } from "@/schemas/presentation";
import { TeachingResourceSchema, type TeachingResource } from "@/schemas/resource";
import { LessonTemplateSchema, type LessonTemplate } from "@/schemas/template";
import { WorksheetSchema, type Worksheet } from "@/schemas/worksheet";
import type { UploadedReference } from "@/schemas/reference";
import type { Database, Tables, TablesInsert } from "@/lib/supabase/database.types";
import {
  assessmentFromRow,
  assessmentToInsert,
  lessonPlanFromRow,
  lessonPlanToInsert,
  presentationFromRow,
  presentationToInsert,
  resourceFromRow,
  resourceToInsert,
  templateFromRow,
  templateToInsert,
  worksheetFromRow,
  worksheetToInsert,
} from "@/lib/supabase/mappers";

export const PersistentEntityNameSchema = z.enum([
  "lesson-plans",
  "presentations",
  "assessments",
  "worksheets",
  "templates",
  "uploaded-resources",
]);

export type PersistentEntityName = z.infer<typeof PersistentEntityNameSchema>;
const databaseIdSchema = z.string().uuid();

type RevisionRow = {
  id: string;
  revision: number;
  status: PersistenceStatus;
  created_at: string;
  updated_at: string;
};

type QueryResult<TData> = {
  data: TData;
  error: PostgrestError | null;
};

type RepositoryDriver<TEntity, TRow extends RevisionRow> = {
  schema: z.ZodType<TEntity>;
  defaultStatus: PersistenceStatus;
  decode: (row: TRow) => TEntity;
  get: (id: string) => Promise<QueryResult<TRow | null>>;
  list: (query: RepositoryListQuery) => Promise<QueryResult<TRow[] | null>>;
  insert: (
    value: TEntity,
    status: PersistenceStatus
  ) => Promise<QueryResult<TRow | null>>;
  update: (
    id: string,
    value: TEntity,
    expectedRevision: number,
    status?: PersistenceStatus
  ) => Promise<QueryResult<TRow | null>>;
  delete: (id: string) => Promise<QueryResult<null>>;
  duplicate?: (
    current: PersistedEntity<TEntity>
  ) => Promise<QueryResult<TRow | null>>;
  clone: (value: TEntity) => TEntity;
};

export class SupabaseRepositoryError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: PostgrestError
  ) {
    super(message);
    this.name = "SupabaseRepositoryError";
  }
}

export class SupabaseRepositoryConflictError extends Error {
  readonly code = "PERSISTENCE_CONFLICT";

  constructor(readonly remote: PersistedEntity<unknown>) {
    super("A newer version of this record is already saved.");
    this.name = "SupabaseRepositoryConflictError";
  }
}

export interface IServerEntityRepository {
  get(id: string): Promise<PersistedEntity<unknown> | null>;
  list(query?: RepositoryListQuery): Promise<PersistedEntity<unknown>[]>;
  create(value: unknown, status?: PersistenceStatus): Promise<PersistedEntity<unknown>>;
  update(
    id: string,
    value: unknown,
    expectedRevision: number,
    status?: PersistenceStatus
  ): Promise<PersistedEntity<unknown> | null>;
  duplicate(id: string): Promise<PersistedEntity<unknown> | null>;
  delete(id: string): Promise<void>;
}

function throwDatabaseError(error: PostgrestError | null, action: string): void {
  if (!error) return;
  throw new SupabaseRepositoryError(
    `The ${action} operation could not be completed.`,
    error.code || "DATABASE_ERROR",
    error
  );
}

function toPersisted<TEntity, TRow extends RevisionRow>(
  row: TRow,
  decode: (row: TRow) => TEntity
): PersistedEntity<TEntity> {
  return {
    id: row.id,
    value: decode(row),
    revision: row.revision,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class ValidatedSupabaseRepository<TEntity, TRow extends RevisionRow>
  implements IServerEntityRepository
{
  constructor(private readonly driver: RepositoryDriver<TEntity, TRow>) {}

  async get(id: string): Promise<PersistedEntity<TEntity> | null> {
    const result = await this.driver.get(id);
    throwDatabaseError(result.error, "read");
    return result.data ? toPersisted(result.data, this.driver.decode) : null;
  }

  async list(query: RepositoryListQuery = {}): Promise<PersistedEntity<TEntity>[]> {
    const safeQuery: RepositoryListQuery = {
      ...query,
      limit: Math.min(Math.max(query.limit ?? 100, 1), 100),
      offset: Math.max(query.offset ?? 0, 0),
    };
    const result = await this.driver.list(safeQuery);
    throwDatabaseError(result.error, "list");
    return (result.data ?? []).map((row) => toPersisted(row, this.driver.decode));
  }

  async create(
    value: unknown,
    status: PersistenceStatus = this.driver.defaultStatus
  ): Promise<PersistedEntity<TEntity>> {
    const canonical = this.driver.schema.parse(value);
    const result = await this.driver.insert(canonical, status);
    throwDatabaseError(result.error, "create");
    if (!result.data) {
      throw new SupabaseRepositoryError(
        "The created record was not returned by the database.",
        "MISSING_CREATED_RECORD"
      );
    }
    return toPersisted(result.data, this.driver.decode);
  }

  async update(
    id: string,
    value: unknown,
    expectedRevision: number,
    status?: PersistenceStatus
  ): Promise<PersistedEntity<TEntity> | null> {
    const canonical = this.driver.schema.parse(value);
    const result = await this.driver.update(
      id,
      canonical,
      expectedRevision,
      status
    );
    throwDatabaseError(result.error, "update");
    if (result.data) return toPersisted(result.data, this.driver.decode);

    const remote = await this.get(id);
    if (remote) throw new SupabaseRepositoryConflictError(remote);
    return null;
  }

  async duplicate(id: string): Promise<PersistedEntity<TEntity> | null> {
    const current = await this.get(id);
    if (!current) return null;
    if (this.driver.duplicate) {
      const result = await this.driver.duplicate(current);
      throwDatabaseError(result.error, "duplicate");
      if (!result.data) {
        throw new SupabaseRepositoryError(
          "The duplicated record was not returned by the database.",
          "MISSING_DUPLICATED_RECORD"
        );
      }
      return toPersisted(result.data, this.driver.decode);
    }
    return this.create(this.driver.clone(current.value), current.status);
  }

  async delete(id: string): Promise<void> {
    const result = await this.driver.delete(id);
    throwDatabaseError(result.error, "delete");
  }
}

function withoutStatus<T extends { status?: unknown }>(
  value: T,
  status?: PersistenceStatus
): Omit<T, "status"> & { status?: PersistenceStatus } {
  const { status: _ignored, ...rest } = value;
  void _ignored;
  return status ? { ...rest, status } : rest;
}

function lessonDriver(
  client: SupabaseClient<Database>,
  userId: string
): RepositoryDriver<LessonPlan, Tables<"lesson_plans">> {
  return {
    schema: LessonPlanSchema,
    defaultStatus: "draft",
    decode: lessonPlanFromRow,
    async get(id) {
      return await client
        .from("lesson_plans")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle();
    },
    async list(query) {
      let request = client
        .from("lesson_plans")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100) - 1);
      if (query.status) request = request.eq("status", query.status);
      return await request;
    },
    async insert(value, status) {
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const canonical = LessonPlanSchema.parse({
        ...value,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const payload: TablesInsert<"lesson_plans"> = {
        ...lessonPlanToInsert(userId, canonical, status),
        id,
      };
      return await client.from("lesson_plans").insert(payload).select("*").single();
    },
    async update(id, value, expectedRevision, status) {
      const canonical = LessonPlanSchema.parse({ ...value, id });
      const payload = withoutStatus(lessonPlanToInsert(userId, canonical), status);
      return await client
        .from("lesson_plans")
        .update(payload)
        .eq("id", id)
        .eq("user_id", userId)
        .eq("revision", expectedRevision)
        .select("*")
        .maybeSingle();
    },
    async delete(id) {
      const { error } = await client
        .from("lesson_plans")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);
      return { data: null, error };
    },
    clone(value) {
      return LessonPlanSchema.parse({
        ...value,
        id: undefined,
        title: `${value.title} (Copy)`.slice(0, 200),
        createdAt: undefined,
        updatedAt: undefined,
      });
    },
  };
}

function presentationDriver(
  client: SupabaseClient<Database>,
  userId: string
): RepositoryDriver<Presentation, Tables<"presentations">> {
  return {
    schema: PresentationSchema,
    defaultStatus: "draft",
    decode: presentationFromRow,
    async get(id) {
      return await client.from("presentations").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    },
    async list(query) {
      let request = client.from("presentations").select("*").eq("user_id", userId);
      if (query.lessonPlanId) request = request.eq("lesson_plan_id", query.lessonPlanId);
      if (query.status) request = request.eq("status", query.status);
      return await request.order("updated_at", { ascending: false }).range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100) - 1);
    },
    async insert(value, status) {
      const lessonPlanId = databaseIdSchema.parse(value.lessonId);
      return await client.from("presentations").insert(presentationToInsert(userId, lessonPlanId, value, status)).select("*").single();
    },
    async update(id, value, expectedRevision, status) {
      const lessonPlanId = databaseIdSchema.parse(value.lessonId);
      const payload = withoutStatus(presentationToInsert(userId, lessonPlanId, value), status);
      return await client.from("presentations").update(payload).eq("id", id).eq("user_id", userId).eq("revision", expectedRevision).select("*").maybeSingle();
    },
    async delete(id) {
      const { error } = await client.from("presentations").delete().eq("id", id).eq("user_id", userId);
      return { data: null, error };
    },
    clone(value) {
      return PresentationSchema.parse({ ...value, title: `${value.title} (Copy)`.slice(0, 200) });
    },
  };
}

function assessmentDriver(
  client: SupabaseClient<Database>,
  userId: string
): RepositoryDriver<Assessment, Tables<"assessments">> {
  return {
    schema: AssessmentSchema,
    defaultStatus: "draft",
    decode: assessmentFromRow,
    async get(id) {
      return await client.from("assessments").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    },
    async list(query) {
      let request = client.from("assessments").select("*").eq("user_id", userId);
      if (query.lessonPlanId) request = request.eq("lesson_plan_id", query.lessonPlanId);
      if (query.status) request = request.eq("status", query.status);
      return await request.order("updated_at", { ascending: false }).range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100) - 1);
    },
    async insert(value, status) {
      const lessonPlanId = databaseIdSchema.parse(value.lessonId);
      return await client.from("assessments").insert(assessmentToInsert(userId, lessonPlanId, value, status)).select("*").single();
    },
    async update(id, value, expectedRevision, status) {
      const lessonPlanId = databaseIdSchema.parse(value.lessonId);
      const payload = withoutStatus(assessmentToInsert(userId, lessonPlanId, value), status);
      return await client.from("assessments").update(payload).eq("id", id).eq("user_id", userId).eq("revision", expectedRevision).select("*").maybeSingle();
    },
    async delete(id) {
      const { error } = await client.from("assessments").delete().eq("id", id).eq("user_id", userId);
      return { data: null, error };
    },
    clone(value) {
      return AssessmentSchema.parse({ ...value, title: `${value.title} (Copy)`.slice(0, 200) });
    },
  };
}

function worksheetDriver(
  client: SupabaseClient<Database>,
  userId: string
): RepositoryDriver<Worksheet, Tables<"worksheets">> {
  return {
    schema: WorksheetSchema,
    defaultStatus: "draft",
    decode: worksheetFromRow,
    async get(id) {
      return await client.from("worksheets").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    },
    async list(query) {
      let request = client.from("worksheets").select("*").eq("user_id", userId);
      if (query.lessonPlanId) request = request.eq("lesson_plan_id", query.lessonPlanId);
      if (query.status) request = request.eq("status", query.status);
      return await request.order("updated_at", { ascending: false }).range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100) - 1);
    },
    async insert(value, status) {
      const lessonPlanId = databaseIdSchema.parse(value.lessonId);
      return await client.from("worksheets").insert(worksheetToInsert(userId, lessonPlanId, value, status)).select("*").single();
    },
    async update(id, value, expectedRevision, status) {
      const lessonPlanId = databaseIdSchema.parse(value.lessonId);
      const payload = withoutStatus(worksheetToInsert(userId, lessonPlanId, value), status);
      return await client.from("worksheets").update(payload).eq("id", id).eq("user_id", userId).eq("revision", expectedRevision).select("*").maybeSingle();
    },
    async delete(id) {
      const { error } = await client.from("worksheets").delete().eq("id", id).eq("user_id", userId);
      return { data: null, error };
    },
    clone(value) {
      return WorksheetSchema.parse({ ...value, title: `${value.title} (Copy)`.slice(0, 200) });
    },
  };
}

function templateDriver(
  client: SupabaseClient<Database>,
  userId: string
): RepositoryDriver<LessonTemplate, Tables<"templates">> {
  return {
    schema: LessonTemplateSchema,
    defaultStatus: "ready",
    decode: templateFromRow,
    async get(id) {
      return await client.from("templates").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    },
    async list(query) {
      let request = client.from("templates").select("*").eq("user_id", userId);
      if (query.status) request = request.eq("status", query.status);
      return await request.order("updated_at", { ascending: false }).range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100) - 1);
    },
    async insert(value, status) {
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const canonical = LessonTemplateSchema.parse({ ...value, id, createdAt: timestamp, updatedAt: timestamp });
      const sourceLessonId = canonical.sourceLessonId
        ? databaseIdSchema.parse(canonical.sourceLessonId)
        : undefined;
      const payload: TablesInsert<"templates"> = { ...templateToInsert(userId, canonical, sourceLessonId, status), id };
      return await client.from("templates").insert(payload).select("*").single();
    },
    async update(id, value, expectedRevision, status) {
      const canonical = LessonTemplateSchema.parse({ ...value, id });
      const sourceLessonId = canonical.sourceLessonId
        ? databaseIdSchema.parse(canonical.sourceLessonId)
        : undefined;
      const payload = withoutStatus(templateToInsert(userId, canonical, sourceLessonId), status);
      return await client.from("templates").update(payload).eq("id", id).eq("user_id", userId).eq("revision", expectedRevision).select("*").maybeSingle();
    },
    async delete(id) {
      const { error } = await client.from("templates").delete().eq("id", id).eq("user_id", userId);
      return { data: null, error };
    },
    clone(value) {
      const timestamp = new Date().toISOString();
      return LessonTemplateSchema.parse({
        ...value,
        id: `template-${crypto.randomUUID()}`,
        name: `${value.name} (Copy)`.slice(0, 80),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    },
  };
}

function resourceDriver(
  client: SupabaseClient<Database>,
  userId: string
): RepositoryDriver<TeachingResource, Tables<"uploaded_resources">> {
  return {
    schema: TeachingResourceSchema,
    defaultStatus: "ready",
    decode: resourceFromRow,
    async get(id) {
      return await client.from("uploaded_resources").select("*").eq("id", id).eq("user_id", userId).maybeSingle();
    },
    async list(query) {
      let request = client.from("uploaded_resources").select("*").eq("user_id", userId);
      if (query.status) request = request.eq("status", query.status);
      return await request.order("updated_at", { ascending: false }).range(query.offset ?? 0, (query.offset ?? 0) + (query.limit ?? 100) - 1);
    },
    async insert(value, status) {
      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const canonical = TeachingResourceSchema.parse({ ...value, id, createdAt: timestamp, updatedAt: timestamp });
      const payload: TablesInsert<"uploaded_resources"> = { ...resourceToInsert(userId, canonical, undefined, status), id };
      return await client.from("uploaded_resources").insert(payload).select("*").single();
    },
    async update(id, value, expectedRevision, status) {
      const canonical = TeachingResourceSchema.parse({ ...value, id });
      const mapped = resourceToInsert(userId, canonical);
      const payload = {
        user_id: mapped.user_id,
        name: mapped.name,
        mime_type: mapped.mime_type,
        byte_size: mapped.byte_size,
        extraction_status: mapped.extraction_status,
        schema_version: mapped.schema_version,
        content: mapped.content,
        ...(status ? { status } : {}),
      };
      return await client.from("uploaded_resources").update(payload).eq("id", id).eq("user_id", userId).eq("revision", expectedRevision).select("*").maybeSingle();
    },
    async delete(id) {
      const { data: current, error: readError } = await client.from("uploaded_resources").select("storage_bucket, storage_path").eq("id", id).eq("user_id", userId).maybeSingle();
      if (readError) return { data: null, error: readError };
      if (current?.storage_bucket && current.storage_path) {
        const { error: storageError } = await client.storage.from(current.storage_bucket).remove([current.storage_path]);
        if (storageError) {
          throw new SupabaseRepositoryError(
            "The private source file could not be deleted, so its resource record was preserved.",
            "STORAGE_DELETE_FAILED"
          );
        }
      }
      const { error } = await client.from("uploaded_resources").delete().eq("id", id).eq("user_id", userId);
      return { data: null, error };
    },
    async duplicate(current) {
      const { data: row, error: readError } = await client.from("uploaded_resources").select("*").eq("id", current.id).eq("user_id", userId).maybeSingle();
      if (readError || !row) return { data: null, error: readError };

      const id = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      const duplicate = TeachingResourceSchema.parse({
        ...current.value,
        id,
        name: `${current.value.name.replace(/(\.[^.]+)?$/, "")} Copy${current.value.name.match(/\.[^.]+$/)?.[0] ?? ""}`.slice(0, 255),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      let copiedPath: string | undefined;
      if (row.storage_bucket && row.storage_path) {
        const basename = row.storage_path.split("/").pop() ?? "reference";
        copiedPath = `${userId}/${id}/${basename}`;
        const { error: copyError } = await client.storage.from(row.storage_bucket).copy(row.storage_path, copiedPath);
        if (copyError) {
          throw new SupabaseRepositoryError("The private source file could not be duplicated.", "STORAGE_COPY_FAILED");
        }
      }
      const payload: TablesInsert<"uploaded_resources"> = {
        ...resourceToInsert(
          userId,
          duplicate,
          copiedPath && row.storage_bucket ? { bucket: row.storage_bucket, path: copiedPath } : undefined,
          current.status
        ),
        id,
      };
      const result = await client.from("uploaded_resources").insert(payload).select("*").single();
      if (result.error && copiedPath && row.storage_bucket) {
        await client.storage.from(row.storage_bucket).remove([copiedPath]);
      }
      return result;
    },
    clone(value) {
      return value;
    },
  };
}

export function createServerEntityRepository(
  entity: PersistentEntityName,
  client: SupabaseClient<Database>,
  userId: string
): IServerEntityRepository {
  switch (entity) {
    case "lesson-plans":
      return new ValidatedSupabaseRepository(lessonDriver(client, userId));
    case "presentations":
      return new ValidatedSupabaseRepository(presentationDriver(client, userId));
    case "assessments":
      return new ValidatedSupabaseRepository(assessmentDriver(client, userId));
    case "worksheets":
      return new ValidatedSupabaseRepository(worksheetDriver(client, userId));
    case "templates":
      return new ValidatedSupabaseRepository(templateDriver(client, userId));
    case "uploaded-resources":
      return new ValidatedSupabaseRepository(resourceDriver(client, userId));
  }
}

export async function createUploadedResourceWithFile(
  client: SupabaseClient<Database>,
  userId: string,
  reference: UploadedReference,
  bytes: Buffer
): Promise<PersistedEntity<TeachingResource>> {
  const id = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const resource = TeachingResourceSchema.parse({
    ...reference,
    id,
    kind: "reference_document",
    tags: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const safeName = reference.name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "reference";
  const bucket = "teacher-references";
  const path = `${userId}/${id}/${safeName}`;
  const { error: uploadError } = await client.storage.from(bucket).upload(path, bytes, {
    cacheControl: "3600",
    contentType: reference.mimeType,
    upsert: false,
  });
  if (uploadError) {
    throw new SupabaseRepositoryError(
      "The reference was validated but could not be stored privately.",
      "STORAGE_UPLOAD_FAILED"
    );
  }

  const payload: TablesInsert<"uploaded_resources"> = {
    ...resourceToInsert(userId, resource, { bucket, path }, "ready"),
    id,
  };
  const { data, error } = await client.from("uploaded_resources").insert(payload).select("*").single();
  if (error || !data) {
    await client.storage.from(bucket).remove([path]);
    throwDatabaseError(error, "resource metadata create");
    throw new SupabaseRepositoryError("The uploaded resource metadata was not returned.", "MISSING_CREATED_RECORD");
  }
  return toPersisted(data, resourceFromRow);
}

export async function importPrototypeLessons(
  client: SupabaseClient<Database>,
  userId: string,
  lessons: unknown[]
): Promise<{ imported: Array<{ id: string; sourceId: string }>; skipped: string[]; rejected: number }> {
  const imported: Array<{ id: string; sourceId: string }> = [];
  const skipped: string[] = [];
  let rejected = 0;

  for (const candidate of lessons.slice(0, 100)) {
    const parsed = LessonPlanSchema.safeParse(candidate);
    const sourceId = parsed.success ? parsed.data.id : undefined;
    if (!parsed.success || !sourceId || sourceId.length > 100) {
      rejected += 1;
      continue;
    }
    const { data: existing, error: existingError } = await client
      .from("lesson_plans")
      .select("id")
      .eq("user_id", userId)
      .eq("prototype_source_id", sourceId)
      .maybeSingle();
    throwDatabaseError(existingError, "prototype import check");
    if (existing) {
      skipped.push(sourceId);
      continue;
    }

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const canonical = LessonPlanSchema.parse({
      ...parsed.data,
      id,
      createdAt: parsed.data.createdAt ?? timestamp,
      updatedAt: parsed.data.updatedAt ?? timestamp,
    });
    const payload: TablesInsert<"lesson_plans"> = {
      ...lessonPlanToInsert(userId, canonical, "draft"),
      id,
      prototype_source_id: sourceId,
    };
    const { data, error } = await client.from("lesson_plans").insert(payload).select("*").single();
    if (error?.code === "23505") {
      skipped.push(sourceId);
      continue;
    }
    throwDatabaseError(error, "prototype import");
    if (data) {
      const persisted = toPersisted(data, lessonPlanFromRow);
      imported.push({ id: persisted.id, sourceId });
    }
  }

  return { imported, skipped, rejected };
}
