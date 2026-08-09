import type { LessonPlan } from "@/schemas/lesson";
import { TeachingSlideSchema, type TeachingSlide } from "@/schemas/pedagogy";

function plainText(value: string | undefined): string {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function buildTeachingSlides(lesson: LessonPlan): TeachingSlide[] {
  const slides: TeachingSlide[] = [
    {
      id: "opening",
      kind: "opening",
      eyebrow: `${lesson.curriculum} · ${lesson.gradeLevel} · ${lesson.subject}`,
      title: lesson.title,
      lines: [lesson.subjectMatter.topic, `${lesson.quarter} · ${lesson.duration}`],
      section: "lesson",
    },
    {
      id: "objectives",
      kind: "objectives",
      eyebrow: "Learning intentions",
      title: "By the end of this lesson",
      lines: lesson.objectives,
      section: "objectives",
    },
    {
      id: "subject-matter",
      kind: "subject_matter",
      eyebrow: "Today’s focus",
      title: lesson.subjectMatter.topic,
      lines: [
        ...lesson.subjectMatter.materials.map((item) => `Material · ${item}`),
        ...lesson.subjectMatter.valuesIntegration.map((item) => `Value · ${item}`),
      ].slice(0, 10),
      section: "subjectMatter",
    },
  ];

  lesson.procedures.forEach((procedure, index) => {
    const lines = lesson.lessonType === "DETAILED"
      ? [plainText(procedure.teacherActivity), plainText(procedure.studentActivity)]
      : [plainText(procedure.content)];
    slides.push({
      id: `procedure-${procedure.id}`,
      kind: "procedure",
      eyebrow: `Lesson sequence · ${index + 1} of ${lesson.procedures.length}`,
      title: procedure.title,
      lines: lines.filter(Boolean),
      section: "procedures",
    });
  });

  if (lesson.assessment?.length) {
    slides.push({
      id: "assessment",
      kind: "assessment",
      eyebrow: "Check for understanding",
      title: "Show what you know",
      lines: lesson.assessment.map((item, index) => `${index + 1}. ${item.question}`),
      section: "assessment",
    });
  }

  if (lesson.assignment) {
    slides.push({
      id: "assignment",
      kind: "assignment",
      eyebrow: "Before the next lesson",
      title: "Assignment",
      lines: [plainText(lesson.assignment)],
      section: "reflection",
    });
  }

  return TeachingSlideSchema.array().parse(slides);
}
