import { describe, it } from "node:test";
import assert from "node:assert";
import { LocalStorageAdapter } from "../../lib/persistence/local-adapter";
import { useLessonStore } from "../../stores/lesson-store";
import type { LessonPlan } from "../../schemas/lesson";

describe("Lesson Draft State & Routing (`stores/lesson-store.ts`)", () => {
  const mockLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "lesson-store-test-01",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Initial Store Test Lesson",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    week: "Week 1",
    duration: "60 mins",
    standards: {
      contentStandard: "Content standard",
      learningCompetency: "Learning competency",
      competencyCode: "S7LT-IIg-7",
    },
    objectives: ["Objective 1"],
    subjectMatter: {
      topic: "Plant Respiration",
      references: ["Ref 1"],
      materials: ["Chart"],
      valuesIntegration: ["Environmental stewardship"],
    },
    procedures: [
      {
        id: "proc-1",
        title: "Introduction",
        teacherActivity: "Teacher asks question.",
        studentActivity: "Students respond.",
        content: "Intro",
      },
    ],
    assessment: [
      {
        id: "eval-1",
        type: "multiple_choice",
        question: "What is photosynthesis?",
        choices: ["Process A", "Process B"],
        answer: "Process A",
        points: 1,
      },
    ],
    assignment: "Study notes.",
    reflection: "Good overall.",
  };

  it("should initialize store state, set storage adapter, and load active lesson", async () => {
    const adapter = new LocalStorageAdapter();
    await adapter.saveLesson(mockLesson);

    const store = useLessonStore.getState();
    store.setStorageAdapter(adapter);

    await store.loadLesson("lesson-store-test-01");

    const state = useLessonStore.getState();
    assert.ok(state.activeLesson !== null);
    assert.strictEqual(state.activeLesson?.title, "Initial Store Test Lesson");
    assert.strictEqual(state.isDirty, false);
    assert.strictEqual(state.isLoading, false);
    assert.strictEqual(state.errorState, null);
  });

  it("should update section and toggle isDirty flag to true", () => {
    const store = useLessonStore.getState();
    store.updateSection("title", "Updated Store Lesson Title");

    const state = useLessonStore.getState();
    assert.strictEqual(state.activeLesson?.title, "Updated Store Lesson Title");
    assert.strictEqual(state.isDirty, true);
  });

  it("should save active lesson and reset isDirty flag to false", async () => {
    const store = useLessonStore.getState();
    await store.saveActiveLesson();

    const state = useLessonStore.getState();
    assert.strictEqual(state.isDirty, false);
    assert.strictEqual(state.activeLesson?.title, "Updated Store Lesson Title");
  });

  it("should handle non-existent IDs cleanly by setting errorState", async () => {
    const store = useLessonStore.getState();
    await store.loadLesson("non-existent-id-999");

    const state = useLessonStore.getState();
    assert.strictEqual(state.activeLesson, null);
    assert.ok(state.errorState !== null);
    assert.ok(state.errorState.includes("not found"));
  });
});
