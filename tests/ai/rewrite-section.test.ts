import { describe, it } from "node:test";
import assert from "node:assert";
import { useLessonStore } from "../../stores/lesson-store";
import type { LessonPlan } from "../../schemas/lesson";

describe("Section-Level AI Actions & Non-Mutation Rules (`lib/ai/rewrite-section.ts`)", () => {
  const initialLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "section-action-test-01",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Section Action Unit Test Lesson",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    week: "Week 1",
    duration: "60 mins",
    standards: {
      contentStandard: "Original Content Standard",
      learningCompetency: "Original Competency",
      competencyCode: "S7LT-IIg-7",
    },
    objectives: ["Original Objective 1", "Original Objective 2"],
    subjectMatter: {
      topic: "Plant Respiration",
      references: ["Book 1"],
      materials: ["Chart"],
      valuesIntegration: ["Stewardship"],
    },
    procedures: [
      {
        id: "proc-101",
        title: "Stage 1: Motivation",
        teacherActivity: "Original Teacher Script",
        studentActivity: "Original Student Response",
        content: "Intro",
      },
    ],
    assessment: [
      {
        id: "eval-101",
        type: "multiple_choice",
        question: "Original Question?",
        choices: ["Choice A", "Choice B"],
        answer: "Choice A",
        points: 1,
      },
    ],
    assignment: "Original Assignment",
    reflection: "Original Reflection",
  };

  it("should update ONLY the target objectives section without mutating unrelated sections", () => {
    const store = useLessonStore.getState();
    store.setActiveLesson(initialLesson);

    const updatedObjectives = ["Simplified Objective 1", "Simplified Objective 2"];
    store.updateSection("objectives", updatedObjectives);

    const state = useLessonStore.getState();
    assert.strictEqual(state.isDirty, true);
    assert.deepStrictEqual(state.activeLesson?.objectives, updatedObjectives);

    // CRITICAL UNMUTATED SECTION CHECKS
    assert.strictEqual(state.activeLesson?.title, "Section Action Unit Test Lesson");
    assert.strictEqual(state.activeLesson?.standards?.competencyCode, "S7LT-IIg-7");
    assert.strictEqual(state.activeLesson?.procedures[0].id, "proc-101");
    assert.strictEqual(state.activeLesson?.procedures[0].teacherActivity, "Original Teacher Script");
    assert.strictEqual(state.activeLesson?.assessment![0].question, "Original Question?");
    assert.strictEqual(state.activeLesson?.assignment, "Original Assignment");
  });

  it("should restore previous section content on undo trigger", () => {
    const store = useLessonStore.getState();
    store.setActiveLesson(initialLesson);

    const previousObjectives = [...initialLesson.objectives];

    // Simulate user applying AI rewrite
    store.updateSection("objectives", ["Rewritten AI Objective Target"]);
    assert.deepStrictEqual(useLessonStore.getState().activeLesson?.objectives, ["Rewritten AI Objective Target"]);

    // Simulate Undo action
    store.updateSection("objectives", previousObjectives);
    assert.deepStrictEqual(useLessonStore.getState().activeLesson?.objectives, ["Original Objective 1", "Original Objective 2"]);
  });

  it("should preserve stable procedure block IDs during section updates", () => {
    const store = useLessonStore.getState();
    store.setActiveLesson(initialLesson);

    const currentProcedures = store.activeLesson?.procedures || [];

    const updatedProcedures = [
      {
        ...currentProcedures[0],
        teacherActivity: "Expanded Detailed Teacher Activity Script",
      },
    ];

    store.updateSection("procedures", updatedProcedures);

    const state = useLessonStore.getState();
    assert.strictEqual(state.activeLesson?.procedures[0].id, "proc-101");
    assert.strictEqual(
      state.activeLesson?.procedures[0].teacherActivity,
      "Expanded Detailed Teacher Activity Script"
    );
  });
});
