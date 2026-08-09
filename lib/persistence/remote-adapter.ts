import { LessonPlanSchema, normalizeLessonPlan, type LessonPlan } from "@/schemas/lesson";
import type {
  ILessonStorageAdapter,
  LessonSaveOptions,
  PersistedEntity,
} from "@/lib/persistence/types";
import { PersistenceConflictError } from "@/lib/persistence/types";
import { RemoteEntityRepository } from "@/lib/persistence/remote-repository";

export class SupabaseLessonStorageAdapter implements ILessonStorageAdapter {
  private readonly repository = new RemoteEntityRepository("lesson-plans", LessonPlanSchema);
  private readonly records = new Map<string, PersistedEntity<LessonPlan>>();

  private remember(record: PersistedEntity<LessonPlan>): LessonPlan {
    const value = normalizeLessonPlan(record.value);
    this.records.set(record.id, { ...record, value });
    return value;
  }

  async getLesson(id: string): Promise<LessonPlan | null> {
    const record = await this.repository.get(id);
    return record ? this.remember(record) : null;
  }

  async listLessons(): Promise<LessonPlan[]> {
    const records = await this.repository.list({ limit: 100 });
    return records.map((record) => this.remember(record));
  }

  async createLesson(lesson: LessonPlan): Promise<LessonPlan> {
    const canonical = LessonPlanSchema.parse(lesson);
    const record = await this.repository.create({ value: canonical, status: "draft" });
    return this.remember(record);
  }

  async saveLesson(
    lesson: LessonPlan,
    options: LessonSaveOptions = {}
  ): Promise<LessonPlan> {
    const canonical = LessonPlanSchema.parse(lesson);
    const id = canonical.id;
    if (!id) return this.createLesson(canonical);

    let known = this.records.get(id);
    if (!known) {
      const remote = await this.repository.get(id);
      if (!remote) return this.createLesson({ ...canonical, id: undefined });
      known = remote;
      this.records.set(id, remote);
    }

    let updated;
    try {
      updated = await this.repository.update(id, {
        value: { ...canonical, id },
        expectedRevision: options.expectedRevision ?? known.revision,
        status: known.status,
      });
    } catch (error) {
      if (error instanceof PersistenceConflictError) {
        const remote = LessonPlanSchema.safeParse(error.remote.value);
        if (remote.success) {
          this.records.set(id, { ...error.remote, value: remote.data });
        }
      }
      throw error;
    }
    if (!updated) {
      throw new Error("This lesson is no longer available in saved lessons.");
    }
    return this.remember(updated);
  }

  async duplicateLesson(id: string): Promise<LessonPlan | null> {
    const record = await this.repository.duplicate(id);
    return record ? this.remember(record) : null;
  }

  async deleteLesson(id: string): Promise<void> {
    await this.repository.delete(id);
    this.records.delete(id);
  }

  getKnownRevision(id: string): number | null {
    return this.records.get(id)?.revision ?? null;
  }
}

export const defaultStorageAdapter = new SupabaseLessonStorageAdapter();
