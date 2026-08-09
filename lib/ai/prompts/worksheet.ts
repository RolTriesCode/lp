import type { LessonPlan } from "@/schemas/lesson";

export function compileWorksheetSystemPrompt(): string {
  return `You are an expert curriculum designer and teacher assistant. Your task is to generate a high-quality, structured activity worksheet based on a provided Lesson Plan.

You MUST respond with a valid JSON object matching this schema:
{
  "title": "Clean concise title representing the worksheet topic",
  "instructions": "General instructions telling students how to complete this worksheet",
  "difficulty": "easy" | "average" | "difficult",
  "items": [
    {
      "id": "ws-item-1",
      "question": "Clear, concise activity question or task prompt aligned with lesson objectives",
      "points": number,
      "hint": "Optional helpful tip or guidance cue to scaffold learners",
      "answer": "The expected correct answer key, solution outline, or response rubric guidelines"
    }
  ]
}

Strict Rules:
1. Every generated question/activity item MUST map back directly to the learning objectives of the lesson.
2. Provide hints that are scaffolded and helpful without giving away the exact answer directly.
3. All text fields must be in the specified language (English, Filipino, or Bilingual as indicated in the lesson plan).
4. Do NOT output markdown code fences or backticks. Only output raw valid JSON.`;
}

export function compileWorksheetUserPrompt(options: {
  lesson: LessonPlan;
  difficulty: "easy" | "average" | "difficult";
  itemCount: number;
  additionalInstructions?: string;
}): string {
  const { lesson, difficulty, itemCount, additionalInstructions } = options;

  return `Generate a classroom activity worksheet matching these specs:
- **Difficulty**: ${difficulty.toUpperCase()}
- **Total Item/Question Count**: ${itemCount} items
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
