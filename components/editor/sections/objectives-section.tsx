"use client";

import { ListOrdered, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { SectionActionBar } from "@/components/editor/section-action-bar";
import type { LessonPlan } from "@/schemas/lesson";

type ObjectivesSectionProps = {
  lesson: LessonPlan;
  onChange: (objectives: string[]) => void;
};

export function ObjectivesSection({ lesson, onChange }: ObjectivesSectionProps) {
  const objectives = lesson.objectives || [];
  const [previousObjectives, setPreviousObjectives] = useState<string[] | null>(null);

  function handleApplyAiResult(updatedContent: any) {
    if (Array.isArray(updatedContent)) {
      setPreviousObjectives(objectives);
      onChange(updatedContent);
    }
  }

  function handleUndo() {
    if (previousObjectives) {
      onChange(previousObjectives);
      setPreviousObjectives(null);
    }
  }

  function handleObjectiveChange(index: number, val: string) {
    const updated = [...objectives];
    updated[index] = val;
    onChange(updated);
  }

  function handleAddObjective() {
    onChange([...objectives, "New learning objective target."]);
  }

  function handleRemoveObjective(index: number) {
    const updated = objectives.filter((_, idx) => idx !== index);
    onChange(updated);
  }

  return (
    <section className="lesson-form-card" id="section-objectives">
      <div className="card-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="card-icon violet">
            <ListOrdered size={20} />
          </div>
          <div>
            <h2>Learning Objectives</h2>
            <p>Specific, measurable learning targets for the lesson.</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleAddObjective}
          style={{ padding: "6px 12px", fontSize: "11px" }}
        >
          <Plus size={14} /> Add Objective
        </button>
      </div>

      {/* Section-Level AI Actions */}
      <SectionActionBar
        currentContent={objectives}
        onApplyResult={handleApplyAiResult}
        onUndo={handleUndo}
        previousContent={previousObjectives}
        sectionType="objectives"
      />

      <div className="card-body" style={{ display: "grid", gap: "12px" }}>
        {objectives.map((obj, idx) => (
          <div key={idx} className="block-item-row">
            <span className="block-number">{idx + 1}.</span>
            <input
              className="form-input"
              type="text"
              value={obj}
              onChange={(e) => handleObjectiveChange(idx, e.target.value)}
              placeholder="Objective text..."
            />
            {objectives.length > 1 && (
              <button
                type="button"
                className="btn-block-action danger"
                onClick={() => handleRemoveObjective(idx)}
                title="Remove objective"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
