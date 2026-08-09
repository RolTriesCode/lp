if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import type { z } from "zod";

/**
 * High-level provider-independent capabilities supported by the AI router.
 */
export type AICapability =
  | "structured_lesson_generation"
  | "fast_text_rewrite"
  | "assessment_generation"
  | "worksheet_generation"
  | "presentation_generation";

/**
 * Concrete AI Provider names.
 */
export type AIProviderName = "groq" | "cerebras" | "openrouter" | "gemini" | "mock";

/**
 * Classifications for AI provider failures.
 */
export type AIProviderErrorCategory =
  | "MISSING_API_KEY"
  | "TIMEOUT"
  | "INVALID_REQUEST"
  | "SAFETY_REJECTION"
  | "RATE_LIMIT"
  | "UPSTREAM_FAILURE"
  | "NETWORK_ERROR";

/**
 * Teacher-friendly, non-technical normalized error.
 */
export class AIProviderError extends Error {
  public readonly category: AIProviderErrorCategory;
  public readonly provider: AIProviderName;
  public readonly model: string;
  public readonly retryable: boolean;

  constructor({
    category,
    provider,
    model,
    message,
    retryable,
  }: {
    category: AIProviderErrorCategory;
    provider: AIProviderName;
    model: string;
    message: string;
    retryable: boolean;
  }) {
    super(message);
    this.name = "AIProviderError";
    this.category = category;
    this.provider = provider;
    this.model = model;
    this.retryable = retryable;
  }
}

/**
 * Privacy-safe metadata telemetry log entry (NO raw classroom or teacher prompt text).
 */
export type AITelemetryLog = {
  timestamp: string;
  capability: AICapability;
  primaryProvider: AIProviderName;
  selectedProvider: AIProviderName;
  model: string;
  durationMs: number;
  status: "success" | "error" | "fallback_success";
  errorCategory?: AIProviderErrorCategory;
};

/**
 * Input request arguments for capability execution.
 */
export type ExecuteCapabilityOptions<T extends z.ZodTypeAny> = {
  capability: AICapability;
  systemPrompt: string;
  userPrompt: string;
  schema?: T;
  timeoutMs?: number;
  overridePrimaryProvider?: AIProviderName;
};

/**
 * Standard output returned by the capability router.
 */
export type CapabilityResult<T> = {
  data: T;
  provider: AIProviderName;
  model: string;
  durationMs: number;
  usedFallback: boolean;
};
