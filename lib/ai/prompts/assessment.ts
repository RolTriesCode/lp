import type { LessonPlan } from "@/schemas/lesson";
import type { AssessmentItemType } from "@/schemas/assessment";

export function compileAssessmentSystemPrompt(): string {
  return `You are an expert curriculum designer and teacher assistant. Your task is to generate a high-quality, structured classroom assessment based on a provided Lesson Plan.

You MUST respond with a valid JSON object matching this schema:
{
  "title": "Clean concise title representing the topic",
  "instructions": "General instructions telling students how to complete this assessment",
  "difficulty": "easy" | "average" | "difficult",
  "items": [
    {
      "id": "item-1",
      "type": "multiple_choice" | "true_or_false" | "identification" | "essay" | "performance_task",
      "question": "Clear, concise question statement aligned with lesson objectives",
      "points": number,
      "choices": ["Option A", "Option B", "Option C", "Option D"], // ONLY for multiple_choice and true_or_false
      "answer": "The correct answer key (e.g. 'A' for multiple choice, 'True' for true_or_false, or exact term for identification)",
      "rubric": "Grading rubric statement (ONLY for essay and performance_task)"
    }
  ]
}

Strict Rules:
1. Every generated question MUST map back directly to the learning objectives of the lesson.
2. For multiple choice items, provide exactly 4 logical options. The "answer" field must match one of the choices exactly.
3. For true/false items, choices must be exactly ["True", "False"].
4. For essay and performance task items, provide a clear rubric instruction in the "rubric" field.
5. All text fields must be in the specified language (English, Filipino, or Bilingual as indicated in the lesson plan).
6. Do NOT output markdown code fences or backticks. Only output raw valid JSON.`;
}

export function compileAssessmentUserPrompt(options: {
  lesson: LessonPlan;
  itemTypes: AssessmentItemType[];
  difficulty: "easy" | "average" | "difficult";
  itemCount: number;
  additionalInstructions?: string;
}): string {
  const { lesson, itemTypes, difficulty, itemCount, additionalInstructions } = options;

  return `Generate a classroom assessment check matching these specs:
- **Difficulty**: ${difficulty.toUpperCase()}
- **Total Question Count**: ${itemCount} items
- **Allowed Formats / Types**: ${itemTypes.join(", ")}
${additionalInstructions ? `- **Teacher Directions**: ${additionalInstructions}\n` : ""}

Here is the source Lesson Plan for context:
---
**Lesson Title**: ${lesson.title}
**Subject / Grade**: ${lesson.subject} / ${lesson.gradeLevel}
**Objectives**:
${(lesson.objectives || []).map((o) => `* ${o}`).join("\n")}

**Standards**:
* Content: ${lesson.standards?.contentStandard || "N/A"}
* Performance: ${lesson.standards?.performanceStandard || "N/A"}
* Learning Competency: ${lesson.standards?.learningCompetency || "N/A"}

**Subject Matter**:
* Topic: ${lesson.subjectMatter?.topic || "N/A"}
* Key Values: ${(lesson.subjectMatter?.valuesIntegration || []).join(", ")}

**Lesson Outline / Procedures**:
${(lesson.procedures || [])
  .map((p) => `* Stage: ${p.title}\n  - Content: ${p.content || p.teacherActivity || ""}`)
  .join("\n")}
---

Output only the JSON structure. Ensure the choices and answers are consistent.`;
}
