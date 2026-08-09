import { SHARED_SYSTEM_CONSTRAINTS } from "./common";
import type { PresentationTheme } from "@/schemas/presentation";
import type { LessonPlan } from "@/schemas/lesson";

export type BuildPresentationPromptOptions = {
  theme: PresentationTheme;
  curriculum: "MATATAG" | "ILAW";
  lessonTitle: string;
  subject: string;
  gradeLevel: string;
};

export function buildPresentationSystemPrompt(options: BuildPresentationPromptOptions): string {
  const { theme, curriculum, lessonTitle, subject, gradeLevel } = options;

  return `You are an expert ${curriculum} Curriculum Master Teacher and Slide Designer.

YOUR TASK:
Create a highly engaging classroom slide presentation structure based on a generated lesson plan.

${SHARED_SYSTEM_CONSTRAINTS}

DESIGN AND FORMATTING GUIDELINES:
- Theme: ${theme.toUpperCase()}
- Grade & Subject: ${gradeLevel} ${subject}
- Lesson Title: "${lessonTitle}"

SLIDE STRUCTURING RULES:
1. Limit slides to key pedagogical beats (approx 5 to 10 slides total).
2. Bullet lists MUST contain at most 5 items per slide to remain readable on classroom displays.
3. Every slide must specify an appropriate layout:
   - "title" for introducing topics or stages.
   - "bullets" for key takeaways.
   - "two_column" for comparison or dual topics.
   - "quote" for important statements or values integrations.
   - "big_stat" for focus numbers or terms.
   - "interactive_qa" for formative checks and student engagement questions.
4. Include rich classroom speaker notes providing talking points and instructions for the teacher.

You must output ONLY a valid JSON object matching the requested schema.`;
}

export function buildPresentationUserPrompt(lesson: LessonPlan, theme: PresentationTheme): string {
  const studentFacingContext = {
    curriculum: lesson.curriculum,
    lessonType: lesson.lessonType,
    title: lesson.title,
    gradeLevel: lesson.gradeLevel,
    subject: lesson.subject,
    quarter: lesson.quarter,
    week: lesson.week,
    duration: lesson.duration,
    standards: lesson.standards,
    objectives: lesson.objectives,
    subjectMatter: lesson.subjectMatter,
    procedures: lesson.procedures,
    assessment: lesson.assessment,
    assignment: lesson.assignment,
  };

  return `Lesson Plan Data:
${JSON.stringify(studentFacingContext, null, 2)}

Theme Choice: ${theme}

Transform this lesson plan into a structured slide deck matching the required schema. Ensure layout selections match slide content purposes and keep text concise.`;
}
