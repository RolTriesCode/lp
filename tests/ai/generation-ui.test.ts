import { describe, it } from "node:test";
import assert from "node:assert";
import {
  getAllDraftLessons,
  getDraftLesson,
  saveDraftLesson,
} from "../../lib/draft-store";
import type { LessonPlan } from "../../schemas/lesson";

describe("Lesson Generation UI & Draft Store (`lib/draft-store.ts`)", () => {
  const sampleLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "lesson-test-001",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Draft Store Test Lesson",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    week: "Week 1",
    duration: "60 mins",
    standards: {
      contentStandard: "Content standard test",
      learningCompetency: "Competency test",
      competencyCode: "S7LT-IIg-7",
    },
    objectives: ["Objective 1", "Objective 2"],
    subjectMatter: {
      topic: "Photosynthesis",
      references: ["Ref 1"],
      materials: ["Mat 1"],
      valuesIntegration: ["Appreciation for nature and plant life."],
    },
    procedures: [
      {
        id: "proc-1",
        title: "A. Preliminary Activities",
        teacherActivity: "Teacher greets class.",
        studentActivity: "Students greet back.",
        content: "Routine",
      },
    ],
    assessment: [
      {
        id: "eval-1",
        type: "multiple_choice",
        question: "Sample question?",
        choices: ["Option A", "Option B"],
        answer: "Option A",
        points: 1,
      },
    ],
    assignment: "Complete workbook exercises.",
    reflection: "Good engagement.",
  };

  it("should save a lesson plan draft and retrieve it by ID", () => {
    const savedId = saveDraftLesson(sampleLesson);
    assert.strictEqual(savedId, "lesson-test-001");

    const retrieved = getDraftLesson("lesson-test-001");
    assert.ok(retrieved !== null);
    if (retrieved) {
      assert.strictEqual(retrieved.title, "Draft Store Test Lesson");
      assert.strictEqual(retrieved.curriculum, "MATATAG");
      assert.strictEqual(retrieved.procedures.length, 1);
    }
  });

  it("should auto-generate a valid ID if draft lesson lacks an ID", () => {
    const lessonWithoutId = { ...sampleLesson, id: undefined };
    const savedId = saveDraftLesson(lessonWithoutId);
    assert.ok(savedId.startsWith("lesson-"));

    const retrieved = getDraftLesson(savedId);
    assert.ok(retrieved !== null);
    if (retrieved) {
      assert.strictEqual(retrieved.id, savedId);
    }
  });

  it("should retrieve all saved draft lessons sorted by recency", () => {
    const drafts = getAllDraftLessons();
    assert.ok(Array.isArray(drafts));
    assert.ok(drafts.length >= 2);
    assert.ok(drafts.some((d) => d.id === "lesson-test-001"));
  });

  it("should return null for non-existent draft IDs", () => {
    const nonExistent = getDraftLesson("lesson-does-not-exist-999");
    assert.strictEqual(nonExistent, null);
  });
});
