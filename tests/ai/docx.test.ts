import { describe, it } from "node:test";
import assert from "node:assert";
import { generateDocxFile } from "../../lib/documents/docx/renderer";
import type { LessonPlan } from "../../schemas/lesson";

describe("Word Document Exporter (`lib/documents/docx/renderer.ts`)", () => {
  const sampleLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "lesson-docx-test",
    curriculum: "MATATAG",
    lessonType: "DETAILED",
    title: "Lesson Plan Title",
    gradeLevel: "Grade 7",
    subject: "Science",
    quarter: "Q1",
    week: "Week 1",
    duration: "60 mins",
    standards: {
      contentStandard: "Content Standard",
      learningCompetency: "Learning Competency",
      competencyCode: "S7LT-IIg-7",
    },
    objectives: ["Objective 1", "Objective 2"],
    subjectMatter: {
      topic: "Plant Cells",
      references: ["Book 1"],
      materials: ["Microscope"],
      valuesIntegration: ["Accuracy"],
    },
    procedures: [
      {
        id: "proc-1",
        title: "Stage 1: Motivation",
        teacherActivity: "Teacher greets class.",
        studentActivity: "Students respond.",
        content: "Intro",
      },
    ],
    assessment: [
      {
        id: "eval-1",
        type: "multiple_choice",
        question: "What is a cell?",
        choices: ["A", "B"],
        answer: "A",
        points: 1,
      },
    ],
    assignment: "Draw cell.",
    reflection: "Class was engaged.",
  };

  it("should compile a valid Detailed Lesson Plan as a DOCX binary buffer stream", async () => {
    const buffer = await generateDocxFile(sampleLesson);
    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 3000, `Expected Word file to be larger than 3KB, got ${buffer.length} bytes`);
  });

  it("should compile a valid Semi-Detailed Lesson Plan as a DOCX binary buffer stream", async () => {
    const semiDetailed: LessonPlan = {
      ...sampleLesson,
      lessonType: "SEMI_DETAILED",
    };
    const buffer = await generateDocxFile(semiDetailed);
    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 3000, `Expected Word file to be larger than 3KB, got ${buffer.length} bytes`);
  });
});
