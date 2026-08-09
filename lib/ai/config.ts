if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import type { AICapability, AIProviderName } from "./types";

export type AIConfig = {
  groqApiKey: string;
  cerebrasApiKey: string;
  openrouterApiKey: string;
  geminiApiKey: string;
  groqModel: string;
  cerebrasModel: string;
  openrouterModel: string;
  geminiModel: string;
  defaultPrimaryProvider: AIProviderName;
  defaultFallbackProvider: AIProviderName;
  timeoutMs: number;
};

/**
 * Returns server-side AI configuration from environment variables.
 */
export function getAIConfig(): AIConfig {
  const parseTimeout = (val: string | undefined, fallback: number): number => {
    if (!val) return fallback;
    const num = parseInt(val, 10);
    return isNaN(num) || num <= 0 ? fallback : num;
  };

  return {
    groqApiKey: process.env.GROQ_API_KEY || "",
    cerebrasApiKey: process.env.CEREBRAS_API_KEY || "",
    openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    cerebrasModel: process.env.CEREBRAS_MODEL || "llama3.1-70b",
    openrouterModel: process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet",
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    defaultPrimaryProvider: (process.env.DEFAULT_PRIMARY_PROVIDER as AIProviderName) || "groq",
    defaultFallbackProvider: (process.env.DEFAULT_FALLBACK_PROVIDER as AIProviderName) || "openrouter",
    timeoutMs: parseTimeout(process.env.AI_REQUEST_TIMEOUT_MS, 30000),
  };
}

/**
 * Determines the default primary provider for a given capability.
 */
export function resolveProviderForCapability(
  capability: AICapability,
  config: AIConfig
): AIProviderName {
  switch (capability) {
    case "fast_text_rewrite":
      return "groq";
    case "structured_lesson_generation":
      return config.cerebrasApiKey ? "cerebras" : config.groqApiKey ? "groq" : "openrouter";
    case "assessment_generation":
    case "worksheet_generation":
    case "rubric_generation":
    case "presentation_generation":
      return config.groqApiKey ? "groq" : "openrouter";
    default:
      return config.defaultPrimaryProvider;
  }
}
