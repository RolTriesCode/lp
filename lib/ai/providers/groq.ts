if (typeof window !== "undefined") {
  throw new Error("AI provider modules cannot be imported in client components.");
}

import { createGroq } from "@ai-sdk/groq";
import { getAIConfig } from "../config";
import { AIProviderError } from "../types";

export function getGroqModel(modelId?: string, apiKeyOverride?: string) {
  const config = getAIConfig();
  const apiKey = apiKeyOverride !== undefined ? apiKeyOverride : config.groqApiKey;
  const model = modelId || config.groqModel;

  if (!apiKey) {
    throw new AIProviderError({
      category: "MISSING_API_KEY",
      provider: "groq",
      model,
      message: "Groq API key is not configured.",
      retryable: false,
    });
  }

  const groq = createGroq({ apiKey });
  return {
    model: groq(model),
    providerName: "groq" as const,
    modelId: model,
  };
}
