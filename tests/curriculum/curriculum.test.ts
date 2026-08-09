import { describe, it } from "node:test";
import assert from "node:assert";
import { getCurriculumConfig, ILAW_CONFIG, MATATAG_CONFIG } from "../../lib/curriculum/config";
import { findCurriculumRecords, getCurriculumProvenance, getVerifiedCompetencyCode } from "../../lib/curriculum/lookup";
import { assembleCurriculumContext } from "../../lib/curriculum/adapter";
import type { LessonPlanFormValues } from "../../lib/lesson-plan-schema";

describe("Curriculum Data Foundation (`lib/curriculum/`)", () => {
  it("should provide distinct typed configurations for MATATAG and ILAW", () => {
    const matatag = getCurriculumConfig("MATATAG");
    const ilaw = getCurriculumConfig("ILAW");

    assert.strictEqual(matatag.id, "MATATAG");
    assert.strictEqual(ilaw.id, "ILAW");

    assert.strictEqual(matatag.requiresValuesIntegration, false);
    assert.strictEqual(ilaw.requiresValuesIntegration, true);

    assert.strictEqual(matatag.supportsOfficialCodes, true);
    assert.strictEqual(ilaw.supportsOfficialCodes, false);

    assert.notStrictEqual(
      matatag.terminology.procedureFrameworkName,
      ilaw.terminology.procedureFrameworkName
    );
  });

  it("should validate ILAW mandatory values integration requirement", () => {
    const validIlawLesson = {
      title: "Sample ILAW Lesson",
      subjectMatter: {
        topic: "Poetry",
        valuesIntegration: ["Appreciation for local culture"],
      },
    };
    const invalidIlawLesson = {
      title: "Sample ILAW Lesson",
      subjectMatter: {
        topic: "Poetry",
        valuesIntegration: [],
      },
    };

    assert.strictEqual(ILAW_CONFIG.validateLessonPlan(validIlawLesson).valid, true);
    assert.strictEqual(ILAW_CONFIG.validateLessonPlan(invalidIlawLesson).valid, false);
  });

  it("should lookup verified records and expose source reference provenance", () => {
    const matches = findCurriculumRecords({
      curriculum: "MATATAG",
      gradeLevel: "Grade 7",
      subject: "Science",
      topicSearch: "Photosynthesis",
    });

    assert.strictEqual(matches.length >= 1, true);
    const match = matches[0];
    assert.strictEqual(match.competencyCode, "S7LT-IIg-7");
    assert.strictEqual(match.verificationStatus, "VERIFIED_DEPED_OFFICIAL");
    assert.strictEqual(match.isOfficialCode, true);
    assert.ok(match.sourceReference.includes("DepEd MATATAG"));
  });

  it("should return undefined for unverified competency code queries and never fabricate fake codes", () => {
    const code = getVerifiedCompetencyCode(
      "MATATAG",
      "Grade 7",
      "Science",
      "Quantum Particle Physics in Grade 7"
    );

    assert.strictEqual(code, undefined, "Unverified topic must return undefined competencyCode.");

    const provenance = getCurriculumProvenance(
      "MATATAG",
      "Grade 7",
      "Science",
      "Quantum Particle Physics in Grade 7"
    );

    assert.strictEqual(provenance.verificationStatus, "UNVERIFIED_TEACHER_DRAFT");
    assert.strictEqual(provenance.isOfficialCode, false);
  });

  it("should assemble structured curriculum context for verified inputs", () => {
    const input: LessonPlanFormValues = {
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
      instructions: "",
    };

    const ctx = assembleCurriculumContext(input);
    assert.strictEqual(ctx.curriculum, "MATATAG");
    assert.strictEqual(ctx.competencyCode, "S7LT-IIg-7");
    assert.strictEqual(ctx.isOfficialCode, true);
    assert.strictEqual(ctx.verificationStatus, "VERIFIED_DEPED_OFFICIAL");
    assert.ok(ctx.competencyText.includes("photosynthesis"));
  });

  it("should safely handle custom teacher inputs without claiming official status or fabricating codes", () => {
    const input: LessonPlanFormValues = {
      curriculum: "ILAW",
      grade: "7",
      subject: "Science",
      type: "semi-detailed",
      quarter: "Q1",
      topic: "Custom Localized Hydroponics Activity",
      competency: "Build a mini hydroponics kit using recycled bottles",
      duration: "50 mins",
      classSize: "standard",
      resources: "printables",
      language: "filipino",
      instructions: "Focus on group work",
    };

    const ctx = assembleCurriculumContext(input);
    assert.strictEqual(ctx.curriculum, "ILAW");
    assert.strictEqual(ctx.competencyCode, "", "Custom input must have empty competencyCode.");
    assert.strictEqual(ctx.isOfficialCode, false);
    assert.strictEqual(ctx.verificationStatus, "UNVERIFIED_TEACHER_DRAFT");
    assert.strictEqual(ctx.valuesIntegrationRequired, true);
  });
});
