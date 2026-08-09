import { create } from "zustand";
import { getDraftAssessment, saveDraftAssessment } from "@/lib/draft-store";
import { AssessmentSchema, type Assessment, type AssessmentItem, type AssessmentItemType } from "@/schemas/assessment";
import type { LessonPlan } from "@/schemas/lesson";

export type AssessmentState = {
  activeAssessment: Assessment | null;
  isLoading: boolean;
  isDirty: boolean;
  errorState: string | null;
  currentEditItemId: string | null;

  // Actions
  loadAssessment: (lessonId: string) => void;
  generateAssessmentFromLesson: (
    lesson: LessonPlan,
    itemTypes: AssessmentItemType[],
    difficulty: "easy" | "average" | "difficult",
    itemCount: number,
    additionalInstructions?: string
  ) => Promise<void>;
  updateItem: (itemId: string, updated: Partial<AssessmentItem>) => void;
  reorderItems: (from: number, to: number) => void;
  addItem: (type: AssessmentItemType) => void;
  removeItem: (itemId: string) => void;
  saveAssessment: () => void;
  setCurrentEditItemId: (id: string | null) => void;
  clearError: () => void;
};

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  activeAssessment: null,
  isLoading: false,
  isDirty: false,
  errorState: null,
  currentEditItemId: null,

  loadAssessment: (lessonId: string) => {
    if (!lessonId) return;

    try {
      const draft = getDraftAssessment(lessonId);
      if (draft) {
        set({
          activeAssessment: draft,
          currentEditItemId: draft.items[0]?.id || null,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({ activeAssessment: null, isDirty: false, errorState: null });
      }
    } catch {
      set({ activeAssessment: null, errorState: "Failed to load assessment draft." });
    }
  },

  generateAssessmentFromLesson: async (
    lesson: LessonPlan,
    itemTypes: AssessmentItemType[],
    difficulty: "easy" | "average" | "difficult",
    itemCount: number,
    additionalInstructions?: string
  ) => {
    set({ isLoading: true, errorState: null });

    try {
      const response = await fetch("/api/ai/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson, itemTypes, difficulty, itemCount, additionalInstructions }),
      });

      const resData = await response.json();

      if (resData.success) {
        const parsed = AssessmentSchema.parse(resData.data);
        saveDraftAssessment(parsed);
        set({
          activeAssessment: parsed,
          currentEditItemId: parsed.items[0]?.id || null,
          isLoading: false,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({
          isLoading: false,
          errorState: resData.error?.message || "Assessment generation failed.",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      set({ isLoading: false, errorState: msg });
    }
  },

  updateItem: (itemId: string, updated: Partial<AssessmentItem>) => {
    const current = get().activeAssessment;
    if (!current) return;

    const list = current.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updated } as AssessmentItem;
      }
      return item;
    });

    const updatedAssessment = {
      ...current,
      items: list,
    };

    const parsed = AssessmentSchema.parse(updatedAssessment);

    set({
      activeAssessment: parsed,
      isDirty: true,
    });
  },

  reorderItems: (from: number, to: number) => {
    const current = get().activeAssessment;
    if (!current) return;

    const list = [...current.items];
    if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    const updatedAssessment: Assessment = {
      ...current,
      items: list,
    };

    set({
      activeAssessment: updatedAssessment,
      isDirty: true,
    });
  },

  addItem: (type: AssessmentItemType) => {
    const current = get().activeAssessment;
    if (!current) return;

    const list = [...current.items];
    const newItem: AssessmentItem = {
      id: `item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      question: "New Question Text",
      points: type === "essay" || type === "performance_task" ? 5 : 1,
      choices: type === "multiple_choice" ? ["Option A", "Option B", "Option C", "Option D"] : type === "true_or_false" ? ["True", "False"] : undefined,
      answer: type === "true_or_false" ? "True" : "Correct Answer",
      rubric: type === "essay" || type === "performance_task" ? "Grading rubric rules." : undefined,
    };

    list.push(newItem);

    const updatedAssessment: Assessment = {
      ...current,
      items: list,
    };

    set({
      activeAssessment: updatedAssessment,
      isDirty: true,
      currentEditItemId: newItem.id,
    });
  },

  removeItem: (itemId: string) => {
    const current = get().activeAssessment;
    if (!current) return;

    const list = current.items.filter((item) => item.id !== itemId);
    if (list.length === 0) return; // Keep at least 1 item

    const updatedAssessment: Assessment = {
      ...current,
      items: list,
    };

    let nextEditId = get().currentEditItemId;
    if (nextEditId === itemId) {
      nextEditId = list[0]?.id || null;
    }

    set({
      activeAssessment: updatedAssessment,
      isDirty: true,
      currentEditItemId: nextEditId,
    });
  },

  saveAssessment: () => {
    const current = get().activeAssessment;
    if (!current) return;

    saveDraftAssessment(current);
    set({ isDirty: false });
  },

  setCurrentEditItemId: (id: string | null) => {
    set({ currentEditItemId: id });
  },

  clearError: () => {
    set({ errorState: null });
  },
}));
