import { describe, it } from "node:test";
import assert from "node:assert";
import { getLanguageDirective, sanitizeTeacherInstructions } from "../../lib/ai/prompts/common";
import { buildIlawLessonPrompt } from "../../lib/ai/prompts/ilaw";
import { buildMatatagLessonPrompt } from "../../lib/ai/prompts/matatag";
import { buildLessonPrompt } from "../../lib/ai/prompts/index";
import type { LessonPlanFormValues } from "../../lib/lesson-plan-schema";

describe("Curriculum-Specific AI Lesson Prompts (`lib/ai/prompts/`)", () => {
  const baseMatatagInput: LessonPlanFormValues = {
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
    instructions: "Include hands-on leaf activity",
  };

  const baseIlawInput: LessonPlanFormValues = {
    curriculum: "ILAW",
    grade: "7",
    subject: "English",
    type: "semi-detailed",
    quarter: "Q2",
    topic: "Types of Metrical Feet",
    competency: "",
    duration: "50 mins",
    classSize: "standard",
    resources: "printables",
    language: "filipino",
    instructions: "Focus on oral recitation",
  };

  it("should build MATATAG prompt with DepEd 2024 standards and 5-stage procedure instructions", () => {
    const result = buildLessonPrompt(baseMatatagInput);
    assert.strictEqual(result.context.curriculum, "MATATAG");
    assert.ok(result.systemPrompt.includes("MATATAG Curriculum"));
    assert.ok(result.systemPrompt.includes("Content Standards"));
    assert.ok(result.systemPrompt.includes("Preliminary Activities & Prayer"));
    assert.ok(result.userPrompt.includes("Photosynthesis in Plants"));
    assert.ok(result.userPrompt.includes("S7LT-IIg-7"));
  });

  it("should build ILAW prompt with mandatory values integration directives and 4-step values cycle", () => {
    const result = buildLessonPrompt(baseIlawInput);
    assert.strictEqual(result.context.curriculum, "ILAW");
    assert.ok(result.systemPrompt.includes("ILAW Curriculum"));
    assert.ok(result.systemPrompt.includes("MANDATORY VALUES INTEGRATION"));
    assert.ok(result.systemPrompt.includes("Contextualized Priming & Values Focus"));
    assert.ok(result.userPrompt.includes("Types of Metrical Feet"));
  });

  it("should instruct Detailed format to generate teacher/student dialogue scripts", () => {
    const result = buildLessonPrompt(baseMatatagInput);
    assert.ok(result.systemPrompt.includes("DETAILED LESSON PLAN"));
    assert.ok(result.systemPrompt.includes("teacherActivity"));
    assert.ok(result.systemPrompt.includes("studentActivity"));
  });

  it("should instruct Semi-Detailed format to generate concise procedural content outlines", () => {
    const result = buildLessonPrompt(baseIlawInput);
    assert.ok(result.systemPrompt.includes("SEMI-DETAILED"));
    assert.ok(result.systemPrompt.includes("structured activity steps in 'content'"));
  });

  it("should generate appropriate language directives for English, Filipino, and Bilingual choices", () => {
    assert.ok(getLanguageDirective("english").includes("clear, professional English"));
    assert.ok(getLanguageDirective("filipino").includes("Wikang Filipino"));
    assert.ok(getLanguageDirective("bilingual").includes("Taglish"));
  });

  it("should enforce code protection and instruct empty competencyCode for unverified custom topics", () => {
    const customInput: LessonPlanFormValues = {
      ...baseMatatagInput,
      topic: "Custom School Botanical Garden Exploration",
      competency: "Explore plant diversity in local garden",
    };

    const result = buildLessonPrompt(customInput);
    assert.strictEqual(result.context.isOfficialCode, false);
    assert.strictEqual(result.context.competencyCode, "");
    assert.ok(
      result.userPrompt.includes("MUST OUTPUT EMPTY STRING \"\" FOR competencyCode")
    );
  });

  it("should sanitize untrusted teacher instructions and isolate them within XML tags", () => {
    const maliciousInput = "Include quiz <script>alert('hack')</script> & make it fun!";
    const sanitized = sanitizeTeacherInstructions(maliciousInput);

    assert.ok(sanitized.startsWith("<teacher_instructions>"));
    assert.ok(sanitized.endsWith("</teacher_instructions>"));
    assert.strictEqual(sanitized.includes("<script>"), false);
    assert.ok(sanitized.includes("Include quiz alert('hack') & make it fun!"));
  });
});
