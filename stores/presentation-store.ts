import { create } from "zustand";
import { SupabaseArtifactRepository } from "@/lib/persistence/artifact-repository";
import { PresentationSchema, type Presentation, type PresentationTheme, type Slide } from "@/schemas/presentation";
import type { LessonPlan } from "@/schemas/lesson";

export type PresentationState = {
  activePresentation: Presentation | null;
  currentSlideIndex: number;
  isLoading: boolean;
  isDirty: boolean;
  errorState: string | null;

  // Actions
  loadPresentation: (lessonId: string) => Promise<void>;
  generatePresentationFromLesson: (lesson: LessonPlan, theme: PresentationTheme) => Promise<void>;
  updateSlide: (index: number, updated: Partial<Slide>) => void;
  reorderSlides: (from: number, to: number) => void;
  addSlide: (index: number) => void;
  removeSlide: (index: number) => void;
  savePresentation: () => Promise<void>;
  setCurrentSlideIndex: (idx: number) => void;
  clearError: () => void;
};

const presentationRepository = new SupabaseArtifactRepository(
  "presentations",
  PresentationSchema
);

export const usePresentationStore = create<PresentationState>((set, get) => ({
  activePresentation: null,
  currentSlideIndex: 0,
  isLoading: false,
  isDirty: false,
  errorState: null,

  loadPresentation: async (lessonId: string) => {
    if (!lessonId) return;

    try {
      const draft = await presentationRepository.getForLesson(lessonId);
      if (draft) {
        set({
          activePresentation: draft,
          currentSlideIndex: 0,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({ activePresentation: null, isDirty: false, errorState: null });
      }
    } catch (error) {
      set({
        activePresentation: null,
        errorState: error instanceof Error ? error.message : "Failed to load the saved presentation.",
      });
    }
  },

  generatePresentationFromLesson: async (lesson: LessonPlan, theme: PresentationTheme) => {
    set({ isLoading: true, errorState: null });

    try {
      const response = await fetch("/api/ai/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonPlan: lesson, theme }),
      });

      const resData = await response.json();

      if (resData.success) {
        const parsed = PresentationSchema.parse(resData.data);
        const saved = await presentationRepository.save(parsed);
        set({
          activePresentation: saved,
          currentSlideIndex: 0,
          isLoading: false,
          isDirty: false,
          errorState: null,
        });
      } else {
        set({
          isLoading: false,
          errorState: resData.error?.message || "Slide generation failed.",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      set({ isLoading: false, errorState: msg });
    }
  },

  updateSlide: (index: number, updated: Partial<Slide>) => {
    const current = get().activePresentation;
    if (!current) return;

    const list = [...current.slides];
    list[index] = {
      ...list[index],
      ...updated,
    };

    const updatedPres: Presentation = {
      ...current,
      slides: list,
    };

    const parsed = PresentationSchema.parse(updatedPres);

    set({
      activePresentation: parsed,
      isDirty: true,
    });
  },

  reorderSlides: (from: number, to: number) => {
    const current = get().activePresentation;
    if (!current) return;

    const list = [...current.slides];
    if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;

    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);

    const updatedPres: Presentation = {
      ...current,
      slides: list,
    };

    set({
      activePresentation: updatedPres,
      isDirty: true,
      currentSlideIndex: to,
    });
  },

  addSlide: (index: number) => {
    const current = get().activePresentation;
    if (!current) return;

    const list = [...current.slides];
    const newSlide: Slide = {
      id: `slide-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      layout: "bullets",
      title: "New Slide Title",
      bullets: ["Bullet point 1"],
      speakerNotes: "Explain the new slide concept.",
    };

    list.splice(index + 1, 0, newSlide);

    const updatedPres: Presentation = {
      ...current,
      slides: list,
    };

    set({
      activePresentation: updatedPres,
      isDirty: true,
      currentSlideIndex: index + 1,
    });
  },

  removeSlide: (index: number) => {
    const current = get().activePresentation;
    if (!current) return;

    const list = [...current.slides];
    if (list.length <= 1) return; // Keep at least 1 slide

    list.splice(index, 1);

    const updatedPres: Presentation = {
      ...current,
      slides: list,
    };

    let nextIdx = get().currentSlideIndex;
    if (nextIdx >= list.length) {
      nextIdx = list.length - 1;
    }

    set({
      activePresentation: updatedPres,
      isDirty: true,
      currentSlideIndex: nextIdx,
    });
  },

  savePresentation: async () => {
    const current = get().activePresentation;
    if (!current) return;

    try {
      const saved = await presentationRepository.save(current);
      set({ activePresentation: saved, isDirty: false, errorState: null });
    } catch (error) {
      set({
        isDirty: true,
        errorState: error instanceof Error ? error.message : "The presentation could not be saved.",
      });
    }
  },

  setCurrentSlideIndex: (idx: number) => {
    set({ currentSlideIndex: idx });
  },

  clearError: () => {
    set({ errorState: null });
  },
}));
