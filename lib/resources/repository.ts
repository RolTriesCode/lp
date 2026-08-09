import { LocalEntityRepository } from "@/lib/persistence/local-repository";
import type { IEntityRepository } from "@/lib/persistence/types";
import type { PersistedEntity } from "@/lib/persistence/types";
import { RemoteEntityRepository } from "@/lib/persistence/remote-repository";
import {
  TeachingResourceSchema,
  createTeachingResource,
  type TeachingResource,
} from "@/schemas/resource";
import type { UploadedReference } from "@/schemas/reference";

export interface IResourceRepository extends IEntityRepository<TeachingResource> {
  saveReference(reference: UploadedReference): Promise<TeachingResource>;
  synchronizeReference(reference: UploadedReference): Promise<TeachingResource | null>;
}

const removedResourceStores = new Map<string, Set<string>>();

export class LocalResourceRepository implements IResourceRepository {
  private readonly records: LocalEntityRepository<TeachingResource>;
  private readonly removedIds: Set<string>;
  private readonly removedStorageKey: string;

  constructor(storageKey: string = "aralai_resources_v1") {
    this.records = new LocalEntityRepository(storageKey, TeachingResourceSchema);
    this.removedStorageKey = `${storageKey}_removed`;
    this.removedIds = removedResourceStores.get(this.removedStorageKey) ?? new Set<string>();
    removedResourceStores.set(this.removedStorageKey, this.removedIds);
  }

  private hydrateRemovedIds() {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(this.removedStorageKey);
      const values = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(values)) {
        values.forEach((value) => {
          if (typeof value === "string") this.removedIds.add(value);
        });
      }
    } catch {
      // Invalid deletion metadata is ignored.
    }
  }

  private persistRemovedIds() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(this.removedStorageKey, JSON.stringify([...this.removedIds]));
  }

  get(id: string) {
    return this.records.get(id);
  }

  async list() {
    const resources = await this.records.list();
    return resources.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  save(resource: TeachingResource) {
    return this.records.save(resource);
  }

  async delete(id: string) {
    this.hydrateRemovedIds();
    this.removedIds.add(id);
    this.persistRemovedIds();
    await this.records.delete(id);
  }

  async saveReference(reference: UploadedReference) {
    this.hydrateRemovedIds();
    const resource = await this.upsertReference(reference);
    this.removedIds.delete(reference.id);
    this.persistRemovedIds();
    return resource;
  }

  async synchronizeReference(reference: UploadedReference) {
    this.hydrateRemovedIds();
    if (this.removedIds.has(reference.id)) return null;
    return this.upsertReference(reference);
  }

  private async upsertReference(reference: UploadedReference) {
    const existing = await this.get(reference.id);
    const resource = existing
      ? TeachingResourceSchema.parse({
          ...existing,
          ...reference,
          updatedAt: new Date().toISOString(),
        })
      : createTeachingResource(reference);
    await this.save(resource);
    return resource;
  }
}

export class SupabaseResourceRepository implements IResourceRepository {
  private readonly repository = new RemoteEntityRepository(
    "uploaded-resources",
    TeachingResourceSchema
  );
  private readonly records = new Map<string, PersistedEntity<TeachingResource>>();

  private remember(record: PersistedEntity<TeachingResource>): TeachingResource {
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

  async save(resource: TeachingResource) {
    const canonical = TeachingResourceSchema.parse(resource);
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
    if (!record) throw new Error("This resource is no longer available.");
    this.remember(record);
  }

  async delete(id: string) {
    await this.repository.delete(id);
    this.records.delete(id);
  }

  async saveReference(reference: UploadedReference) {
    const resource = createTeachingResource(reference);
    const record = await this.repository.create({ value: resource, status: "ready" });
    return this.remember(record);
  }

  async synchronizeReference(reference: UploadedReference) {
    const current = await this.get(reference.id);
    if (current) return current;
    return await this.saveReference(reference);
  }
}

export const defaultResourceRepository = new SupabaseResourceRepository();
