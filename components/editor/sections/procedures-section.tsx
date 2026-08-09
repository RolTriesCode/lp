"use client";

import { ArrowDown, ArrowUp, Clock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { SectionActionBar } from "@/components/editor/section-action-bar";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { generateBlockId, type LessonPlan, type LessonProcedure } from "@/schemas/lesson";

type ProceduresSectionProps = {
  lesson: LessonPlan;
  onChange: (procedures: LessonProcedure[]) => void;
};

export function ProceduresSection({ lesson, onChange }: ProceduresSectionProps) {
  const procedures = lesson.procedures || [];
  const isDetailed = lesson.lessonType === "DETAILED";
  const [previousProcedures, setPreviousProcedures] = useState<LessonProcedure[] | null>(null);

  function handleApplyAiResult(updatedContent: any) {
    if (Array.isArray(updatedContent)) {
      setPreviousProcedures(procedures);
      onChange(updatedContent);
    }
  }

  function handleUndo() {
    if (previousProcedures) {
      onChange(previousProcedures);
      setPreviousProcedures(null);
    }
  }

  function handleUpdateBlock(index: number, updated: Partial<LessonProcedure>) {
    const list = [...procedures];
    list[index] = {
      ...list[index],
      ...updated,
    };
    onChange(list);
  }

  function handleAddStage() {
    const newStage: LessonProcedure = {
      id: generateBlockId("proc"),
      title: `Stage ${procedures.length + 1}: Activity & Discussion`,
      teacherActivity: "<p>Teacher explains activity rules and concepts.</p>",
      studentActivity: "<p>Students participate in group discussion.</p>",
      content: "Key procedural milestone.",
    };
    onChange([...procedures, newStage]);
  }

  function handleRemoveStage(index: number) {
    if (procedures.length <= 1) return;
    const list = procedures.filter((_, idx) => idx !== index);
    onChange(list);
  }

  function handleMoveStage(index: number, direction: "up" | "down") {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= procedures.length) return;

    const list = [...procedures];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    onChange(list);
  }

  return (
    <section className="lesson-form-card" id="section-procedures">
      <div className="card-header" style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div className="card-icon pink">
            <Clock size={20} />
          </div>
          <div>
            <h2>3. Lesson Procedures & Activities</h2>
            <p>Step-by-step instructional sequence ({isDetailed ? "Detailed Dialogue" : "Semi-Detailed Outline"}).</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleAddStage}
          style={{ padding: "6px 12px", fontSize: "11px" }}
        >
          <Plus size={14} /> Add Stage
        </button>
      </div>

      {/* Section-Level AI Actions */}
      <SectionActionBar
        currentContent={procedures}
        onApplyResult={handleApplyAiResult}
        onUndo={handleUndo}
        previousContent={previousProcedures}
        sectionType="procedures"
      />

      <div className="card-body" style={{ display: "grid", gap: "18px" }}>
        {procedures.map((proc, idx) => (
          <div key={proc.id || idx} className="procedure-block-card">
            {/* Header controls for block */}
            <div className="block-card-header">
              <div className="block-title-edit">
                <span className="block-badge">{idx + 1}</span>
                <input
                  className="form-input block-title-input"
                  type="text"
                  value={proc.title}
                  onChange={(e) => handleUpdateBlock(idx, { title: e.target.value })}
                  placeholder="Procedure Title..."
                />
              </div>

              <div className="block-controls">
                <button
                  type="button"
                  className="btn-block-action"
                  onClick={() => handleMoveStage(idx, "up")}
                  disabled={idx === 0}
                  title="Move Up"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  className="btn-block-action"
                  onClick={() => handleMoveStage(idx, "down")}
                  disabled={idx === procedures.length - 1}
                  title="Move Down"
                >
                  <ArrowDown size={13} />
                </button>
                {procedures.length > 1 && (
                  <button
                    type="button"
                    className="btn-block-action danger"
                    onClick={() => handleRemoveStage(idx)}
                    title="Delete Stage"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Block Fields */}
            <div className="block-card-body">
              {isDetailed ? (
                <>
                  <div className="form-group" style={{ marginBottom: "12px" }}>
                    <label className="field-label teacher-label">Teacher&apos;s Activity Script</label>
                    <TiptapEditor
                      content={proc.teacherActivity || ""}
                      onChange={(html) => handleUpdateBlock(idx, { teacherActivity: html })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label student-label">Students&apos; Activity / Expected Responses</label>
                    <TiptapEditor
                      content={proc.studentActivity || ""}
                      onChange={(html) => handleUpdateBlock(idx, { studentActivity: html })}
                    />
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label className="field-label">Procedural Activity Outline</label>
                  <TiptapEditor
                    content={proc.content || ""}
                    onChange={(html) => handleUpdateBlock(idx, { content: html })}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
