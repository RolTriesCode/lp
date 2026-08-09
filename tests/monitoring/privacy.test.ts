import assert from "node:assert";
import { describe, it } from "node:test";
import { sanitizeProductEvent } from "../../lib/monitoring/analytics";
import { isSentryEnabled, isVercelObservabilityEnabled, monitoringEnvironment, monitoringRelease } from "../../lib/monitoring/config";
import { sanitizeCoarsePageEvent, sanitizeSentryEvent } from "../../lib/monitoring/privacy";

function restoreEnvironmentValue(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("privacy-conscious monitoring", () => {
  it("rebuilds error events without request, profile, lesson, prompt, or document data", () => {
    const event = sanitizeSentryEvent({
      breadcrumbs: [{ message: "secret lesson title" }],
      contexts: {
        nextjs: {
          request_path: "/lesson/lesson-private-id?topic=photosynthesis",
          router_kind: "App Router",
          router_path: "/lesson/lesson-private-id",
          route_type: "render",
        },
      },
      exception: {
        values: [{
          stacktrace: { frames: [{ filename: "app/lesson/page.tsx", vars: { prompt: "ignore system" } }] },
          type: "ProviderError",
          value: "Generated output and teacher instruction leaked here",
        }],
      },
      extra: { lesson: "raw lesson content", uploadedDocumentText: "private PDF" },
      request: {
        cookies: "access-token=secret",
        data: { prompt: "provider prompt" },
        headers: { authorization: "Bearer secret" },
        method: "POST",
        query_string: "teacher=private",
        url: "https://app.example/lesson/lesson-private-id?teacher=private",
      },
      tags: { area: "lesson_generation", teacher_name: "Private Teacher" },
      user: { email: "teacher@example.edu.ph", name: "Private Teacher" },
    });

    const serialized = JSON.stringify(event);
    ["secret lesson title", "raw lesson content", "private PDF", "provider prompt", "Bearer secret", "teacher@example.edu.ph", "Private Teacher", "ignore system", "lesson-private-id"].forEach((value) => {
      assert.strictEqual(serialized.includes(value), false, `Leaked monitoring value: ${value}`);
    });
    assert.match(serialized, /Application error \(details redacted\)/);
    assert.match(serialized, /\/lesson\/\[id\]/);
  });

  it("removes query strings and dynamic IDs from coarse page and vital events", () => {
    assert.deepStrictEqual(
      sanitizeCoarsePageEvent({ type: "pageview", url: "https://app.example/lesson/private-id?selected=secret" }),
      { type: "pageview", url: "/lesson/[id]" },
    );
    assert.strictEqual(sanitizeCoarsePageEvent({ type: "pageview", url: "/auth/callback?code=secret" }), null);
    assert.strictEqual(sanitizeCoarsePageEvent({ type: "vital", url: "/api/ai/lesson" }), null);
  });

  it("accepts only the documented content-free product event vocabulary", () => {
    assert.deepStrictEqual(
      sanitizeProductEvent("lesson_generation_started", {
        curriculum: "MATATAG",
        lesson_type: "detailed",
        topic: "must not leave the app",
      }),
      {
        name: "lesson_generation_started",
        properties: { curriculum: "MATATAG", lesson_type: "detailed" },
      },
    );
    assert.strictEqual(sanitizeProductEvent("lesson_created", { lesson_id: "private" }), null);
    assert.deepStrictEqual(
      sanitizeProductEvent("lesson_generation_failed", { category: "provider leaked text" }),
      { name: "lesson_generation_failed", properties: { category: "UPSTREAM_FAILURE" } },
    );
  });

  it("separates monitoring environments and release identifiers", () => {
    const previousEnvironment = process.env.NEXT_PUBLIC_APP_ENV;
    const previousRelease = process.env.NEXT_PUBLIC_SENTRY_RELEASE;
    process.env.NEXT_PUBLIC_APP_ENV = "preview";
    process.env.NEXT_PUBLIC_SENTRY_RELEASE = "commit-abc123";

    try {
      assert.strictEqual(monitoringEnvironment(), "preview");
      assert.strictEqual(monitoringRelease(), "commit-abc123");
    } finally {
      if (previousEnvironment === undefined) delete process.env.NEXT_PUBLIC_APP_ENV;
      else process.env.NEXT_PUBLIC_APP_ENV = previousEnvironment;
      if (previousRelease === undefined) delete process.env.NEXT_PUBLIC_SENTRY_RELEASE;
      else process.env.NEXT_PUBLIC_SENTRY_RELEASE = previousRelease;
    }
  });

  it("keeps monitoring disabled in the default local environments", () => {
    const previous = {
      analytics: process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED,
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NEXT_PUBLIC_SENTRY_ENABLED,
      environment: process.env.NEXT_PUBLIC_APP_ENV,
    };
    process.env.NEXT_PUBLIC_APP_ENV = "development";
    process.env.NEXT_PUBLIC_SENTRY_ENABLED = "true";
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://public@example.ingest.sentry.io/1";
    process.env.NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED = "true";

    try {
      assert.strictEqual(isSentryEnabled(), false);
      assert.strictEqual(isVercelObservabilityEnabled(), false);
    } finally {
      restoreEnvironmentValue("NEXT_PUBLIC_VERCEL_ANALYTICS_ENABLED", previous.analytics);
      restoreEnvironmentValue("NEXT_PUBLIC_SENTRY_DSN", previous.dsn);
      restoreEnvironmentValue("NEXT_PUBLIC_SENTRY_ENABLED", previous.enabled);
      restoreEnvironmentValue("NEXT_PUBLIC_APP_ENV", previous.environment);
    }
  });
});
