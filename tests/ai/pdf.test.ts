import { describe, it } from "node:test";
import assert from "node:assert";
import { PDFParse } from "pdf-parse";
import { generatePdfFile } from "../../lib/documents/pdf/renderer";
import type { LessonPlan } from "../../schemas/lesson";

describe("PDF Document Exporter (`lib/documents/pdf/renderer.ts`)", () => {
  const sampleLesson: LessonPlan = {
    schemaVersion: "1.0",
    id: "lesson-pdf-test",
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

  it("should compile a valid Detailed Lesson Plan as a PDF binary buffer stream starting with %PDF signature", async () => {
    const buffer = await generatePdfFile(sampleLesson);
    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 1000, `Expected PDF file to be larger than 1KB, got ${buffer.length} bytes`);

    // Verify PDF Magic Number Signature
    const signature = buffer.toString("utf-8", 0, 4);
    assert.strictEqual(signature, "%PDF");
  });

  it("should compile a valid Semi-Detailed Lesson Plan as a PDF binary buffer stream starting with %PDF signature", async () => {
    const semiDetailed: LessonPlan = {
      ...sampleLesson,
      lessonType: "SEMI_DETAILED",
    };
    const buffer = await generatePdfFile(semiDetailed);
    assert.ok(buffer instanceof Buffer);
    assert.ok(buffer.length > 1000, `Expected PDF file to be larger than 1KB, got ${buffer.length} bytes`);

    const signature = buffer.toString("utf-8", 0, 4);
    assert.strictEqual(signature, "%PDF");
  });

  it("excludes private teacher notes unless the teacher explicitly includes them", async () => {
    const privateNoteText = "PRIVATE PDF EXPORT SENTINEL";
    const lessonWithPrivateNotes: LessonPlan = {
      ...sampleLesson,
      privateTeacherNotes: [
        {
          id: "ec66464c-e1ca-4377-bde0-327393b53477",
          section: "assessment",
          text: privateNoteText,
          createdAt: "2026-08-09T08:00:00.000Z",
          updatedAt: "2026-08-09T08:00:00.000Z",
        },
      ],
    };
    const defaultBuffer = await generatePdfFile(lessonWithPrivateNotes);
    const includedBuffer = await generatePdfFile(lessonWithPrivateNotes, { includePrivateNotes: true });

    async function extractText(buffer: Buffer) {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        return (await parser.getText()).text;
      } finally {
        await parser.destroy();
      }
    }

    assert.strictEqual((await extractText(defaultBuffer)).includes(privateNoteText), false);
    assert.strictEqual((await extractText(includedBuffer)).includes(privateNoteText), true);
  });
});
