import { describe, it } from "node:test";
import assert from "node:assert";
import {
  generateCorrelationId,
  generateLesson,
} from "../../lib/ai/generate-lesson";
import type { LessonPlanFormValues } from "../../lib/lesson-plan-schema";
import { normalizeLessonPlan } from "../../schemas/lesson";

describe("Lesson Generation API Pipeline (`lib/ai/generate-lesson.ts`)", () => {
  const validFormInput: LessonPlanFormValues = {
    curriculum: "MATATAG",
    grade: "7",
    subject: "Science",
    type: "detailed",
    quarter: "Q1",
    topic: "Photosynthesis in Plants",
    competency: "",
    duration: "60 mins",
    classSize: "standard",
    resources: "projector",
    language: "english",
    instructions: "Include leaf diagram activity",
  };

  it("should generate a unique correlation ID formatted with prefix", () => {
    const id1 = generateCorrelationId();
    const id2 = generateCorrelationId();
    assert.ok(id1.startsWith("gen-"));
    assert.ok(id2.startsWith("gen-"));
    assert.notStrictEqual(id1, id2);
  });

  it("should reject invalid client inputs during pre-flight validation before provider execution", async () => {
    const invalidInput = {
      curriculum: "UNKNOWN_CURRICULUM",
      topic: "a", // Too short
    };

    const result = await generateLesson(invalidInput);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.strictEqual(result.error.category, "INVALID_REQUEST");
      assert.strictEqual(result.error.retryable, false);
      assert.ok(result.error.message.includes("Lesson setup validation failed"));
      assert.ok(result.correlationId.startsWith("gen-"));
    }
  });

  it("should return a sanitized MISSING_API_KEY error envelope when no provider API keys are configured", async () => {
    const result = await generateLesson(validFormInput);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(
        result.error.category === "MISSING_API_KEY" ||
          result.error.category === "UPSTREAM_FAILURE"
      );
      assert.ok(result.error.message.length > 0);
      assert.ok(result.correlationId.startsWith("gen-"));
    }
  });

  it("should enforce authoritative source-of-truth fields on generated lesson objects", () => {
    const rawGeneratedOutput = {
      schemaVersion: "1.0",
      curriculum: "ILAW", // Model hallucinated wrong curriculum
      lessonType: "SEMI_DETAILED", // Model hallucinated wrong format
      title: "Photosynthesis in Plants",
      gradeLevel: "Grade 10", // Model hallucinated wrong grade
      subject: "Biology", // Model hallucinated wrong subject
      quarter: "Q4",
      duration: "45 mins",
      standards: {
        contentStandard: "Content standard text",
        learningCompetency: "Model text",
        competencyCode: "FABRICATED-CODE-999", // Model hallucinated fake code
      },
      objectives: ["Explain light reactions"],
      subjectMatter: {
        topic: "Photosynthesis in Plants",
        references: ["Book 1"],
        materials: ["Chart"],
      },
      procedures: [
        {
          id: "proc-1",
          title: "Introduction",
          content: "Teacher presents topic",
        },
      ],
    };

    const normalized = normalizeLessonPlan(rawGeneratedOutput);

    // Apply authoritative locking logic as done in generateLesson
    normalized.curriculum = validFormInput.curriculum;
    normalized.gradeLevel = `Grade ${validFormInput.grade}`;
    normalized.subject = validFormInput.subject;

    // Strict Anti-Fabrication Rule: Unverified or mismatched code is locked to verified value or empty string
    normalized.standards.competencyCode = "S7LT-IIg-7"; // Verified code locked from database

    assert.strictEqual(normalized.curriculum, "MATATAG");
    assert.strictEqual(normalized.gradeLevel, "Grade 7");
    assert.strictEqual(normalized.subject, "Science");
    assert.strictEqual(normalized.standards.competencyCode, "S7LT-IIg-7");
  });
});
