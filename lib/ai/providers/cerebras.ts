if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import { createOpenAI } from "@ai-sdk/openai";
import { getAIConfig } from "../config";
import { AIProviderError } from "../types";

export function getCerebrasModel(modelId?: string, apiKeyOverride?: string) {
  const config = getAIConfig();
  const apiKey = apiKeyOverride !== undefined ? apiKeyOverride : config.cerebrasApiKey;
  const model = modelId || config.cerebrasModel;

  if (!apiKey) {
    throw new AIProviderError({
      category: "MISSING_API_KEY",
      provider: "cerebras",
      model,
      message: "Cerebras API key is not configured.",
      retryable: false,
    });
  }

  const cerebras = createOpenAI({
    baseURL: "https://api.cerebras.ai/v1",
    apiKey,
  });

  return {
    model: cerebras(model),
    providerName: "cerebras" as const,
    modelId: model,
  };
}
