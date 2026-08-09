import { create } from "zustand";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import {
  PersistenceConflictError,
  type ILessonStorageAdapter,
  type LessonAutosaveStatus,
} from "@/lib/persistence/types";
import {
  LessonPlanSchema,
  normalizeLessonPlan,
  type LessonPlan,
} from "@/schemas/lesson";

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
  autosaveStatus: LessonAutosaveStatus;
  lastSavedAt: string | null;
  saveError: string | null;
  conflictRemote: LessonPlan | null;
  conflictRevision: number | null;

  setStorageAdapter: (adapter: ILessonStorageAdapter) => void;
  loadLesson: (id: string) => Promise<void>;
  listAllLessons: () => Promise<void>;
  setActiveLesson: (lesson: LessonPlan) => void;
  updateActiveLesson: (updater: (prev: LessonPlan) => LessonPlan) => void;
  updateSection: <K extends keyof LessonPlan>(section: K, value: LessonPlan[K]) => void;
  saveActiveLesson: (expectedRevision?: number) => Promise<boolean>;
  retrySave: () => Promise<boolean>;
  acceptRemoteVersion: () => void;
  overwriteRemoteVersion: () => Promise<boolean>;
  markOffline: () => void;
  duplicateLesson: (id: string) => Promise<string | null>;
  deleteLesson: (id: string) => Promise<void>;
  setSelectedBlockId: (blockId: string | null) => void;
  setSelectedSection: (section: SectionType | null) => void;
  clearError: () => void;
};

function browserIsOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function hasSameLessonContent(first: LessonPlan, second: LessonPlan): boolean {
  const { createdAt: _firstCreated, updatedAt: _firstUpdated, ...firstContent } = first;
  const { createdAt: _secondCreated, updatedAt: _secondUpdated, ...secondContent } = second;
  void _firstCreated;
  void _firstUpdated;
  void _secondCreated;
  void _secondUpdated;
  return JSON.stringify(firstContent) === JSON.stringify(secondContent);
}

