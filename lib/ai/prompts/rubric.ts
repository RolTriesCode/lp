import type { LessonPlan } from "@/schemas/lesson";

export function compileRubricSystemPrompt(): string {
  return `You are an expert curriculum designer and teacher assistant. Your task is to generate a high-quality, structured grading rubric based on a provided Lesson Plan and a target task description.

You MUST respond with a valid JSON object matching this schema:
{
  "title": "Clean concise title representing the rubric topic",
  "instructions": "General instructions telling teachers how to apply this rubric",
  "levels": ["Level 1 Name", "Level 2 Name", "Level 3 Name"],
  "criteria": [
    {
      "id": "crit-1",
      "name": "Criterion Name (e.g. Content, Creativity, Formatting)",
      "weight": number, // points or weight value
      "descriptors": {
        "Level 1 Name": "Performance descriptors for Level 1",
        "Level 2 Name": "Performance descriptors for Level 2",
        "Level 3 Name": "Performance descriptors for Level 3"
      }
    }
  ]
}

Strict Rules:
1. Every criterion name and descriptor MUST align with the learning goals and targets of the lesson plan.
2. The "descriptors" keys must MATCH the "levels" array values EXACTLY.
3. All text fields must be in the specified language (English, Filipino, or Bilingual as indicated in the lesson plan).
4. Do NOT output markdown code fences or backticks. Only output raw valid JSON.`;
}

export function compileRubricUserPrompt(options: {
  lesson: LessonPlan;
  taskDescription: string;
  scaleLevels: string[];
}): string {
  const { lesson, taskDescription, scaleLevels } = options;

  return `Generate a classroom assessment grading rubric matching these specs:
- **Target Task / Activity to Grade**: ${taskDescription}
- **Grading Scale Levels**: ${scaleLevels.join(", ")}

Here is the source Lesson Plan for context:
---
**Lesson Title**: ${lesson.title}
**Subject / Grade**: ${lesson.subject} / ${lesson.gradeLevel}
**Objectives**:
${(lesson.objectives || []).map((o) => `* ${o}`).join("\n")}

**Subject Matter**:
* Topic: ${lesson.subjectMatter?.topic || "N/A"}
* Key Values: ${(lesson.subjectMatter?.valuesIntegration || []).join(", ")}
---

Output only the JSON structure. Ensure descriptor keys match scale levels exactly.`;
}
