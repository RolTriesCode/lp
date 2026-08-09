if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import { generateObject, generateText } from "ai";
import type { z } from "zod";
import { getAIConfig, resolveProviderForCapability } from "./config";
import { getCerebrasModel } from "./providers/cerebras";
import { getGroqModel } from "./providers/groq";
import { getOpenRouterModel } from "./providers/openrouter";
import { getGeminiModel } from "./providers/gemini";
import {
  AIProviderError,
  type AICapability,
  type AIProviderErrorCategory,
  type AIProviderName,
  type AITelemetryLog,
  type CapabilityResult,
  type ExecuteCapabilityOptions,
} from "./types";

/**
 * Privacy-safe telemetry logger.
 * GUARANTEE: Never logs raw classroom content, teacher notes, system prompts, or user inputs.
 */
export function logAITelemetry(entry: AITelemetryLog): void {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[AI Router Telemetry] ${entry.timestamp} | ${entry.capability} | Provider: ${entry.selectedProvider} (${entry.model}) | Status: ${entry.status} | Duration: ${entry.durationMs}ms${
        entry.errorCategory ? ` | Error: ${entry.errorCategory}` : ""
      }`
    );
  }
}

/**
 * Resolves a model instance for a given provider name.
 */
export function resolveModelInstance(provider: AIProviderName) {
  switch (provider) {
    case "groq":
      return getGroqModel();
    case "cerebras":
      return getCerebrasModel();
    case "gemini":
      return getGeminiModel();
    case "openrouter":
      return getOpenRouterModel();
    default:
      return getGroqModel();
  }
}

/**
 * Normalizes upstream AI SDK / network / provider errors into a structured AIProviderError.
 */
export function normalizeError(
  err: unknown,
  provider: AIProviderName,
  model: string
): AIProviderError {
  if (err instanceof AIProviderError) {
    return err;
  }

  const rawMessage = err instanceof Error ? err.message : String(err);
  let category: AIProviderErrorCategory = "UPSTREAM_FAILURE";
  let retryable = true;
  let userMessage = "The AI service encountered a temporary issue. Please try again.";

  if (
    rawMessage.includes("aborted") ||
    rawMessage.includes("timeout") ||
    rawMessage.includes("ETIMEDOUT")
  ) {
    category = "TIMEOUT";
    retryable = true;
    userMessage = "The AI request timed out. Retrying with alternative capacity...";
  } else if (
    rawMessage.includes("401") ||
    rawMessage.includes("403") ||
    rawMessage.includes("API key") ||
    rawMessage.includes("unauthorized")
  ) {
    category = "MISSING_API_KEY";
    retryable = false;
    userMessage = "AI service authentication is not configured.";
  } else if (
    rawMessage.includes("429") ||
    rawMessage.includes("rate limit") ||
    rawMessage.includes("quota")
  ) {
    category = "RATE_LIMIT";
    retryable = true;
    userMessage = "AI rate limit reached. Switching capacity...";
  } else if (
    rawMessage.includes("safety") ||
    rawMessage.includes("content policy") ||
    rawMessage.includes("flagged")
  ) {
    category = "SAFETY_REJECTION";
    retryable = false;
    userMessage = "The prompt request could not be fulfilled due to safety guidelines.";
  } else if (rawMessage.includes("400") || rawMessage.includes("invalid")) {
    category = "INVALID_REQUEST";
    retryable = false;
    userMessage = "The lesson generation prompt format is invalid.";
  } else if (
    rawMessage.includes("fetch failed") ||
    rawMessage.includes("ENOTFOUND") ||
    rawMessage.includes("ECONNRESET")
  ) {
    category = "NETWORK_ERROR";
    retryable = true;
    userMessage = "Network connection to AI service failed.";
  }

  return new AIProviderError({
    category,
    provider,
    model,
    message: userMessage,
    retryable,
  });
}

/**
 * Internal execution helper for a single provider attempt with AbortController timeout.
 */
async function attemptProviderExecution<T extends z.ZodTypeAny>({
  provider,
  capability,
  systemPrompt,
  userPrompt,
  schema,
  timeoutMs,
}: {
  provider: AIProviderName;
  capability: AICapability;
  systemPrompt: string;
  userPrompt: string;
  schema?: T;
  timeoutMs: number;
}): Promise<{ data: any; modelId: string }> {
  const modelRef = resolveModelInstance(provider);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (schema) {
      const result = await generateObject({
        model: modelRef.model,
        system: systemPrompt,
        prompt: userPrompt,
        schema,
        abortSignal: controller.signal,
      });
      return { data: result.object, modelId: modelRef.modelId };
    } else {
      const result = await generateText({
        model: modelRef.model,
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: controller.signal,
      });
      return { data: result.text, modelId: modelRef.modelId };
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main AI Router Capability Execution Entry Point.
 *
 * Provides capability-driven AI routing, automatic retry-boundary fallback management,
 * timeout cancellation, normalized error throwing, and privacy-safe telemetry.
 */
export async function executeAICapability<T extends z.ZodTypeAny = z.ZodTypeAny>({
  capability,
  systemPrompt,
  userPrompt,
  schema,
  timeoutMs,
  overridePrimaryProvider,
}: ExecuteCapabilityOptions<T>): Promise<CapabilityResult<z.infer<T>>> {
  const config = getAIConfig();
  const requestTimeout = timeoutMs || config.timeoutMs;
  const primaryProvider = overridePrimaryProvider || resolveProviderForCapability(capability, config);

  // Fallback traversal order: Groq -> Cerebras -> Gemini -> OpenRouter
  const priorityQueue: AIProviderName[] = ["groq", "cerebras", "gemini", "openrouter"];
  const providersOrder: AIProviderName[] = [
    primaryProvider,
    ...priorityQueue.filter((p) => p !== primaryProvider),
  ];

  const startTime = Date.now();
  let lastError: any = null;

  for (let i = 0; i < providersOrder.length; i++) {
    const provider = providersOrder[i];
    const apiKeyName = `${provider}ApiKey` as keyof typeof config;
    const hasKey = Boolean(config[apiKeyName]);

    if (!hasKey) {
      continue;
    }

    try {
      const { data, modelId } = await attemptProviderExecution({
        provider,
        capability,
        systemPrompt,
        userPrompt,
        schema,
        timeoutMs: requestTimeout,
      });

      const durationMs = Date.now() - startTime;
      const usedFallback = provider !== primaryProvider;

      logAITelemetry({
        timestamp: new Date().toISOString(),
        capability,
        primaryProvider,
        selectedProvider: provider,
        model: modelId,
        durationMs,
        status: usedFallback ? "fallback_success" : "success",
      });

      return {
        data: data as z.infer<T>,
        provider,
        model: modelId,
        durationMs,
        usedFallback,
      };
    } catch (err) {
      const modelConfigKey = `${provider}Model` as keyof typeof config;
      const modelName = (config[modelConfigKey] as string) || "unknown";
      const normalizedErr = normalizeError(err, provider, modelName);

      if (!normalizedErr.retryable) {
        logAITelemetry({
          timestamp: new Date().toISOString(),
          capability,
          primaryProvider,
          selectedProvider: provider,
          model: normalizedErr.model,
          durationMs: Date.now() - startTime,
          status: "error",
          errorCategory: normalizedErr.category,
        });
        throw normalizedErr;
      }

      lastError = normalizedErr;
    }
  }

  // If all configured options are exhausted
  const errorToThrow = lastError || new AIProviderError({
    category: "UPSTREAM_FAILURE",
    provider: primaryProvider,
    model: "unknown",
    message: "All configured AI providers failed.",
    retryable: true,
  });

  logAITelemetry({
    timestamp: new Date().toISOString(),
    capability,
    primaryProvider,
    selectedProvider: primaryProvider,
    model: errorToThrow.model,
    durationMs: Date.now() - startTime,
    status: "error",
    errorCategory: errorToThrow.category,
  });

  throw errorToThrow;
}
