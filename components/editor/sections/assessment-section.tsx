"use client";

import { FileCheck2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { SectionActionBar } from "@/components/editor/section-action-bar";
import { generateBlockId, type AssessmentItem, type LessonPlan } from "@/schemas/lesson";

type AssessmentSectionProps = {
  lesson: LessonPlan;
  onChange: (assessment: AssessmentItem[]) => void;
};

export function AssessmentSection({ lesson, onChange }: AssessmentSectionProps) {
  const assessment = lesson.assessment || [];
  const [previousAssessment, setPreviousAssessment] = useState<AssessmentItem[] | null>(null);

  function handleApplyAiResult(updatedContent: any) {
    if (Array.isArray(updatedContent)) {
      setPreviousAssessment(assessment);
      onChange(updatedContent);
    }
  }

  function handleUndo() {
    if (previousAssessment) {
      onChange(previousAssessment);
      setPreviousAssessment(null);
    }
  }

  function handleUpdateItem(index: number, updated: Partial<AssessmentItem>) {
    const list = [...assessment];
    list[index] = {
      ...list[index],
      ...updated,
    };
    onChange(list);
  }

  function handleAddQuestion() {
    const newItem: AssessmentItem = {
      id: generateBlockId("eval"),
      type: "multiple_choice",
      question: "Sample assessment question text?",
      choices: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
      points: 1,
    };
    onChange([...assessment, newItem]);
  }

  function handleRemoveQuestion(index: number) {
    const list = assessment.filter((_, idx) => idx !== index);
    onChange(list);
  }

  return (
    <section className="lesson-form-card" id="section-assessment">
      <div className="card-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="card-icon orange">
            <FileCheck2 size={20} />
          </div>
          <div>
            <h2>4. Formative Assessment & Evaluation</h2>
            <p>Assessment questions, choices, answers, and points.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleAddQuestion}
          style={{ padding: "6px 12px", fontSize: "11px" }}
        >
          <Plus size={14} /> Add Question
        </button>
      </div>

      {/* Section-Level AI Actions */}
      <SectionActionBar
        currentContent={assessment}
        onApplyResult={handleApplyAiResult}
        onUndo={handleUndo}
        previousContent={previousAssessment}
        sectionType="assessment"
      />

      <div className="card-body" style={{ display: "grid", gap: "14px" }}>
        {assessment.map((item, idx) => (
          <div key={item.id || idx} className="assessment-item-card">
            <div className="block-card-header">
              <span className="block-badge">{idx + 1}</span>
              <input
                className="form-input"
                type="text"
                value={item.question}
                onChange={(e) => handleUpdateItem(idx, { question: e.target.value })}
                placeholder="Question text..."
              />
              <button
                type="button"
                className="btn-block-action danger"
                onClick={() => handleRemoveQuestion(idx)}
                title="Remove question"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <div className="form-grid-2" style={{ marginTop: "10px" }}>
              <div className="form-group">
                <label className="field-label">Choices (comma separated)</label>
                <input
                  className="form-input"
                  type="text"
                  value={(item.choices || []).join(", ")}
                  onChange={(e) =>
                    handleUpdateItem(idx, {
                      choices: e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="field-label">Correct Answer</label>
                <input
                  className="form-input"
                  type="text"
                  value={item.answer || ""}
                  onChange={(e) => handleUpdateItem(idx, { answer: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
