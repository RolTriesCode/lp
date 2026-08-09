import { track } from "@vercel/analytics";
import { isVercelObservabilityEnabled } from "./config";

const FAILURE_CATEGORIES = new Set([
  "INVALID_REQUEST",
  "MISSING_API_KEY",
  "NETWORK_ERROR",
  "RATE_LIMIT",
  "SAFETY_REJECTION",
  "TIMEOUT",
  "UPSTREAM_FAILURE",
  "VALIDATION_ERROR",
]);

const CURRICULA = new Set(["ILAW", "MATATAG"]);
const LESSON_TYPES = new Set(["daily-log", "detailed", "semi-detailed"]);
const EXPORT_FORMATS = new Set(["docx", "pdf", "pptx"]);

export type ProductEventName =
  | "editor_opened"
  | "export_completed"
  | "lesson_generation_failed"
  | "lesson_generation_started"
  | "lesson_generation_succeeded";

export type ProductEventProperties = {
  editor_opened: { surface: "structured_editor" };
  export_completed: { format: "docx" | "pdf" | "pptx" };
  lesson_generation_failed: { category: string };
  lesson_generation_started: { curriculum: "ILAW" | "MATATAG"; lesson_type: "daily-log" | "detailed" | "semi-detailed" };
  lesson_generation_succeeded: { curriculum: "ILAW" | "MATATAG"; lesson_type: "daily-log" | "detailed" | "semi-detailed" };
};

export function sanitizeProductEvent(
  name: string,
  properties: Record<string, unknown>,
): { name: ProductEventName; properties: Record<string, string> } | null {
  switch (name) {
    case "editor_opened":
      return properties.surface === "structured_editor"
        ? { name, properties: { surface: "structured_editor" } }
        : null;
    case "export_completed":
      return typeof properties.format === "string" && EXPORT_FORMATS.has(properties.format)
        ? { name, properties: { format: properties.format } }
        : null;
    case "lesson_generation_failed":
      return typeof properties.category === "string" && FAILURE_CATEGORIES.has(properties.category)
        ? { name, properties: { category: properties.category } }
        : { name, properties: { category: "UPSTREAM_FAILURE" } };
    case "lesson_generation_started":
    case "lesson_generation_succeeded":
      return typeof properties.curriculum === "string"
        && CURRICULA.has(properties.curriculum)
        && typeof properties.lesson_type === "string"
        && LESSON_TYPES.has(properties.lesson_type)
        ? {
          name,
          properties: {
            curriculum: properties.curriculum,
            lesson_type: properties.lesson_type,
          },
        }
        : null;
    default:
      return null;
  }
}

export function trackProductEvent<Name extends ProductEventName>(
  name: Name,
  properties: ProductEventProperties[Name],
): void {
  if (!isVercelObservabilityEnabled()) return;
  const safe = sanitizeProductEvent(name, properties);
  if (!safe) return;

  try {
    track(safe.name, safe.properties);
  } catch {
    // Analytics availability must never affect product behavior.
  }
}
