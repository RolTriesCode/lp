import { describe, it } from "node:test";
import assert from "node:assert";
import { getAIConfig } from "../../lib/ai/config";
import { getGeminiModel } from "../../lib/ai/providers/gemini";
import { AIProviderError } from "../../lib/ai/types";

describe("Google Gemini Provider Adapter (`lib/ai/providers/gemini.ts`)", () => {
  it("should parse server AI config structure correctly", () => {
    const config = getAIConfig();
    assert.strictEqual(config.geminiModel, "gemini-2.5-flash");
    assert.ok(typeof config.geminiApiKey === "string");
  });

  it("should throw MISSING_API_KEY when instantiated without an API key override", () => {
    assert.throws(
      () => {
        getGeminiModel("gemini-2.5-flash", "");
      },
      (err: any) => {
        return err instanceof AIProviderError && err.category === "MISSING_API_KEY" && err.provider === "gemini";
      }
    );
  });

  it("should successfully return model definition for correct inputs", () => {
    const modelRef = getGeminiModel("gemini-2.5-flash", "test-api-key");
    assert.strictEqual(modelRef.providerName, "gemini");
    assert.strictEqual(modelRef.modelId, "gemini-2.5-flash");
    assert.ok(modelRef.model !== undefined);
  });
});
