import { z } from "zod";

const LocalHostnames = new Set(["localhost", "127.0.0.1", "::1"]);

export const SupabasePublicEnvSchema = z.object({
  url: z
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.")
    .superRefine((value, context) => {
      const parsed = new URL(value);
      const isSecure = parsed.protocol === "https:";
      const isLocal = parsed.protocol === "http:" && LocalHostnames.has(parsed.hostname);
      if (!isSecure && !isLocal) {
        context.addIssue({
          code: "custom",
          message: "NEXT_PUBLIC_SUPABASE_URL must use HTTPS outside local development.",
        });
      }
    }),
  publishableKey: z
    .string()
    .trim()
    .min(20, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or invalid."),
});

export type SupabasePublicEnv = z.infer<typeof SupabasePublicEnvSchema>;

export const ApplicationUrlSchema = z
  .url("NEXT_PUBLIC_SITE_URL must be a valid URL.")
  .transform((value) => new URL(value))
  .superRefine((value, context) => {
    const isSecure = value.protocol === "https:";
    const isLocal = value.protocol === "http:" && LocalHostnames.has(value.hostname);
    if (!isSecure && !isLocal) {
      context.addIssue({
        code: "custom",
        message: "NEXT_PUBLIC_SITE_URL must use HTTPS outside local development.",
      });
    }
  })
  .transform((value) => value.origin);

export function parseSupabasePublicEnv(values: {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}): SupabasePublicEnv {
  const parsed = SupabasePublicEnvSchema.safeParse({
    url: values.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(`Supabase environment configuration is invalid. ${details}`);
  }

  return parsed.data;
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return parseSupabasePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function parseApplicationUrl(value?: string): string {
  const parsed = ApplicationUrlSchema.safeParse(value);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.message).join(" ");
    throw new Error(`Application URL configuration is invalid. ${details}`);
  }
  return parsed.data;
}

export function getApplicationUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  const candidate = configured ?? (vercelUrl ? `https://${vercelUrl}` : undefined);

  if (candidate) return parseApplicationUrl(candidate);
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  throw new Error(
    "Application URL configuration is invalid. NEXT_PUBLIC_SITE_URL is required in production."
  );
}
