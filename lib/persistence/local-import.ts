import { normalizeLessonPlan, safeParseLessonPlan, type LessonPlan } from "@/schemas/lesson";
import { PersistenceRequestError } from "@/lib/persistence/types";

const PROTOTYPE_LESSON_KEYS = ["aralai_lessons_v1", "aralai_lesson_drafts"] as const;

export type LocalLessonImportScan = {
  lessons: LessonPlan[];
  invalidCount: number;
};

export type LocalLessonImportResult = {
  imported: Array<{ id: string }>;
  skipped: string[];
  rejected: number;
};

export function scanLocalPrototypeLessons(): LocalLessonImportScan {
  if (typeof window === "undefined") return { lessons: [], invalidCount: 0 };

  const bySourceId = new Map<string, LessonPlan>();
  let invalidCount = 0;
  for (const key of PROTOTYPE_LESSON_KEYS) {
    let raw: string | null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      invalidCount += 1;
      continue;
    }
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const values =
        Array.isArray(parsed)
          ? parsed
          : parsed && typeof parsed === "object"
            ? Object.values(parsed)
            : [];
      for (const value of values) {
        const result = safeParseLessonPlan(value);
        if (!result.success || !result.data.id || result.data.id.length > 100) {
          invalidCount += 1;
          continue;
        }
        try {
          const lesson = normalizeLessonPlan(result.data);
          bySourceId.set(lesson.id!, lesson);
        } catch {
          invalidCount += 1;
        }
      }
    } catch {
      invalidCount += 1;
    }
  }
  return { lessons: [...bySourceId.values()].slice(0, 100), invalidCount };
}

export async function importLocalPrototypeLessons(
  lessons: LessonPlan[]
): Promise<LocalLessonImportResult> {
  const response = await fetch("/api/persistence/import/local-lessons", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lessons }),
  });
  const body = (await response.json().catch(() => null)) as
    | { success: true; data: LocalLessonImportResult }
    | { success: false; error?: { code?: string; message?: string } }
    | null;
  if (!response.ok || !body?.success) {
    const error = body && !body.success ? body.error : undefined;
    throw new PersistenceRequestError(
      error?.message ?? "Local lessons could not be imported.",
      error?.code ?? "LOCAL_IMPORT_FAILED",
      response.status
    );
  }
  return body.data;
}
