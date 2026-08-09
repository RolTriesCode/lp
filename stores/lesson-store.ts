import { create } from "zustand";
import { getDraftLesson, saveDraftLesson } from "@/lib/draft-store";
import { defaultStorageAdapter } from "@/lib/persistence/local-adapter";
import type { ILessonStorageAdapter } from "@/lib/persistence/types";
import { normalizeLessonPlan, type LessonPlan } from "@/schemas/lesson";

export type SectionType =
  | "objectives"
  | "procedures"
  | "assessment"
  | "reflection"
  | "standards"
  | "subjectMatter"
  | "metadata";

export type LessonState = {
  activeLesson: LessonPlan | null;
  lessonsList: LessonPlan[];
  isDirty: boolean;
  isLoading: boolean;
  selectedBlockId: string | null;
  selectedSectionType: SectionType | null;
  errorState: string | null;
  storageAdapter: ILessonStorageAdapter;

  // Actions
  setStorageAdapter: (adapter: ILessonStorageAdapter) => void;
  loadLesson: (id: string) => Promise<void>;
  listAllLessons: () => Promise<void>;
  setActiveLesson: (lesson: LessonPlan) => void;
  updateActiveLesson: (updater: (prev: LessonPlan) => LessonPlan) => void;
  updateSection: <K extends keyof LessonPlan>(section: K, value: LessonPlan[K]) => void;
  saveActiveLesson: () => Promise<void>;
  duplicateLesson: (id: string) => Promise<string | null>;
  deleteLesson: (id: string) => Promise<void>;
  setSelectedBlockId: (blockId: string | null) => void;
  setSelectedSection: (section: SectionType | null) => void;
  clearError: () => void;
};

export const useLessonStore = create<LessonState>((set, get) => ({
  activeLesson: null,
  lessonsList: [],
  isDirty: false,
  isLoading: false,
  selectedBlockId: null,
  selectedSectionType: "metadata",
  errorState: null,
  storageAdapter: defaultStorageAdapter,

  setStorageAdapter: (adapter: ILessonStorageAdapter) => {
    set({ storageAdapter: adapter });
  },

  loadLesson: async (id: string) => {
    if (!id) {
      set({ activeLesson: null, isLoading: false, errorState: "Invalid lesson ID." });
      return;
    }

    set({ isLoading: true, errorState: null });
    const adapter = get().storageAdapter;

    try {
      let lesson = await adapter.getLesson(id);

      if (!lesson) {
        const legacyDraft = getDraftLesson(id);
        if (legacyDraft) {
          lesson = legacyDraft;
          await adapter.saveLesson(lesson);
        }
      }

      if (lesson) {
        const normalized = normalizeLessonPlan(lesson);
        set({
          activeLesson: normalized,
          isDirty: false,
          isLoading: false,
          errorState: null,
        });
      } else {
        set({
          activeLesson: null,
          isDirty: false,
          isLoading: false,
          errorState: "Lesson draft not found or incompatible schema version.",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load lesson draft.";
      set({
        activeLesson: null,
        isDirty: false,
        isLoading: false,
        errorState: msg,
      });
    }
  },

  listAllLessons: async () => {
    set({ isLoading: true });
    try {
      const adapter = get().storageAdapter;
      const list = await adapter.listLessons();
      set({ lessonsList: list, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setActiveLesson: (lesson: LessonPlan) => {
    const normalized = normalizeLessonPlan(lesson);
    set({ activeLesson: normalized, isDirty: false, errorState: null });
    saveDraftLesson(normalized);
  },

  updateActiveLesson: (updater: (prev: LessonPlan) => LessonPlan) => {
    const current = get().activeLesson;
    if (!current) return;

    const updated = updater(current);
    const normalized = normalizeLessonPlan(updated);

    set({
      activeLesson: normalized,
      isDirty: true,
    });
  },

  updateSection: <K extends keyof LessonPlan>(section: K, value: LessonPlan[K]) => {
    const current = get().activeLesson;
    if (!current) return;

    const updated: LessonPlan = {
      ...current,
      [section]: value,
    };
    const normalized = normalizeLessonPlan(updated);

    set({
      activeLesson: normalized,
      isDirty: true,
    });
  },

  saveActiveLesson: async () => {
    const current = get().activeLesson;
    if (!current) return;

    const adapter = get().storageAdapter;
    const updated = {
      ...current,
      updatedAt: new Date().toISOString(),
    };
    const normalized = normalizeLessonPlan(updated);

    await adapter.saveLesson(normalized);
    saveDraftLesson(normalized);

    set({
      activeLesson: normalized,
      isDirty: false,
    });
    await get().listAllLessons();
  },

  duplicateLesson: async (id: string) => {
    const adapter = get().storageAdapter;
    try {
      const original = await adapter.getLesson(id);
      if (!original) return null;

      const newId = `lesson-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const clone: LessonPlan = {
        ...original,
        id: newId,
        title: `${original.title} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const normalized = normalizeLessonPlan(clone);
      await adapter.saveLesson(normalized);
      saveDraftLesson(normalized);
      await get().listAllLessons();
      return newId;
    } catch {
      return null;
    }
  },

  deleteLesson: async (id: string) => {
    const adapter = get().storageAdapter;
    try {
      await adapter.deleteLesson(id);
      if (get().activeLesson?.id === id) {
        set({ activeLesson: null });
      }
      await get().listAllLessons();
    } catch {
      // Ignore delete errors
    }
  },

  setSelectedBlockId: (blockId: string | null) => {
    set({ selectedBlockId: blockId });
  },

  setSelectedSection: (section: SectionType | null) => {
    set({ selectedSectionType: section });
  },

  clearError: () => {
    set({ errorState: null });
  },
}));