export const useLessonStore = create<LessonState>((set, get) => ({
  activeLesson: null,
  lessonsList: [],
  isDirty: false,
  isLoading: false,
  selectedBlockId: null,
  selectedSectionType: "metadata",
  errorState: null,
  storageAdapter: defaultStorageAdapter,
  autosaveStatus: "idle",
  lastSavedAt: null,
  saveError: null,
  conflictRemote: null,
  conflictRevision: null,

  setStorageAdapter: (adapter) => {
    set({
      storageAdapter: adapter,
      autosaveStatus: "idle",
      conflictRemote: null,
      conflictRevision: null,
    });
  },

  loadLesson: async (id) => {
    if (!id) {
      set({ activeLesson: null, isLoading: false, errorState: "Invalid lesson ID." });
      return;
    }

    set({ isLoading: true, errorState: null, saveError: null });
    try {
      const lesson = await get().storageAdapter.getLesson(id);
      if (!lesson) {
        set({
          activeLesson: null,
          isDirty: false,
          isLoading: false,
          errorState: "Lesson not found, or you do not have access to it.",
        });
        return;
      }
      const normalized = normalizeLessonPlan(lesson);
      set({
        activeLesson: normalized,
        isDirty: false,
        isLoading: false,
        errorState: null,
        autosaveStatus: "saved",
        lastSavedAt: normalized.updatedAt ?? null,
        conflictRemote: null,
        conflictRevision: null,
      });
    } catch (error) {
      set({
        activeLesson: null,
        isDirty: false,
        isLoading: false,
        errorState:
          error instanceof Error ? error.message : "Failed to load the saved lesson.",
      });
    }
  },

  listAllLessons: async () => {
    set({ isLoading: true, errorState: null });
    try {
      const lessonsList = await get().storageAdapter.listLessons();
      set({ lessonsList, isLoading: false });
    } catch (error) {
      set({
        lessonsList: [],
        isLoading: false,
        errorState:
          error instanceof Error ? error.message : "Saved lessons could not be loaded.",
      });
    }
  },

  setActiveLesson: (lesson) => {
    const normalized = normalizeLessonPlan(lesson);
    set({
      activeLesson: normalized,
      isDirty: false,
      errorState: null,
      autosaveStatus: "saved",
      lastSavedAt: normalized.updatedAt ?? null,
      saveError: null,
      conflictRemote: null,
      conflictRevision: null,
    });
  },

  updateActiveLesson: (updater) => {
    const current = get().activeLesson;
    if (!current) return;
    const normalized = normalizeLessonPlan(updater(current));
    const hasConflict = get().autosaveStatus === "conflict";
    set({
      activeLesson: normalized,
      isDirty: true,
      autosaveStatus: hasConflict ? "conflict" : browserIsOffline() ? "offline" : "idle",
      saveError: hasConflict ? get().saveError : null,
    });
  },

  updateSection: (section, value) => {
    const current = get().activeLesson;
    if (!current) return;
    const normalized = normalizeLessonPlan({ ...current, [section]: value });
    const hasConflict = get().autosaveStatus === "conflict";
    set({
      activeLesson: normalized,
      isDirty: true,
      autosaveStatus: hasConflict ? "conflict" : browserIsOffline() ? "offline" : "idle",
      saveError: hasConflict ? get().saveError : null,
    });
  },

  saveActiveLesson: async (expectedRevision) => {
    const snapshot = get().activeLesson;
    if (!snapshot || !get().isDirty) return true;
    if (browserIsOffline()) {
      set({ autosaveStatus: "offline", saveError: null });
      return false;
    }

    set({ autosaveStatus: "saving", saveError: null });
    try {
      const saved = snapshot.id
        ? await get().storageAdapter.saveLesson(snapshot, { expectedRevision })
        : await get().storageAdapter.createLesson(snapshot);
      const normalized = normalizeLessonPlan(saved);
      const unchangedDuringSave = get().activeLesson === snapshot;
      if (unchangedDuringSave) {
        set({
          activeLesson: normalized,
          isDirty: false,
          autosaveStatus: "saved",
          lastSavedAt: normalized.updatedAt ?? new Date().toISOString(),
          conflictRemote: null,
          conflictRevision: null,
        });
      } else {
        set({ autosaveStatus: "idle", isDirty: true });
      }
      return true;
    } catch (error) {
      if (error instanceof PersistenceConflictError) {
        const parsedRemote = LessonPlanSchema.safeParse(error.remote.value);
        if (parsedRemote.success && hasSameLessonContent(snapshot, parsedRemote.data)) {
          set({
            activeLesson: parsedRemote.data,
            autosaveStatus: "saved",
            isDirty: false,
            lastSavedAt: parsedRemote.data.updatedAt ?? error.remote.updatedAt,
            saveError: null,
            conflictRemote: null,
            conflictRevision: null,
          });
          return true;
        }
        set({
          autosaveStatus: "conflict",
          saveError: error.message,
          conflictRemote: parsedRemote.success ? parsedRemote.data : null,
          conflictRevision: error.remote.revision,
          isDirty: true,
        });
      } else if (browserIsOffline()) {
        set({ autosaveStatus: "offline", saveError: null, isDirty: true });
      } else {
        set({
          autosaveStatus: "failed",
          saveError:
            error instanceof Error
              ? error.message
              : "The lesson could not be saved. Your changes remain open.",
          isDirty: true,
        });
      }
      return false;
    }
  },

  retrySave: async () => await get().saveActiveLesson(),

  acceptRemoteVersion: () => {
    const remote = get().conflictRemote;
    if (!remote) return;
    set({
      activeLesson: normalizeLessonPlan(remote),
      isDirty: false,
      autosaveStatus: "saved",
      lastSavedAt: remote.updatedAt ?? null,
      saveError: null,
      conflictRemote: null,
      conflictRevision: null,
    });
  },

  overwriteRemoteVersion: async () => {
    const revision = get().conflictRevision;
    if (!revision) return false;
    return await get().saveActiveLesson(revision);
  },

  markOffline: () => {
    if (get().isDirty && get().autosaveStatus !== "conflict") {
      set({ autosaveStatus: "offline", saveError: null });
    }
  },

  duplicateLesson: async (id) => {
    try {
      const clone = await get().storageAdapter.duplicateLesson(id);
      if (!clone?.id) return null;
      await get().listAllLessons();
      return clone.id;
    } catch (error) {
      set({
        errorState:
          error instanceof Error ? error.message : "The lesson could not be duplicated.",
      });
      return null;
    }
  },

  deleteLesson: async (id) => {
    try {
      await get().storageAdapter.deleteLesson(id);
      if (get().activeLesson?.id === id) set({ activeLesson: null });
      await get().listAllLessons();
    } catch (error) {
      set({
        errorState:
          error instanceof Error ? error.message : "The lesson could not be deleted.",
      });
    }
  },

  setSelectedBlockId: (selectedBlockId) => set({ selectedBlockId }),
  setSelectedSection: (selectedSectionType) => set({ selectedSectionType }),
  clearError: () => set({ errorState: null, saveError: null }),
}));
