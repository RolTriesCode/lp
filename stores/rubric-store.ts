import { create } from "zustand";
import { getDraftRubric, saveDraftRubric } from "@/lib/draft-store";
import { RubricSchema, type Rubric, type RubricCriterion } from "@/schemas/rubric";
import type { LessonPlan } from "@/schemas/lesson";

export type RubricState = {
  activeRubric: Rubric | null;
  isLoading: boolean;
  isDirty: boolean;
  errorState: string | null;
  currentEditCriterionId: string | null;

  // Actions
  loadRubric: (lessonId: string) => void;
  generateRubricFromLesson: (
    lesson: LessonPlan,
    taskDescription: string,
    scaleLevels: string[]
  ) => Promise<void>;
  updateCriterion: (critId: string, updated: Partial<RubricCriterion>) => void;
  addCriterion: () => void;
  removeCriterion: (critId: string) => void;
  saveRubric: () => void;
  setCurrentEditCriterionId: (id: string | null) => void;
  clearError: () => void;
};

export const useRubricStore = create<RubricState>((set, get) => ({
  activeRubric: null,
  isLoading: false,
  isDirty: false,
  errorState: null,
  currentEditCriterionId: null,

  loadRubric: (lessonId: string) => {
    if (!lessonId) return;

    try {
      const draft = getDraftRubric(lessonId);
      if (draft) {
        set({
          activeRubric: draft,
          currentEditCriterionId: draft.criteria[0]?.id || null,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({ activeRubric: null, isDirty: false, errorState: null });
      }
    } catch {
      set({ activeRubric: null, errorState: "Failed to load rubric draft." });
    }
  },

  generateRubricFromLesson: async (
    lesson: LessonPlan,
    taskDescription: string,
    scaleLevels: string[]
  ) => {
    set({ isLoading: true, errorState: null });

    try {
      const response = await fetch("/api/ai/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson, taskDescription, scaleLevels }),
      });

      const resData = await response.json();

      if (resData.success) {
        const parsed = RubricSchema.parse(resData.data);
        saveDraftRubric(parsed);
        set({
          activeRubric: parsed,
          currentEditCriterionId: parsed.criteria[0]?.id || null,
          isLoading: false,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({
          isLoading: false,
          errorState: resData.error?.message || "Rubric generation failed.",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      set({ isLoading: false, errorState: msg });
    }
  },

  updateCriterion: (critId: string, updated: Partial<RubricCriterion>) => {
    const current = get().activeRubric;
    if (!current) return;

    const list = current.criteria.map((crit) => {
      if (crit.id === critId) {
        return { ...crit, ...updated } as RubricCriterion;
      }
      return crit;
    });

    const updatedRubric = {
      ...current,
      criteria: list,
    };

    const parsed = RubricSchema.parse(updatedRubric);

    set({
      activeRubric: parsed,
      isDirty: true,
    });
  },

  addCriterion: () => {
    const current = get().activeRubric;
    if (!current) return;

    const list = [...current.criteria];
    const levels = current.levels;
    const descriptors: Record<string, string> = {};
    levels.forEach((lvl) => {
      descriptors[lvl] = `New level guidelines for ${lvl}`;
    });

    const newItem: RubricCriterion = {
      id: `crit-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      name: "New Assessment Criterion Focus",
      weight: 5,
      descriptors,
    };

    list.push(newItem);

    const updatedRubric: Rubric = {
      ...current,
      criteria: list,
    };

    set({
      activeRubric: updatedRubric,
      isDirty: true,
      currentEditCriterionId: newItem.id,
    });
  },

  removeCriterion: (critId: string) => {
    const current = get().activeRubric;
    if (!current) return;

    const list = current.criteria.filter((crit) => crit.id !== critId);
    if (list.length === 0) return; // Keep at least 1

    const updatedRubric: Rubric = {
      ...current,
      criteria: list,
    };

    let nextEditId = get().currentEditCriterionId;
    if (nextEditId === critId) {
      nextEditId = list[0]?.id || null;
    }

    set({
      activeRubric: updatedRubric,
      isDirty: true,
      currentEditCriterionId: nextEditId,
    });
  },

  saveRubric: () => {
    const current = get().activeRubric;
    if (!current) return;

    saveDraftRubric(current);
    set({ isDirty: false });
  },

  setCurrentEditCriterionId: (id: string | null) => {
    set({ currentEditCriterionId: id });
  },

  clearError: () => {
    set({ errorState: null });
  },
}));
