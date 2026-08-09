import { z } from "zod";

export const SlideLayoutSchema = z.enum([
  "title",
  "bullets",
  "two_column",
  "quote",
  "big_stat",
  "interactive_qa",
]);

export type SlideLayout = z.infer<typeof SlideLayoutSchema>;

export const PresentationThemeSchema = z.enum([
  "minimal",
  "academic",
  "classroom",
  "elementary",
  "professional",
  "science",
  "mathematics",
]);

export type PresentationTheme = z.infer<typeof PresentationThemeSchema>;

export const SlideSchema = z.object({
  id: z.string(),
  layout: SlideLayoutSchema,
  title: z.string().min(1, "Slide title is required."),
  subtitle: z.string().optional(),
  bullets: z.array(z.string()).max(5, "A slide can contain at most 5 bullet items.").optional(),
  body: z.string().optional(),
  imagePrompt: z.string().optional(),
  speakerNotes: z.string().optional(),
});

export type Slide = z.infer<typeof SlideSchema>;

export const PresentationSchema = z.object({
  schemaVersion: z.literal("1.0"),
  lessonId: z.string(),
  curriculum: z.enum(["MATATAG", "ILAW"]),
  title: z.string().min(1, "Presentation title is required."),
  subtitle: z.string().optional(),
  theme: PresentationThemeSchema,
  slides: z.array(SlideSchema).min(1, "Presentation must contain at least 1 slide."),
});

export type Presentation = z.infer<typeof PresentationSchema>;

/**
 * Validates untrusted payload against Presentation schema.
 */
export function safeParsePresentation(payload: unknown) {
  return PresentationSchema.safeParse(payload);
}
