import { describe, it } from "node:test";
import assert from "node:assert";
import { useLessonStore } from "../../stores/lesson-store";
import type { LessonPlan } from "../../schemas/lesson";

describe("Contextual AI Assistant Panel (`components/editor/assistant/`)", () => {
  const initialLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "assistant-test-01",
    curriculum: "ILAW",
    lessonType: "SEMI_DETAILED",
    title: "Assistant Integration Test Lesson",
    gradeLevel: "Grade 8",
    subject: "English",
    quarter: "Q1",
    week: "Week 1",
    duration: "50 mins",
    standards: {
      contentStandard: "Content standard",
      learningCompetency: "Learning competency",
      competencyCode: "ENG-001",
    },
    objectives: ["Objective 1"],
    subjectMatter: {
      topic: "Types of Metrical Feet",
      references: ["Ref 1"],
      materials: ["Chart"],
      valuesIntegration: ["Community unity"],
    },
    procedures: [
      {
        id: "proc-99",
        title: "Introduction",
        teacherActivity: "Teacher greets class.",
        studentActivity: "Students listen.",
        content: "Intro",
      },
    ],
    assessment: [],
    assignment: "Homework",
    reflection: "Notes",
  };

  it("should update selectedSectionType state when card/nav item is focused", () => {
    const store = useLessonStore.getState();
    store.setActiveLesson(initialLesson);

    // Focus on procedures
    store.setSelectedSection("procedures");

    const state = useLessonStore.getState();
    assert.strictEqual(state.selectedSectionType, "procedures");
  });

  it("should apply AI suggestion to correct section while preserving other areas", () => {
    const store = useLessonStore.getState();
    store.setActiveLesson(initialLesson);
    store.setSelectedSection("objectives");

    const proposedObjectives = [
      "Differentiated Objective A for advanced learners",
      "Differentiated Objective B for struggling learners",
    ];

    // Simulate teacher clicking "Apply Suggestion"
    store.updateSection("objectives", proposedObjectives);

    const state = useLessonStore.getState();
    assert.deepStrictEqual(state.activeLesson?.objectives, proposedObjectives);
    assert.strictEqual(state.isDirty, true);
    // Unrelated section check
    assert.strictEqual(state.activeLesson?.title, "Assistant Integration Test Lesson");
    assert.strictEqual(state.activeLesson?.procedures[0].id, "proc-99");
  });
});
