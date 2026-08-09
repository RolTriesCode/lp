import { describe, it } from "node:test";
import assert from "node:assert";
import { generateBlockId, normalizeLessonPlan, type LessonPlan, type LessonProcedure } from "../../schemas/lesson";

describe("Structured Lesson Editor Data Structures (`components/editor/`)", () => {
  const baseLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "editor-test-001",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Editor Integration Test",
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
    objectives: ["Objective 1", "Objective 2"],
    subjectMatter: {
      topic: "Cellular Structure",
      references: ["Ref 1"],
      materials: ["Microscope"],
      valuesIntegration: ["Scientific inquiry"],
    },
    procedures: [
      {
        id: "proc-1",
        title: "Stage 1: Motivation",
        teacherActivity: "Teacher asks question.",
        studentActivity: "Students observe.",
        content: "Intro",
      },
      {
        id: "proc-2",
        title: "Stage 2: Discussion",
        teacherActivity: "Teacher explains organelle.",
        studentActivity: "Students take notes.",
        content: "Discussion",
      },
    ],
    assessment: [
      {
        id: "eval-1",
        type: "multiple_choice",
        question: "What is the powerhouse of the cell?",
        choices: ["Mitochondria", "Nucleus", "Ribosome"],
        answer: "Mitochondria",
        points: 1,
      },
    ],
    assignment: "Read chapter 3.",
    reflection: "Students engaged well.",
  };

  it("should add a new procedure block with a stable generated ID", () => {
    const newStage: LessonProcedure = {
      id: generateBlockId("proc"),
      title: "Stage 3: Application",
      teacherActivity: "Teacher assigns group work.",
      studentActivity: "Students collaborate.",
      content: "Group work",
    };

    const updatedProcedures = [...baseLesson.procedures, newStage];
    const updatedLesson = normalizeLessonPlan({
      ...baseLesson,
      procedures: updatedProcedures,
    });

    assert.strictEqual(updatedLesson.procedures.length, 3);
    assert.ok(updatedLesson.procedures[2].id.startsWith("proc-"));
    assert.strictEqual(updatedLesson.procedures[2].title, "Stage 3: Application");
  });

  it("should reorder procedure blocks while retaining their stable IDs", () => {
    const list = [...baseLesson.procedures];
    const temp = list[0];
    list[0] = list[1];
    list[1] = temp;

    const updatedLesson = normalizeLessonPlan({
      ...baseLesson,
      procedures: list,
    });

    assert.strictEqual(updatedLesson.procedures[0].id, "proc-2");
    assert.strictEqual(updatedLesson.procedures[1].id, "proc-1");
  });

  it("should update assessment item choices and maintain canonical LessonPlan validation", () => {
    const updatedAssessment = [
      {
        ...baseLesson.assessment![0],
        choices: ["Mitochondria", "Nucleus", "Ribosome", "Golgi Apparatus"],
      },
    ];

    const updatedLesson = normalizeLessonPlan({
      ...baseLesson,
      assessment: updatedAssessment,
    });

    assert.strictEqual(updatedLesson.assessment![0].choices!.length, 4);
    assert.strictEqual(updatedLesson.schemaVersion, "1.0");
    assert.strictEqual(updatedLesson.curriculum, "MATATAG");
  });
});
