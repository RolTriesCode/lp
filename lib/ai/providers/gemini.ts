if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import { createGoogle } from "@ai-sdk/google";
import { getAIConfig } from "../config";
import { AIProviderError } from "../types";

export function getGeminiModel(modelId?: string, apiKeyOverride?: string) {
  const config = getAIConfig();
  const apiKey = apiKeyOverride !== undefined ? apiKeyOverride : config.geminiApiKey;
  const model = modelId || config.geminiModel;

  if (!apiKey) {
    throw new AIProviderError({
      category: "MISSING_API_KEY",
      provider: "gemini",
      model,
      message: "Gemini API key is not configured.",
      retryable: false,
    });
  }

  const google = createGoogle({ apiKey });
  return {
    model: google(model),
    providerName: "gemini" as const,
    modelId: model,
  };
}
