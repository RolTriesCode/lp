import { LocalEntityRepository } from "@/lib/persistence/local-repository";
import type { IEntityRepository } from "@/lib/persistence/types";
import type { PersistedEntity } from "@/lib/persistence/types";
import { RemoteEntityRepository } from "@/lib/persistence/remote-repository";
import {
  LessonTemplateSchema,
  createTemplateFromLesson,
  type LessonTemplate,
} from "@/schemas/template";

export interface ITemplateRepository extends IEntityRepository<LessonTemplate> {
  createFromLesson(lesson: unknown, name: string, description?: string): Promise<LessonTemplate>;
  rename(id: string, name: string): Promise<LessonTemplate | null>;
  duplicate(id: string): Promise<LessonTemplate | null>;
}

export class LocalTemplateRepository implements ITemplateRepository {
  private readonly records: LocalEntityRepository<LessonTemplate>;

  constructor(storageKey: string = "aralai_templates_v1") {
    this.records = new LocalEntityRepository(storageKey, LessonTemplateSchema);
  }

  get(id: string) {
    return this.records.get(id);
  }

  async list() {
    const templates = await this.records.list();
    return templates.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  save(template: LessonTemplate) {
    return this.records.save(template);
  }

  delete(id: string) {
    return this.records.delete(id);
  }

  async createFromLesson(lesson: unknown, name: string, description: string = "") {
    const template = createTemplateFromLesson(lesson, name, description);
    await this.save(template);
    return template;
  }

  async rename(id: string, name: string) {
    const current = await this.get(id);
    if (!current) return null;
    const updated = LessonTemplateSchema.parse({
      ...current,
      name,
      updatedAt: new Date().toISOString(),
    });
    await this.save(updated);
    return updated;
  }

  async duplicate(id: string) {
    const current = await this.get(id);
    if (!current) return null;
    const timestamp = new Date().toISOString();
    const duplicate = LessonTemplateSchema.parse({
      ...current,
      id: `template-${crypto.randomUUID()}`,
      name: `${current.name} (Copy)`.slice(0, 80),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await this.save(duplicate);
    return duplicate;
  }
}

export class SupabaseTemplateRepository implements ITemplateRepository {
  private readonly repository = new RemoteEntityRepository("templates", LessonTemplateSchema);
  private readonly records = new Map<string, PersistedEntity<LessonTemplate>>();

  private remember(record: PersistedEntity<LessonTemplate>): LessonTemplate {
    this.records.set(record.id, record);
    return record.value;
  }

  async get(id: string) {
    const record = await this.repository.get(id);
    return record ? this.remember(record) : null;
  }

  async list() {
    const records = await this.repository.list({ limit: 100 });
    return records.map((record) => this.remember(record));
  }

  async save(template: LessonTemplate) {
    const canonical = LessonTemplateSchema.parse(template);
    let known = this.records.get(canonical.id);
    if (!known && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(canonical.id)) {
      known = (await this.repository.get(canonical.id)) ?? undefined;
    }
    const record = known
      ? await this.repository.update(known.id, {
          value: canonical,
          expectedRevision: known.revision,
          status: known.status,
        })
      : await this.repository.create({ value: canonical, status: "ready" });
    if (!record) throw new Error("This template is no longer available.");
    this.remember(record);
  }

  async delete(id: string) {
    await this.repository.delete(id);
    this.records.delete(id);
  }

  async createFromLesson(lesson: unknown, name: string, description: string = "") {
    const template = createTemplateFromLesson(lesson, name, description);
    const record = await this.repository.create({ value: template, status: "ready" });
    return this.remember(record);
  }

  async rename(id: string, name: string) {
    const current = await this.get(id);
    if (!current) return null;
    const updated = LessonTemplateSchema.parse({
      ...current,
      name,
      updatedAt: new Date().toISOString(),
    });
    await this.save(updated);
    return (await this.get(id)) ?? null;
  }

  async duplicate(id: string) {
    const record = await this.repository.duplicate(id);
    return record ? this.remember(record) : null;
  }
}

export const defaultTemplateRepository = new SupabaseTemplateRepository();
