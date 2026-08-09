import type { z } from "zod";
import type { IEntityRepository } from "./types";

const memoryStores = new Map<string, Map<string, unknown>>();

function getMemoryStore(storageKey: string): Map<string, unknown> {
  const existing = memoryStores.get(storageKey);
  if (existing) return existing;
  const store = new Map<string, unknown>();
  memoryStores.set(storageKey, store);
  return store;
}

/**
 * Small schema-validating prototype repository. Supabase implementations can
 * replace this class through IEntityRepository without changing consumers.
 */
export class LocalEntityRepository<T extends { id: string }>
  implements IEntityRepository<T>
{
  private readonly memoryStore: Map<string, unknown>;

  constructor(
    private readonly storageKey: string,
    private readonly schema: z.ZodType<T>
  ) {
    this.memoryStore = getMemoryStore(storageKey);
  }

  private hydrate(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;
      const values = JSON.parse(raw) as unknown;
      if (!Array.isArray(values)) return;
      values.forEach((value) => {
        const parsed = this.schema.safeParse(value);
        if (parsed.success) this.memoryStore.set(parsed.data.id, parsed.data);
      });
    } catch {
      // Invalid local data is ignored and never exposed to consumers.
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      this.storageKey,
      JSON.stringify(Array.from(this.memoryStore.values()))
    );
  }

  async get(id: string): Promise<T | null> {
    if (!id) return null;
    this.hydrate();
    const parsed = this.schema.safeParse(this.memoryStore.get(id));
    return parsed.success ? parsed.data : null;
  }

  async list(): Promise<T[]> {
    this.hydrate();
    return Array.from(this.memoryStore.values()).flatMap((value) => {
      const parsed = this.schema.safeParse(value);
      return parsed.success ? [parsed.data] : [];
    });
  }

  async save(record: T): Promise<void> {
    const parsed = this.schema.parse(record);
    this.memoryStore.set(parsed.id, parsed);
    this.persist();
  }

  async delete(id: string): Promise<void> {
    this.memoryStore.delete(id);
    this.persist();
  }
}
