import {
  normalizeLessonPlan,
  type LessonPlan,
} from "@/schemas/lesson";
import {
  PresentationSchema,
  type Presentation,
} from "@/schemas/presentation";
import {
  AssessmentSchema,
  type Assessment,
} from "@/schemas/assessment";
import {
  WorksheetSchema,
  type Worksheet,
} from "@/schemas/worksheet";
import {
  RubricSchema,
  type Rubric,
} from "@/schemas/rubric";

const DRAFT_STORAGE_KEY = "aralai_lesson_drafts";
const PRESENTATION_DRAFT_KEY = "aralai_presentation_drafts";
const ASSESSMENT_DRAFT_KEY = "aralai_assessment_drafts";
const WORKSHEET_DRAFT_KEY = "aralai_worksheet_drafts";
const RUBRIC_DRAFT_KEY = "aralai_rubric_drafts";

// In-memory cache for fast client/server-side retrieval within process lifetime
const draftCache = new Map<string, LessonPlan>();
const presentationCache = new Map<string, Presentation>();
const assessmentCache = new Map<string, Assessment>();
const worksheetCache = new Map<string, Worksheet>();
const rubricCache = new Map<string, Rubric>();

/**
 * Saves a generated or edited LessonPlan draft.
 */
export function saveDraftLesson(lesson: LessonPlan): string {
  const id = lesson.id || `lesson-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const updatedLesson: LessonPlan = {
    ...lesson,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: lesson.createdAt || new Date().toISOString(),
  };

  const normalized = normalizeLessonPlan(updatedLesson);
  draftCache.set(id, normalized);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      const existingMap: Record<string, LessonPlan> = existingRaw ? JSON.parse(existingRaw) : {};
      existingMap[id] = normalized;
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(existingMap));
    } catch {
      // Ignore localStorage quota or parse errors gracefully
    }
  }

  return id;
}

/**
 * Retrieves a LessonPlan draft by ID.
 */
export function getDraftLesson(id: string): LessonPlan | null {
  if (!id) return null;

  if (draftCache.has(id)) {
    return draftCache.get(id)!;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (existingRaw) {
        const existingMap: Record<string, LessonPlan> = JSON.parse(existingRaw);
        if (existingMap[id]) {
          const normalized = normalizeLessonPlan(existingMap[id]);
          draftCache.set(id, normalized);
          return normalized;
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  return null;
}

/**
 * Retrieves all stored LessonPlan drafts sorted by updated timestamp.
 */
export function getAllDraftLessons(): LessonPlan[] {
  const result: LessonPlan[] = [];

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (existingRaw) {
        const existingMap: Record<string, LessonPlan> = JSON.parse(existingRaw);
        Object.values(existingMap).forEach((draft) => {
          try {
            const normalized = normalizeLessonPlan(draft);
            draftCache.set(normalized.id!, normalized);
          } catch {
            // Skip invalid draft items
          }
        });
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  draftCache.forEach((lesson) => {
    if (!result.some((r) => r.id === lesson.id)) {
      result.push(lesson);
    }
  });

  return result.sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
  );
}

/**
 * Saves a presentation draft linked to a lesson ID.
 */
export function saveDraftPresentation(presentation: Presentation): void {
  const lessonId = presentation.lessonId;
  presentationCache.set(lessonId, presentation);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(PRESENTATION_DRAFT_KEY);
      const existingMap: Record<string, Presentation> = existingRaw ? JSON.parse(existingRaw) : {};
      existingMap[lessonId] = presentation;
      window.localStorage.setItem(PRESENTATION_DRAFT_KEY, JSON.stringify(existingMap));
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Retrieves a presentation draft by parent lesson ID.
 */
export function getDraftPresentation(lessonId: string): Presentation | null {
  if (!lessonId) return null;

  if (presentationCache.has(lessonId)) {
    return presentationCache.get(lessonId)!;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(PRESENTATION_DRAFT_KEY);
      if (existingRaw) {
        const existingMap: Record<string, Presentation> = JSON.parse(existingRaw);
        if (existingMap[lessonId]) {
          const parsed = PresentationSchema.parse(existingMap[lessonId]);
          presentationCache.set(lessonId, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}

/**
 * Saves an assessment draft linked to a lesson ID.
 */
export function saveDraftAssessment(assessment: Assessment): void {
  const lessonId = assessment.lessonId;
  assessmentCache.set(lessonId, assessment);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(ASSESSMENT_DRAFT_KEY);
      const existingMap: Record<string, Assessment> = existingRaw ? JSON.parse(existingRaw) : {};
      existingMap[lessonId] = assessment;
      window.localStorage.setItem(ASSESSMENT_DRAFT_KEY, JSON.stringify(existingMap));
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Retrieves an assessment draft by parent lesson ID.
 */
export function getDraftAssessment(lessonId: string): Assessment | null {
  if (!lessonId) return null;

  if (assessmentCache.has(lessonId)) {
    return assessmentCache.get(lessonId)!;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(ASSESSMENT_DRAFT_KEY);
      if (existingRaw) {
        const existingMap: Record<string, Assessment> = JSON.parse(existingRaw);
        if (existingMap[lessonId]) {
          const parsed = AssessmentSchema.parse(existingMap[lessonId]);
          assessmentCache.set(lessonId, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}

/**
 * Saves a worksheet draft linked to a lesson ID.
 */
export function saveDraftWorksheet(worksheet: Worksheet): void {
  const lessonId = worksheet.lessonId;
  worksheetCache.set(lessonId, worksheet);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(WORKSHEET_DRAFT_KEY);
      const existingMap: Record<string, Worksheet> = existingRaw ? JSON.parse(existingRaw) : {};
      existingMap[lessonId] = worksheet;
      window.localStorage.setItem(WORKSHEET_DRAFT_KEY, JSON.stringify(existingMap));
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Retrieves a worksheet draft by parent lesson ID.
 */
export function getDraftWorksheet(lessonId: string): Worksheet | null {
  if (!lessonId) return null;

  if (worksheetCache.has(lessonId)) {
    return worksheetCache.get(lessonId)!;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(WORKSHEET_DRAFT_KEY);
      if (existingRaw) {
        const existingMap: Record<string, Worksheet> = JSON.parse(existingRaw);
        if (existingMap[lessonId]) {
          const parsed = WorksheetSchema.parse(existingMap[lessonId]);
          worksheetCache.set(lessonId, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}

/**
 * Saves a rubric draft linked to a lesson ID.
 */
export function saveDraftRubric(rubric: Rubric): void {
  const lessonId = rubric.lessonId;
  rubricCache.set(lessonId, rubric);

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(RUBRIC_DRAFT_KEY);
      const existingMap: Record<string, Rubric> = existingRaw ? JSON.parse(existingRaw) : {};
      existingMap[lessonId] = rubric;
      window.localStorage.setItem(RUBRIC_DRAFT_KEY, JSON.stringify(existingMap));
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Retrieves a rubric draft by parent lesson ID.
 */
export function getDraftRubric(lessonId: string): Rubric | null {
  if (!lessonId) return null;

  if (rubricCache.has(lessonId)) {
    return rubricCache.get(lessonId)!;
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const existingRaw = window.localStorage.getItem(RUBRIC_DRAFT_KEY);
      if (existingRaw) {
        const existingMap: Record<string, Rubric> = JSON.parse(existingRaw);
        if (existingMap[lessonId]) {
          const parsed = RubricSchema.parse(existingMap[lessonId]);
          rubricCache.set(lessonId, parsed);
          return parsed;
        }
      }
    } catch {
      // Ignore errors
    }
  }

  return null;
}
