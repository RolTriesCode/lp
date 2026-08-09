import type { z } from "zod";
import type { PersistedEntity } from "@/lib/persistence/types";
import {
  RemoteEntityRepository,
  type RemoteEntityName,
} from "@/lib/persistence/remote-repository";

export class SupabaseArtifactRepository<TEntity extends { lessonId: string }> {
  private readonly repository: RemoteEntityRepository<TEntity>;
  private readonly byLesson = new Map<string, PersistedEntity<TEntity>>();

  constructor(entity: RemoteEntityName, schema: z.ZodType<TEntity>) {
    this.repository = new RemoteEntityRepository(entity, schema);
  }

  async getForLesson(lessonId: string): Promise<TEntity | null> {
    const records = await this.repository.list({ lessonPlanId: lessonId, limit: 1 });
    const record = records[0];
    if (!record) return null;
    this.byLesson.set(lessonId, record);
    return record.value;
  }

  async save(value: TEntity): Promise<TEntity> {
    let record = this.byLesson.get(value.lessonId);
    if (!record) {
      const records = await this.repository.list({ lessonPlanId: value.lessonId, limit: 1 });
      record = records[0];
    }
    const saved = record
      ? await this.repository.update(record.id, {
          value,
          expectedRevision: record.revision,
          status: record.status,
        })
      : await this.repository.create({ value, status: "draft" });
    if (!saved) throw new Error("This saved artifact is no longer available.");
    this.byLesson.set(value.lessonId, saved);
    return saved.value;
  }

  async deleteForLesson(lessonId: string): Promise<void> {
    const record = this.byLesson.get(lessonId);
    if (!record) return;
    await this.repository.delete(record.id);
    this.byLesson.delete(lessonId);
  }
}
