import type { GenerateLessonResult } from "@/lib/ai/generate-lesson";
import type { LessonPlanFormValues } from "@/lib/lesson-plan-schema";

/**
 * Client-side helper to post lesson generation request to /api/ai/lesson.
 * Supports cancellation via AbortSignal.
 */
export async function requestLessonGeneration(
  input: LessonPlanFormValues,
  signal?: AbortSignal
): Promise<GenerateLessonResult> {
  try {
    const response = await fetch("/api/ai/lesson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal,
    });

    const data = await response.json();
    return data as GenerateLessonResult;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        success: false,
        correlationId: `cancel-${Date.now().toString(36)}`,
        error: {
          category: "TIMEOUT",
          message: "Lesson generation was cancelled by teacher.",
          retryable: true,
        },
      };
    }

    const message = err instanceof Error ? err.message : "Network fetch failed.";
    return {
      success: false,
      correlationId: `err-${Date.now().toString(36)}`,
      error: {
        category: "NETWORK_ERROR",
        message: `Connection error: ${message}`,
        retryable: true,
      },
    };
  }
}
