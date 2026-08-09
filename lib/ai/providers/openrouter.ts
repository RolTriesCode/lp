if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import { createOpenAI } from "@ai-sdk/openai";
import { getAIConfig } from "../config";
import { AIProviderError } from "../types";

export function getOpenRouterModel(modelId?: string, apiKeyOverride?: string) {
  const config = getAIConfig();
  const apiKey = apiKeyOverride !== undefined ? apiKeyOverride : config.openrouterApiKey;
  const model = modelId || config.openrouterModel;

  if (!apiKey) {
    throw new AIProviderError({
      category: "MISSING_API_KEY",
      provider: "openrouter",
      model,
      message: "OpenRouter API key is not configured.",
      retryable: false,
    });
  }

  const openrouter = createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });

  return {
    model: openrouter(model),
    providerName: "openrouter" as const,
    modelId: model,
  };
}
