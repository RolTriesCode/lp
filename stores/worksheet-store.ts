import { create } from "zustand";
import { getDraftWorksheet, saveDraftWorksheet } from "@/lib/draft-store";
import { WorksheetSchema, type Worksheet, type WorksheetItem } from "@/schemas/worksheet";
import type { LessonPlan } from "@/schemas/lesson";

export type WorksheetState = {
  activeWorksheet: Worksheet | null;
  isLoading: boolean;
  isDirty: boolean;
  errorState: string | null;
  currentEditItemId: string | null;

  // Actions
  loadWorksheet: (lessonId: string) => void;
  generateWorksheetFromLesson: (
    lesson: LessonPlan,
    difficulty: "easy" | "average" | "difficult",
    itemCount: number,
    additionalInstructions?: string
  ) => Promise<void>;
  updateItem: (itemId: string, updated: Partial<WorksheetItem>) => void;
  reorderItems: (from: number, to: number) => void;
  addItem: () => void;
  removeItem: (itemId: string) => void;
  saveWorksheet: () => void;
  setCurrentEditItemId: (id: string | null) => void;
  clearError: () => void;
};

export const useWorksheetStore = create<WorksheetState>((set, get) => ({
  activeWorksheet: null,
  isLoading: false,
  isDirty: false,
  errorState: null,
  currentEditItemId: null,

  loadWorksheet: (lessonId: string) => {
    if (!lessonId) return;

    try {
      const draft = getDraftWorksheet(lessonId);
      if (draft) {
        set({
          activeWorksheet: draft,
          currentEditItemId: draft.items[0]?.id || null,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({ activeWorksheet: null, isDirty: false, errorState: null });
      }
    } catch {
      set({ activeWorksheet: null, errorState: "Failed to load worksheet draft." });
    }
  },

  generateWorksheetFromLesson: async (
    lesson: LessonPlan,
    difficulty: "easy" | "average" | "difficult",
    itemCount: number,
    additionalInstructions?: string
  ) => {
    set({ isLoading: true, errorState: null });

    try {
      const response = await fetch("/api/ai/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson, difficulty, itemCount, additionalInstructions }),
      });

      const resData = await response.json();

      if (resData.success) {
        const parsed = WorksheetSchema.parse(resData.data);
        saveDraftWorksheet(parsed);
        set({
          activeWorksheet: parsed,
          currentEditItemId: parsed.items[0]?.id || null,
          isLoading: false,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({
          isLoading: false,
          errorState: resData.error?.message || "Worksheet generation failed.",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      set({ isLoading: false, errorState: msg });
    }
  },

  updateItem: (itemId: string, updated: Partial<WorksheetItem>) => {
    const current = get().activeWorksheet;
    if (!current) return;

    const list = current.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...updated } as WorksheetItem;
      }
      return item;
    });

    const updatedWorksheet = {
      ...current,
      items: list,
    };

    const parsed = WorksheetSchema.parse(updatedWorksheet);

    set({
      activeWorksheet: parsed,
      isDirty: true,
    });
  },

  reorderItems: (from: number, to: number) => {
    const current = get().activeWorksheet;
    if (!current) return;

    const list = [...current.items];
    if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    const updatedWorksheet: Worksheet = {
      ...current,
      items: list,
    };

    set({
      activeWorksheet: updatedWorksheet,
      isDirty: true,
    });
  },

  addItem: () => {
    const current = get().activeWorksheet;
    if (!current) return;

    const list = [...current.items];
    const newItem: WorksheetItem = {
      id: `ws-item-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      question: "New Activity Task Question Statement",
      points: 5,
      hint: "Guidance prompt text",
      answer: "Expected solution key / grading baseline",
    };

    list.push(newItem);

    const updatedWorksheet: Worksheet = {
      ...current,
      items: list,
    };

    set({
      activeWorksheet: updatedWorksheet,
      isDirty: true,
      currentEditItemId: newItem.id,
    });
  },

  removeItem: (itemId: string) => {
    const current = get().activeWorksheet;
    if (!current) return;

    const list = current.items.filter((item) => item.id !== itemId);
    if (list.length === 0) return; // Keep at least 1 item

    const updatedWorksheet: Worksheet = {
      ...current,
      items: list,
    };

    let nextEditId = get().currentEditItemId;
    if (nextEditId === itemId) {
      nextEditId = list[0]?.id || null;
    }

    set({
      activeWorksheet: updatedWorksheet,
      isDirty: true,
      currentEditItemId: nextEditId,
    });
  },

  saveWorksheet: () => {
    const current = get().activeWorksheet;
    if (!current) return;

    saveDraftWorksheet(current);
    set({ isDirty: false });
  },

  setCurrentEditItemId: (id: string | null) => {
    set({ currentEditItemId: id });
  },

  clearError: () => {
    set({ errorState: null });
  },
}));
