import { describe, it } from "node:test";
import assert from "node:assert";
import { LocalStorageAdapter } from "../../lib/persistence/local-adapter";
import { useLessonStore } from "../../stores/lesson-store";
import type { LessonPlan } from "../../schemas/lesson";

describe("Prototype Lesson Library Lifecycle (`stores/lesson-store.ts`)", () => {
  const testLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "lib-test-id-01",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Library Lifecycle Lesson",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    week: "Week 1",
    duration: "60 mins",
    standards: {
      contentStandard: "Content standard",
      learningCompetency: "Competency text",
      competencyCode: "S7LT-IIg-7",
    },
    objectives: ["Objective 1"],
    subjectMatter: {
      topic: "Cell Structures",
      references: ["Ref 1"],
      materials: ["Microscope"],
      valuesIntegration: ["Scientific inquiry"],
    },
    procedures: [
      {
        id: "proc-999",
        title: "Stage 1",
        teacherActivity: "Explain cells.",
        studentActivity: "Listen.",
        content: "Intro",
      },
    ],
    assessment: [],
    assignment: "Task",
    reflection: "Notes",
  };

  it("should support save, list, duplicate, and delete operations inside the store", async () => {
    const adapter = new LocalStorageAdapter();
    const store = useLessonStore.getState();
    store.setStorageAdapter(adapter);

    // 1. SAVE & LIST
    await adapter.saveLesson(testLesson);
    await store.listAllLessons();

    let state = useLessonStore.getState();
    assert.strictEqual(state.lessonsList.length, 1);
    assert.strictEqual(state.lessonsList[0].id, "lib-test-id-01");

    // 2. DUPLICATE
    const cloneId = await store.duplicateLesson("lib-test-id-01");
    assert.ok(cloneId !== null);
    assert.notStrictEqual(cloneId, "lib-test-id-01");

    state = useLessonStore.getState();
    assert.strictEqual(state.lessonsList.length, 2);
    const clone = state.lessonsList.find((l) => l.id === cloneId);
    assert.ok(clone !== undefined);
    assert.strictEqual(clone?.title, "Library Lifecycle Lesson (Copy)");
    assert.strictEqual(clone?.curriculum, "MATATAG");

    // 3. DELETE
    await store.deleteLesson("lib-test-id-01");
    state = useLessonStore.getState();
    assert.strictEqual(state.lessonsList.length, 1);
    assert.strictEqual(state.lessonsList[0].id, cloneId);
  });
});
