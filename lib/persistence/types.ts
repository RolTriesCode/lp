import type { LessonPlan } from "@/schemas/lesson";

export interface IEntityRepository<T extends { id: string }> {
  get(id: string): Promise<T | null>;
  list(): Promise<T[]>;
  save(record: T): Promise<void>;
  delete(id: string): Promise<void>;
}

export type PersistenceStatus = "draft" | "ready" | "archived" | "error";

export type RepositoryListQuery = {
  status?: PersistenceStatus;
  lessonPlanId?: string;
  limit?: number;
  offset?: number;
};

export type PersistedEntity<TEntity> = {
  id: string;
  value: TEntity;
  revision: number;
  status: PersistenceStatus;
  createdAt: string;
  updatedAt: string;
};

export type RevisionedCreate<TEntity> = {
  value: TEntity;
  status?: PersistenceStatus;
};

export type RevisionedUpdate<TEntity> = {
  value: TEntity;
  expectedRevision: number;
  status?: PersistenceStatus;
};

export type LessonSaveOptions = {
  expectedRevision?: number;
};

export type LessonAutosaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "offline"
  | "conflict"
  | "failed";

export class PersistenceConflictError<TEntity = unknown> extends Error {
  readonly code = "PERSISTENCE_CONFLICT";

  constructor(
    message: string,
    readonly remote: PersistedEntity<TEntity>
  ) {
    super(message);
    this.name = "PersistenceConflictError";
  }
}

export class PersistenceRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number
  ) {
    super(message);
    this.name = "PersistenceRequestError";
  }
}

/**
 * Persistence contract for the authenticated phase. Implementations may use
 * Supabase, another database, or a test double; callers never receive a client.
 * Ownership is resolved by the implementation's request identity and policies.
 */
export interface IPersistentEntityRepository<TEntity, TCreate, TUpdate> {
  get(id: string): Promise<TEntity | null>;
  list(query?: RepositoryListQuery): Promise<TEntity[]>;
  create(input: TCreate): Promise<TEntity>;
  update(id: string, input: TUpdate): Promise<TEntity | null>;
  duplicate(id: string): Promise<TEntity | null>;
  delete(id: string): Promise<void>;
}

/**
 * Storage Adapter Interface for Lesson Plan persistence.
 * Stable lesson persistence boundary. Implementations may be remote, local for
 * isolated tests, or another backend without changing editor consumers.
 */
export interface ILessonStorageAdapter {
  getLesson(id: string): Promise<LessonPlan | null>;
  createLesson(lesson: LessonPlan): Promise<LessonPlan>;
  saveLesson(lesson: LessonPlan, options?: LessonSaveOptions): Promise<LessonPlan>;
  duplicateLesson(id: string): Promise<LessonPlan | null>;
  deleteLesson(id: string): Promise<void>;
  listLessons(): Promise<LessonPlan[]>;
}
