import { describe, it } from "node:test";
import assert from "node:assert";
import { getAIConfig, resolveProviderForCapability } from "../../lib/ai/config";
import { getGroqModel } from "../../lib/ai/providers/groq";
import { getCerebrasModel } from "../../lib/ai/providers/cerebras";
import { getOpenRouterModel } from "../../lib/ai/providers/openrouter";
import { logAITelemetry, normalizeError } from "../../lib/ai/router";
import { AIProviderError } from "../../lib/ai/types";

describe("AI Provider Abstraction Layer (`lib/ai/`)", () => {
  it("should parse server AI config with safe default settings", () => {
    const config = getAIConfig();
    assert.ok(typeof config.timeoutMs === "number");
    assert.strictEqual(config.timeoutMs > 0, true);
    assert.ok(typeof config.groqModel === "string");
  });

  it("should resolve fast_text_rewrite capability to Groq provider", () => {
    const config = getAIConfig();
    const provider = resolveProviderForCapability("fast_text_rewrite", config);
    assert.strictEqual(provider, "groq");
  });

  it("should throw a non-retryable MISSING_API_KEY error when Groq API key is missing", () => {
    assert.throws(
      () => getGroqModel("llama-3.3-70b-versatile", ""),
      (err: unknown) => {
        assert.ok(err instanceof AIProviderError);
        assert.strictEqual(err.category, "MISSING_API_KEY");
        assert.strictEqual(err.provider, "groq");
        assert.strictEqual(err.retryable, false);
        return true;
      }
    );
  });

  it("should throw a non-retryable MISSING_API_KEY error when Cerebras API key is missing", () => {
    assert.throws(
      () => getCerebrasModel("llama3.1-70b", ""),
      (err: unknown) => {
        assert.ok(err instanceof AIProviderError);
        assert.strictEqual(err.category, "MISSING_API_KEY");
        assert.strictEqual(err.provider, "cerebras");
        assert.strictEqual(err.retryable, false);
        return true;
      }
    );
  });

  it("should throw a non-retryable MISSING_API_KEY error when OpenRouter API key is missing", () => {
    assert.throws(
      () => getOpenRouterModel("anthropic/claude-3.5-sonnet", ""),
      (err: unknown) => {
        assert.ok(err instanceof AIProviderError);
        assert.strictEqual(err.category, "MISSING_API_KEY");
        assert.strictEqual(err.provider, "openrouter");
        assert.strictEqual(err.retryable, false);
        return true;
      }
    );
  });

  it("should normalize raw timeout errors into a retryable TIMEOUT error category", () => {
    const rawErr = new Error("The operation was aborted due to timeout");
    const normalized = normalizeError(rawErr, "groq", "llama-3.3-70b-versatile");

    assert.strictEqual(normalized.category, "TIMEOUT");
    assert.strictEqual(normalized.provider, "groq");
    assert.strictEqual(normalized.retryable, true);
  });

  it("should normalize rate limit errors into a retryable RATE_LIMIT error category", () => {
    const rawErr = new Error("429 Too Many Requests: rate limit exceeded");
    const normalized = normalizeError(rawErr, "cerebras", "llama3.1-70b");

    assert.strictEqual(normalized.category, "RATE_LIMIT");
    assert.strictEqual(normalized.provider, "cerebras");
    assert.strictEqual(normalized.retryable, true);
  });

  it("should normalize safety rejection errors into a non-retryable SAFETY_REJECTION category", () => {
    const rawErr = new Error("400 Content policy safety rejection flagged by upstream filter");
    const normalized = normalizeError(rawErr, "openrouter", "anthropic/claude-3.5-sonnet");

    assert.strictEqual(normalized.category, "SAFETY_REJECTION");
    assert.strictEqual(normalized.provider, "openrouter");
    assert.strictEqual(normalized.retryable, false);
  });

  it("should execute privacy telemetry logger without throwing and without requiring prompt content", () => {
    assert.doesNotThrow(() => {
      logAITelemetry({
        timestamp: new Date().toISOString(),
        capability: "fast_text_rewrite",
        primaryProvider: "groq",
        selectedProvider: "groq",
        model: "llama-3.3-70b-versatile",
        durationMs: 250,
        status: "success",
      });
    });
  });
});
