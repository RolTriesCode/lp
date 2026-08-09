import {
  normalizeLessonPlan,
  safeParseLessonPlan,
  type LessonPlan,
} from "@/schemas/lesson";
import type { ILessonStorageAdapter } from "./types";

const STORAGE_KEY_V1 = "aralai_lessons_v1";

// In-memory fallback map for non-browser runtimes or test execution
const memoryStore = new Map<string, LessonPlan>();

export class LocalStorageAdapter implements ILessonStorageAdapter {
  async getLesson(id: string): Promise<LessonPlan | null> {
    if (!id) return null;

    // Check memory store first
    if (memoryStore.has(id)) {
      return memoryStore.get(id)!;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY_V1);
        if (!raw) return null;

        const recordMap: Record<string, unknown> = JSON.parse(raw);
        const rawLesson = recordMap[id];
        if (!rawLesson) return null;

        // Validate rehydrated payload against canonical schema
        const parseResult = safeParseLessonPlan(rawLesson);
        if (parseResult.success) {
          const normalized = normalizeLessonPlan(parseResult.data);
          memoryStore.set(id, normalized);
          return normalized;
        } else {
          console.warn(`[StorageAdapter] Incompatible draft data quarantined for ID: ${id}`);
          return null;
        }
      } catch (err) {
        console.error(`[StorageAdapter] Failed to load draft for ID ${id}:`, err);
        return null;
      }
    }

    return null;
  }

  async createLesson(lesson: LessonPlan): Promise<LessonPlan> {
    const id = lesson.id || `lesson-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const normalized = normalizeLessonPlan({
      ...lesson,
      id,
      createdAt: lesson.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await this.saveLesson(normalized);
    return normalized;
  }

  async saveLesson(lesson: LessonPlan): Promise<LessonPlan> {
    const id = lesson.id || `lesson-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const normalized = normalizeLessonPlan({
      ...lesson,
      id,
      updatedAt: new Date().toISOString(),
    });

    memoryStore.set(id, normalized);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY_V1);
        const recordMap: Record<string, unknown> = raw ? JSON.parse(raw) : {};
        recordMap[id] = normalized;
        window.localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(recordMap));
      } catch (err) {
        console.error("[StorageAdapter] Failed to save draft:", err);
      }
    }

    return normalized;
  }

  async duplicateLesson(id: string): Promise<LessonPlan | null> {
    const original = await this.getLesson(id);
    if (!original) return null;
    return this.createLesson({
      ...original,
      id: undefined,
      title: `${original.title} (Copy)`.slice(0, 200),
      createdAt: undefined,
      updatedAt: undefined,
    });
  }

  async deleteLesson(id: string): Promise<void> {
    memoryStore.delete(id);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY_V1);
        if (raw) {
          const recordMap: Record<string, unknown> = JSON.parse(raw);
          delete recordMap[id];
          window.localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(recordMap));
        }
      } catch {
        // Ignore delete errors
      }
    }
  }

  async listLessons(): Promise<LessonPlan[]> {
    const list: LessonPlan[] = [];

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY_V1);
        if (raw) {
          const recordMap: Record<string, unknown> = JSON.parse(raw);
          Object.values(recordMap).forEach((val) => {
            const parseResult = safeParseLessonPlan(val);
            if (parseResult.success) {
              const normalized = normalizeLessonPlan(parseResult.data);
              memoryStore.set(normalized.id!, normalized);
            }
          });
        }
      } catch {
        // Ignore parse errors
      }
    }

    memoryStore.forEach((lesson) => {
      if (!list.some((l) => l.id === lesson.id)) {
        list.push(lesson);
      }
    });

    return list.sort(
      (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    );
  }
}
