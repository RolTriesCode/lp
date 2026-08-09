if (typeof window !== "undefined") {
  throw new Error("DOCX export renderer modules cannot be imported in client components.");
}

import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  HeadingLevel,
} from "docx";
import type { LessonPlan } from "@/schemas/lesson";

export type LessonExportProfile = {
  teacherName?: string | null;
  schoolName?: string | null;
  roleTitle?: string | null;
};

export type LessonExportOptions = {
  includePrivateNotes?: boolean;
};

function safeMetadataText(value: string | null | undefined, fallback: string, maximum: number): string {
  const clean = value?.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim();
  return clean ? clean.slice(0, maximum) : fallback;
}

/**
 * Strips HTML tags to return plain text for docx.
 */
function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

/**
 * Generates a formal DepEd lesson plan Word document stream.
 */
export async function generateDocxFile(
  lesson: LessonPlan,
  profile: LessonExportProfile = {},
  options: LessonExportOptions = {}
): Promise<Buffer> {
  const isDetailed = lesson.lessonType === "DETAILED";
  const teacherName = safeMetadataText(profile.teacherName, "Teacher", 120);
  const schoolName = safeMetadataText(profile.schoolName, "School not specified", 180);
  const roleTitle = safeMetadataText(profile.roleTitle, "Teacher", 80);

  // 1. Create a metadata header table (School, Teacher, Grade, Subject, Date, Quarter)
  const headerTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "School Name: ", bold: true }),
                  new TextRun({ text: schoolName }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Grade Level: ", bold: true }),
                  new TextRun({ text: lesson.gradeLevel }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Teacher Name: ", bold: true }),
                  new TextRun({ text: `${teacherName} · ${roleTitle}` }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Learning Area: ", bold: true }),
                  new TextRun({ text: lesson.subject }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Teaching Duration: ", bold: true }),
                  new TextRun({ text: lesson.duration }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Quarter / Week: ", bold: true }),
                  new TextRun({ text: `${lesson.quarter} / ${lesson.week || "N/A"}` }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const childrenElements: Array<Paragraph | Table> = [
    new Paragraph({
      text: `${lesson.curriculum} LESSON PLAN`,
      heading: HeadingLevel.HEADING_1,
      alignment: "center",
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: lesson.title,
      heading: HeadingLevel.HEADING_2,
      alignment: "center",
      spacing: { after: 240 },
    }),
    headerTable,
    new Paragraph({ text: "", spacing: { after: 240 } }),

    // I. OBJECTIVES
    new Paragraph({
      children: [new TextRun({ text: "I. OBJECTIVES", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 },
    }),
  ];

  // Add objectives list
  (lesson.objectives || []).forEach((obj) => {
    childrenElements.push(
      new Paragraph({
        text: `• ${obj}`,
        spacing: { after: 60 },
      })
    );
  });

  // II. STANDARDS
  childrenElements.push(
    new Paragraph({
      children: [new TextRun({ text: "II. CURRICULUM STANDARDS & COMPETENCIES", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 },
    })
  );

  if (lesson.standards) {
    if (lesson.standards.contentStandard) {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Content Standard: ", bold: true }),
            new TextRun({ text: lesson.standards.contentStandard }),
          ],
          spacing: { after: 60 },
        })
      );
    }
    if (lesson.standards.performanceStandard) {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Performance Standard: ", bold: true }),
            new TextRun({ text: lesson.standards.performanceStandard }),
          ],
          spacing: { after: 60 },
        })
      );
    }
    if (lesson.standards.learningCompetency) {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Learning Competency: ", bold: true }),
            new TextRun({ text: lesson.standards.learningCompetency }),
            lesson.standards.competencyCode
              ? new TextRun({ text: ` (${lesson.standards.competencyCode})`, italics: true })
              : new TextRun({ text: "" }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // III. SUBJECT MATTER
  childrenElements.push(
    new Paragraph({
      children: [new TextRun({ text: "III. SUBJECT MATTER", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 },
    })
  );

  if (lesson.subjectMatter) {
    childrenElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: "1. Topic Focus: ", bold: true }),
          new TextRun({ text: lesson.subjectMatter.topic }),
        ],
        spacing: { after: 60 },
      })
    );

    if (lesson.subjectMatter.references && lesson.subjectMatter.references.length > 0) {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: "2. References: ", bold: true }),
            new TextRun({ text: lesson.subjectMatter.references.join(", ") }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    if (lesson.subjectMatter.materials && lesson.subjectMatter.materials.length > 0) {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: "3. Learning Resources / Materials: ", bold: true }),
            new TextRun({ text: lesson.subjectMatter.materials.join(", ") }),
          ],
          spacing: { after: 60 },
        })
      );
    }

    if (lesson.subjectMatter.valuesIntegration && lesson.subjectMatter.valuesIntegration.length > 0) {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: "4. Values Integration: ", bold: true }),
            new TextRun({ text: lesson.subjectMatter.valuesIntegration.join(", ") }),
          ],
          spacing: { after: 60 },
        })
      );
    }
  }

  // IV. PROCEDURES
  childrenElements.push(
    new Paragraph({
      children: [new TextRun({ text: "IV. PROCEDURES", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 },
    })
  );

  if (isDetailed) {
    // Renders dialogue table
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: "TEACHER'S ACTIVITY", bold: true })] })],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: "STUDENTS' ACTIVITY", bold: true })] })],
          }),
        ],
      }),
    ];

    (lesson.procedures || []).forEach((proc) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: proc.title, bold: true, color: "5637f5" })], spacing: { after: 60 } }),
                new Paragraph({ text: stripHtml(proc.teacherActivity || "") }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({ children: [new TextRun({ text: "", bold: true })], spacing: { after: 60 } }),
                new Paragraph({ text: stripHtml(proc.studentActivity || "") }),
              ],
            }),
          ],
        })
      );
    });

    childrenElements.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: tableRows,
      })
    );
  } else {
    // Semi-Detailed list outline
    (lesson.procedures || []).forEach((proc, idx) => {
      childrenElements.push(
        new Paragraph({
          children: [new TextRun({ text: `${idx + 1}. ${proc.title}`, bold: true })],
          spacing: { before: 120, after: 60 },
        }),
        new Paragraph({
          text: stripHtml(proc.content || ""),
          spacing: { after: 120 },
        })
      );
    });
  }

  // V. EVALUATION / ASSESSMENT
  childrenElements.push(
    new Paragraph({
      children: [new TextRun({ text: "V. EVALUATION", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 },
    })
  );

  (lesson.assessment || []).forEach((evalItem, idx) => {
    childrenElements.push(
      new Paragraph({
        text: `Question ${idx + 1}: ${evalItem.question} (${evalItem.points} pts)`,
        spacing: { before: 60, after: 60 },
      })
    );
    if (evalItem.choices && evalItem.choices.length > 0) {
      childrenElements.push(
        new Paragraph({
          text: `Options: ${evalItem.choices.join(" | ")}`,
          spacing: { after: 60 },
        })
      );
    }
    childrenElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Correct Answer: ", bold: true }),
          new TextRun({ text: evalItem.answer }),
        ],
        spacing: { after: 120 },
      })
    );
  });

  // VI. ASSIGNMENT & REFLECTION
  childrenElements.push(
    new Paragraph({
      children: [new TextRun({ text: "VI. ASSIGNMENT & REFLECTION", bold: true, size: 24 })],
      spacing: { before: 240, after: 120 },
    })
  );

  if (lesson.assignment) {
    childrenElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Assignment / Extension Task: ", bold: true }),
          new TextRun({ text: lesson.assignment }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  if (lesson.reflection) {
    childrenElements.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Teacher's Reflection Notes: ", bold: true }),
          new TextRun({ text: stripHtml(lesson.reflection) }),
        ],
        spacing: { after: 60 },
      })
    );
  }

  if (options.includePrivateNotes && lesson.privateTeacherNotes?.some((note) => note.text.trim())) {
    childrenElements.push(
      new Paragraph({
        children: [new TextRun({ text: "PRIVATE TEACHER NOTES", bold: true, size: 24 })],
        spacing: { before: 240, after: 120 },
      })
    );
    lesson.privateTeacherNotes.filter((note) => note.text.trim()).forEach((note) => {
      childrenElements.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${note.section}: `, bold: true }),
            new TextRun({ text: note.text }),
          ],
          spacing: { after: 60 },
        })
      );
    });
  }

  // Packer generates document stream
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: childrenElements,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}
