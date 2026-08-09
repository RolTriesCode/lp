"use client";

import { Layers } from "lucide-react";
import { useState } from "react";
import { SectionActionBar } from "@/components/editor/section-action-bar";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import type { LessonPlan } from "@/schemas/lesson";

type ReflectionSectionProps = {
  lesson: LessonPlan;
  onChange: (updated: { assignment?: string; reflection?: string }) => void;
};

export function ReflectionSection({ lesson, onChange }: ReflectionSectionProps) {
  const currentReflection = {
    reflection: lesson.reflection || "",
    assignment: lesson.assignment || "",
  };

  const [previousReflection, setPreviousReflection] = useState<{
    reflection?: string;
    assignment?: string;
  } | null>(null);

  function handleApplyAiResult(updatedContent: any) {
    if (updatedContent && typeof updatedContent === "object") {
      setPreviousReflection(currentReflection);
      onChange(updatedContent);
    }
  }

  function handleUndo() {
    if (previousReflection) {
      onChange(previousReflection);
      setPreviousReflection(null);
    }
  }

  return (
    <section className="lesson-form-card" id="section-reflection">
      <div className="card-header">
        <div className="card-icon violet">
          <Layers size={20} />
        </div>
        <div>
          <h2>5. Assignment & Teacher Reflection</h2>
          <p>Follow-up tasks, homework, and post-lesson teacher notes.</p>
        </div>
      </div>

      {/* Section-Level AI Actions */}
      <SectionActionBar
        currentContent={currentReflection}
        onApplyResult={handleApplyAiResult}
        onUndo={handleUndo}
        previousContent={previousReflection}
        sectionType="reflection"
      />

      <div className="card-body">
        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-assignment">Assignment / Extension Task</label>
          <input
            id="edit-assignment"
            className="form-input"
            type="text"
            value={lesson.assignment || ""}
            onChange={(e) => onChange({ assignment: e.target.value })}
            placeholder="e.g. Complete worksheet exercise 1 to 5 on page 42."
          />
        </div>

        <div className="form-group">
          <label className="field-label">Teacher Reflection & Notes</label>
          <TiptapEditor
            content={lesson.reflection || ""}
            onChange={(html) => onChange({ reflection: html })}
          />
        </div>
      </div>
    </section>
  );
}
