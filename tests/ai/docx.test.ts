import { describe, it } from "node:test";
import assert from "node:assert";
import mammoth from "mammoth";
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

  it("accepts bounded authenticated profile metadata with safe fallbacks", async () => {
    const personalized = await generateDocxFile(sampleLesson, {
      teacherName: "Ma. Victoria Ocampo",
      schoolName: "Bagong Pag-asa Integrated School",
      roleTitle: "Master Teacher",
    });
    const fallback = await generateDocxFile(sampleLesson, {
      teacherName: "\u0000",
      schoolName: "",
      roleTitle: null,
    });
    assert.ok(personalized.length > 3000);
    assert.ok(fallback.length > 3000);
  });

  it("excludes private teacher notes unless the teacher explicitly includes them", async () => {
    const privateNoteText = "PRIVATE EXPORT SENTINEL";
    const lessonWithPrivateNotes: LessonPlan = {
      ...sampleLesson,
      privateTeacherNotes: [
        {
          id: "3342004c-f7b8-43a2-a3f9-a6033384f19f",
          section: "procedures",
          text: privateNoteText,
          createdAt: "2026-08-09T08:00:00.000Z",
          updatedAt: "2026-08-09T08:00:00.000Z",
        },
      ],
    };

    const privateByDefault = await generateDocxFile(lessonWithPrivateNotes);
    const explicitlyIncluded = await generateDocxFile(
      lessonWithPrivateNotes,
      {},
      { includePrivateNotes: true }
    );
    const defaultText = await mammoth.extractRawText({ buffer: privateByDefault });
    const includedText = await mammoth.extractRawText({ buffer: explicitlyIncluded });

    assert.strictEqual(defaultText.value.includes(privateNoteText), false);
    assert.strictEqual(includedText.value.includes(privateNoteText), true);
  });
});
