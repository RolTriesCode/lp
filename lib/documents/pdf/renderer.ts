if (typeof window !== "undefined") {
  throw new Error("PDF export renderer modules cannot be imported in client components.");
}

import { jsPDF } from "jspdf";
import type { LessonPlan } from "@/schemas/lesson";

/**
 * Strips HTML tags to return plain text for pdf.
 */
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

/**
 * Generates a formal DepEd lesson plan PDF document.
 */
export async function generatePdfFile(lesson: LessonPlan): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let currentY = 20;

  function addText(text: string, options?: { bold?: boolean; indent?: number; italic?: boolean; size?: number }) {
    if (currentY > 275) {
      doc.addPage();
      currentY = 20;
    }

    const size = options?.size || 11;
    doc.setFontSize(size);

    const fontStyle = options?.bold && options?.italic ? "bolditalic" : options?.bold ? "bold" : options?.italic ? "italic" : "normal";
    doc.setFont("Helvetica", fontStyle);

    const indent = options?.indent || 0;
    const maxW = 170 - indent;
    const lines = doc.splitTextToSize(text, maxW);

    lines.forEach((line: string) => {
      if (currentY > 275) {
        doc.addPage();
        currentY = 20;
        doc.setFontSize(size);
        doc.setFont("Helvetica", fontStyle);
      }
      doc.text(line, 20 + indent, currentY);
      currentY += (size * 0.3527) + 2.5; // Scale font size to mm and add line leading spacing
    });
  }

  // Header Title
  addText(`${lesson.curriculum} LESSON PLAN`, { bold: true, size: 16 });
  addText(lesson.title, { bold: true, size: 13 });
  currentY += 4;

  // Metadata block
  addText(`Grade Level: ${lesson.gradeLevel}   |   Learning Area: ${lesson.subject}`, { bold: true });
  addText(`Teaching Duration: ${lesson.duration}   |   Quarter/Week: ${lesson.quarter} / ${lesson.week || "N/A"}`, { bold: true });
  currentY += 6;

  // I. OBJECTIVES
  addText("I. OBJECTIVES", { bold: true, size: 12 });
  (lesson.objectives || []).forEach((obj) => {
    addText(`• ${obj}`, { indent: 5 });
  });
  currentY += 4;

  // II. STANDARDS
  addText("II. CURRICULUM STANDARDS & COMPETENCIES", { bold: true, size: 12 });
  if (lesson.standards) {
    if (lesson.standards.contentStandard) {
      addText(`Content Standard: ${lesson.standards.contentStandard}`, { indent: 5 });
    }
    if (lesson.standards.performanceStandard) {
      addText(`Performance Standard: ${lesson.standards.performanceStandard}`, { indent: 5 });
    }
    if (lesson.standards.learningCompetency) {
      addText(
        `Learning Competency: ${lesson.standards.learningCompetency}${
          lesson.standards.competencyCode ? ` (${lesson.standards.competencyCode})` : ""
        }`,
        { indent: 5 }
      );
    }
  }
  currentY += 4;

  // III. SUBJECT MATTER
  addText("III. SUBJECT MATTER", { bold: true, size: 12 });
  if (lesson.subjectMatter) {
    addText(`Topic Focus: ${lesson.subjectMatter.topic}`, { indent: 5 });
    if (lesson.subjectMatter.references && lesson.subjectMatter.references.length > 0) {
      addText(`References: ${lesson.subjectMatter.references.join(", ")}`, { indent: 5 });
    }
    if (lesson.subjectMatter.materials && lesson.subjectMatter.materials.length > 0) {
      addText(`Learning Resources: ${lesson.subjectMatter.materials.join(", ")}`, { indent: 5 });
    }
    if (lesson.subjectMatter.valuesIntegration && lesson.subjectMatter.valuesIntegration.length > 0) {
      addText(`Values Integration: ${lesson.subjectMatter.valuesIntegration.join(", ")}`, { indent: 5 });
    }
  }
  currentY += 4;

  // IV. PROCEDURES
  addText("IV. PROCEDURES", { bold: true, size: 12 });
  const isDetailed = lesson.lessonType === "DETAILED";

  (lesson.procedures || []).forEach((proc, idx) => {
    addText(`${idx + 1}. ${proc.title}`, { bold: true, indent: 5 });

    if (isDetailed) {
      if (proc.teacherActivity) {
        addText(`Teacher's Activity Script:`, { bold: true, italic: true, indent: 10 });
        addText(stripHtml(proc.teacherActivity), { indent: 10 });
      }
      if (proc.studentActivity) {
        addText(`Students' Expected Responses:`, { bold: true, italic: true, indent: 10 });
        addText(stripHtml(proc.studentActivity), { indent: 10 });
      }
    } else {
      if (proc.content) {
        addText(stripHtml(proc.content), { indent: 10 });
      }
    }
    currentY += 2;
  });
  currentY += 4;

  // V. EVALUATION
  addText("V. EVALUATION / FORMATIVE ASSESSMENT", { bold: true, size: 12 });
  (lesson.assessment || []).forEach((evalItem, idx) => {
    addText(`Question ${idx + 1}: ${evalItem.question} (${evalItem.points} pts)`, { indent: 5 });
    if (evalItem.choices && evalItem.choices.length > 0) {
      addText(`Choices: ${evalItem.choices.join(" | ")}`, { indent: 10 });
    }
    addText(`Correct Answer: ${evalItem.answer}`, { indent: 10, italic: true });
  });
  currentY += 4;

  // VI. ASSIGNMENT & REFLECTION
  addText("VI. ASSIGNMENT & REFLECTION", { bold: true, size: 12 });
  if (lesson.assignment) {
    addText(`Assignment: ${lesson.assignment}`, { indent: 5 });
  }
  if (lesson.reflection) {
    addText(`Teacher's Reflection Notes: ${stripHtml(lesson.reflection)}`, { indent: 5 });
  }

  // Output as ArrayBuffer to build Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
