import type { LessonPlan } from "@/schemas/lesson";

/**
 * Storage Adapter Interface for Lesson Plan persistence.
 * Designed for prototype local storage with zero coupling to database implementation,
 * enabling drop-in replacement by Supabase in Step 36.
 */
export interface ILessonStorageAdapter {
  getLesson(id: string): Promise<LessonPlan | null>;
  saveLesson(lesson: LessonPlan): Promise<void>;
  deleteLesson(id: string): Promise<void>;
  listLessons(): Promise<LessonPlan[]>;
}
