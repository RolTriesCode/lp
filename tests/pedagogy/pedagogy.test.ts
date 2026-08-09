import { describe, it } from "node:test";
import assert from "node:assert";
import {
  checkCurriculumAlignment,
  detectBloomLevel,
  validateObjectives,
} from "../../lib/pedagogy/analysis";
import { buildTeachingSlides } from "../../lib/pedagogy/presentation";
import { validateSectionSuggestion } from "../../lib/pedagogy/suggestions";
import { buildPresentationUserPrompt } from "../../lib/ai/prompts/presentation";
import { normalizeLessonPlan, type LessonPlan } from "../../schemas/lesson";
import {
  BloomTaxonomyLevelSchema,
  DifferentiationSuggestionDraftSchema,
} from "../../schemas/pedagogy";

function createLesson(overrides: Partial<LessonPlan> = {}): LessonPlan {
  return normalizeLessonPlan({
    schemaVersion: "1.0",
    id: "pedagogy-test-lesson",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Photosynthesis reactions",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    week: "Week 1",
    duration: "60 mins",
    standards: {
      contentStandard: "Plant cells transform radiant energy into chemical energy.",
      learningCompetency:
        "Differentiate the light-dependent and light-independent reactions of photosynthesis in plant cells.",
      competencyCode: "S7LT-IIg-7",
    },
    objectives: [
      "Differentiate light-dependent and light-independent photosynthesis reactions using a comparison table.",
    ],
    subjectMatter: {
      topic: "Photosynthesis in Plants",
      references: ["DepEd MATATAG Science 7 Curriculum Guide"],
      materials: ["Reaction cards"],
      valuesIntegration: ["Care for living systems"],
    },
    procedures: [
      {
        id: "procedure-1",
        title: "Compare the reactions",
        teacherActivity: "Model a comparison of light-dependent and light-independent reactions.",
        studentActivity: "Differentiate the photosynthesis reactions in a comparison table.",
        content: "Compare both photosynthesis reactions.",
      },
    ],
    assessment: [
      {
        id: "assessment-1",
        type: "essay",
        question: "Differentiate light-dependent and light-independent photosynthesis reactions.",
        choices: [],
        answer: "A correct comparison names inputs, outputs, and location.",
        points: 4,
      },
    ],
    assignment: "Create a reaction flow diagram.",
    reflection: "Review evidence after teaching.",
    curriculumProvenance: {
      recordId: "rec-matatag-sci7-photosynthesis",
      verificationStatus: "VERIFIED_DEPED_OFFICIAL",
      sourceReference: "DepEd MATATAG Science 7 Curriculum Guide (2024), p. 42",
    },
    privateTeacherNotes: [
      {
        id: "1027e574-b4c8-4d8d-9a2e-778981a7273d",
        section: "procedures",
        text: "PRIVATE PEDAGOGY SENTINEL",
        createdAt: "2026-08-09T08:00:00.000Z",
        updatedAt: "2026-08-09T08:00:00.000Z",
      },
    ],
    ...overrides,
  });
}

describe("Pedagogy schemas and deterministic services", () => {
  it("accepts only the six canonical Bloom taxonomy values", () => {
    assert.deepStrictEqual(BloomTaxonomyLevelSchema.options, [
      "remember",
      "understand",
      "apply",
      "analyze",
      "evaluate",
      "create",
    ]);
    assert.strictEqual(BloomTaxonomyLevelSchema.safeParse("analyze").success, true);
    assert.strictEqual(BloomTaxonomyLevelSchema.safeParse("analysing").success, false);
    assert.strictEqual(BloomTaxonomyLevelSchema.safeParse("higher-order").success, false);
  });

  it("flags an unsupported competency code without treating alignment as certification", () => {
    const lesson = createLesson({
      standards: {
        learningCompetency:
          "Differentiate the light-dependent and light-independent reactions of photosynthesis in plant cells.",
        competencyCode: "S7LT-FAKE-99",
      },
    });
    const report = checkCurriculumAlignment(lesson);

    assert.strictEqual(report.verificationState, "unsupported_claim");
    assert.strictEqual(
      report.checks.find((check) => check.dimension === "competency_claim")?.status,
      "fail"
    );
    assert.match(report.disclaimer, /not official curriculum certification/i);
  });

  it("recognizes a verified scoped competency and reports objective criteria", () => {
    const lesson = createLesson();
    const alignment = checkCurriculumAlignment(lesson);
    const objectives = validateObjectives(lesson);

    assert.strictEqual(alignment.verificationState, "verified");
    assert.strictEqual(
      alignment.checks.find((check) => check.dimension === "competency_claim")?.status,
      "pass"
    );
    assert.strictEqual(detectBloomLevel(lesson.objectives[0]), "analyze");
    assert.strictEqual(objectives.items[0].findings.length, 4);
    assert.deepStrictEqual(
      objectives.items[0].findings.map((finding) => finding.criterion),
      ["measurability", "clarity", "grade_appropriateness", "assessment_alignment"]
    );
  });

  it("rejects differentiation suggestions that use stigmatizing learner labels", () => {
    const unsafe = DifferentiationSuggestionDraftSchema.safeParse({
      category: "learner_readiness",
      title: "Support for slow learners",
      strategy: "Give slow learners a separate worksheet with fewer opportunities to participate.",
      rationale: "This groups learners by perceived ability.",
      appliesTo: ["procedures"],
      bloomLevels: ["understand"],
    });
    const safe = DifferentiationSuggestionDraftSchema.safeParse({
      category: "learner_readiness",
      title: "Optional worked-example pathway",
      strategy: "Offer any learner a worked example before the independent comparison task.",
      rationale: "An optional entry point preserves the shared learning goal.",
      appliesTo: ["procedures"],
      bloomLevels: ["understand", "analyze"],
    });

    assert.strictEqual(unsafe.success, false);
    assert.strictEqual(safe.success, true);
  });

  it("validates a proposed section while preserving every unrelated lesson section", () => {
    const lesson = createLesson();
    const before = structuredClone(lesson);
    const proposedObjectives = validateSectionSuggestion("objectives", [
      "Analyze photosynthesis reaction evidence using a labeled comparison table.",
    ]) as string[];
    const updated = normalizeLessonPlan({ ...lesson, objectives: proposedObjectives });

    assert.deepStrictEqual(updated.objectives, proposedObjectives);
    assert.deepStrictEqual(updated.procedures, before.procedures);
    assert.deepStrictEqual(updated.assessment, before.assessment);
    assert.deepStrictEqual(updated.privateTeacherNotes, before.privateTeacherNotes);
    assert.throws(() => validateSectionSuggestion("objectives", []));
  });

  it("builds presentation slides without private notes or lesson mutation", () => {
    const lesson = createLesson();
    const before = structuredClone(lesson);
    const slides = buildTeachingSlides(lesson);

    assert.ok(slides.length >= 5);
    assert.strictEqual(JSON.stringify(slides).includes("PRIVATE PEDAGOGY SENTINEL"), false);
    assert.deepStrictEqual(lesson, before);
    assert.strictEqual(slides.some((slide) => slide.kind === "assessment"), true);
  });

  it("keeps private notes out of student-facing AI presentation context", () => {
    const prompt = buildPresentationUserPrompt(createLesson(), "classroom");

    assert.match(prompt, /Photosynthesis reactions/);
    assert.doesNotMatch(prompt, /PRIVATE PEDAGOGY SENTINEL/);
    assert.doesNotMatch(prompt, /privateTeacherNotes/);
  });
});
