"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowDown, ArrowUp, Loader2, Plus, Save, Sparkles, Trash2, Eye, Printer } from "lucide-react";
import { useAssessmentStore } from "@/stores/assessment-store";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import type { LessonPlan } from "@/schemas/lesson";
import type { AssessmentItemType } from "@/schemas/assessment";
import "@/components/assessment/assessment.css";
import { LinkedLessonUnavailable } from "@/components/library/library-states";

type AssessmentPageProps = {
  params: Promise<{ id: string }>;
};

export default function AssessmentPage({ params }: AssessmentPageProps) {
  const router = useRouter();
  const { id: lessonId } = use(params);

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<AssessmentItemType[]>(["multiple_choice"]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "average" | "difficult">("average");
  const [itemCount, setItemCount] = useState<number>(5);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [viewMode, setViewMode] = useState<"student" | "answer_key">("answer_key");
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    activeAssessment,
    currentEditItemId,
    isLoading,
    isDirty,
    errorState,
    loadAssessment,
    generateAssessmentFromLesson,
    updateItem,
    reorderItems,
    addItem,
    removeItem,
    saveAssessment,
    setCurrentEditItemId,
    clearError,
  } = useAssessmentStore();

  useEffect(() => {
    if (lessonId) {
      void (async () => {
        try {
          const match = await defaultStorageAdapter.getLesson(lessonId);
          if (!match) return setLoadError("The lesson may have been removed, or this account no longer has access to it.");
          setLesson(match);
          await loadAssessment(lessonId);
        } catch { setLoadError("The lesson and assessment repository could not be reached. Try again from My Lesson Plans."); }
      })();
    }
  }, [lessonId, loadAssessment, router]);

  if (loadError) return <LinkedLessonUnavailable message={loadError} />;
  if (!lesson) {
    return (
      <div className="fullscreen-loading">
        <Loader2 className="spinner" />
        <span>Loading lesson details...</span>
      </div>
    );
  }

  const activeItem = activeAssessment?.items.find((i) => i.id === currentEditItemId) || null;
  const activeItemIdx = activeAssessment ? activeAssessment.items.findIndex((i) => i.id === currentEditItemId) : -1;

  async function handleStartGeneration() {
    if (lesson) {
      await generateAssessmentFromLesson(lesson, selectedTypes, selectedDifficulty, itemCount, additionalInstructions);
    }
  }

  function handleTypeToggle(type: AssessmentItemType) {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  }

  function handleChoiceChange(choiceIdx: number, val: string) {
    if (!activeItem) return;
    const choices = [...(activeItem.choices || [])];
    choices[choiceIdx] = val;
    updateItem(activeItem.id, { choices });
  }

  function handleAddChoice() {
    if (!activeItem) return;
    const choices = [...(activeItem.choices || [])];
    choices.push(`Option ${choices.length + 1}`);
    updateItem(activeItem.id, { choices });
  }

  function handleRemoveChoice(choiceIdx: number) {
    if (!activeItem) return;
    const choices = (activeItem.choices || []).filter((_, idx) => idx !== choiceIdx);
    updateItem(activeItem.id, { choices });
  }

  return (
    <div className="lesson-create-container" style={{ maxWidth: "1280px", padding: "20px" }}>
      {/* Top Header bar */}
      <div className="lesson-create-header-nav no-print" style={{ marginBottom: "16px" }}>
        <button
          className="lesson-back-btn"
          onClick={() => router.push(`/lesson/${lessonId}`)}
          type="button"
        >
          <ArrowLeft size={16} /> Back to Editor
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isDirty && (
            <span
              className="lesson-step-badge"
              style={{ background: "#fff5f7", color: "#e44b66", border: "1px solid #f8c8d1" }}
            >
              Unsaved Changes
            </span>
          )}

          {activeAssessment && (
            <>
              <button
                className="btn-section-ai"
                onClick={() => window.print()}
                style={{ padding: "8px 14px", fontSize: "12px", border: "1px solid #dde2ec", color: "#4a5874" }}
                type="button"
              >
                <Printer size={14} /> Print Exam Sheet
              </button>
              <button
                className="btn-primary-generate"
                onClick={saveAssessment}
                style={{ padding: "8px 16px", fontSize: "12px" }}
                type="button"
              >
                <Save size={14} /> Save Assessment
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Title Block */}
      <div className="lesson-create-title-block no-print" style={{ marginBottom: "20px" }}>
        <h1>AI Assessment Generator</h1>
        <p>Compile aligned formative and summative test items for &quot;{lesson.title}&quot;.</p>
      </div>

      {errorState && (
        <div className="section-error-inline no-print" style={{ marginBottom: "16px" }}>
          <span>{errorState}</span>
          <button
            style={{ marginLeft: "auto", border: "0", background: "transparent", cursor: "pointer", fontWeight: "700" }}
            onClick={clearError}
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Generating Loader */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "100px 0" }}>
          <Loader2 className="spinner" size={48} style={{ color: "#5637f5", marginBottom: "16px" }} />
          <strong style={{ fontSize: "16px", color: "#1a2238" }}>Generating Assessment Items...</strong>
          <span style={{ fontSize: "12px", color: "#7b88a2", marginTop: "4px" }}>
            Aligning quiz questions with target competencies and standards...
          </span>
        </div>
      ) : !activeAssessment ? (
        /* Configuration Parameters panel */
        <div className="panel" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
          <Sparkles size={36} color="#5637f5" style={{ margin: "0 auto 16px", display: "block" }} />
          <h2 style={{ fontSize: "18px", fontWeight: "750", color: "#151928", marginBottom: "8px", textAlign: "center" }}>
            Assessment Configuration
          </h2>
          <p style={{ color: "#54627e", fontSize: "12px", marginBottom: "24px", textAlign: "center" }}>
            Configure the quiz formats, question count, and difficulty matching your lesson plan.
          </p>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="field-label">Included Item Formats</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "6px" }}>
              {(["multiple_choice", "true_or_false", "identification", "essay", "performance_task"] as AssessmentItemType[]).map((type) => (
                <label key={type} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                  />
                  {type.replace(/_/g, " ").toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="field-label" htmlFor="select-diff">Difficulty Level</label>
            <select
              id="select-diff"
              className="form-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as "easy" | "average" | "difficult")}
            >
              <option value="easy">Easy (Knowledge / Recall)</option>
              <option value="average">Average (Understanding / Application)</option>
              <option value="difficult">Difficult (Analysis / Evaluation)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="field-label" htmlFor="input-count">Number of Items</label>
            <input
              id="input-count"
              type="number"
              className="form-input"
              value={itemCount}
              onChange={(e) => setItemCount(Math.max(1, Math.min(30, parseInt(e.target.value, 10) || 5)))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="field-label" htmlFor="input-teacher-instr">Additional Teacher Instructions (Optional)</label>
            <textarea
              id="input-teacher-instr"
              className="form-textarea"
              placeholder="e.g. Focus questions on plant vs animal cell comparisons..."
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={3}
            />
          </div>

          <button
            className="btn-primary-generate"
            style={{ width: "100%", padding: "12px" }}
            onClick={handleStartGeneration}
            type="button"
          >
            <Sparkles size={16} /> Generate Assessment with AI
          </button>
        </div>
      ) : (
        /* Workspace Editor */
        <div className="assessment-workspace">
          {/* Left panel: Thumbnail rail */}
          <nav className="assessment-thumbnail-rail no-print" aria-label="Questions list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="field-label" style={{ margin: "0" }}>Questions</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {(["multiple_choice", "true_or_false", "identification", "essay"] as AssessmentItemType[]).map((t) => (
                  <button
                    key={t}
                    className="btn-block-action"
                    onClick={() => addItem(t)}
                    title={`Add ${t.replace(/_/g, " ")}`}
                    style={{ width: "20px", height: "20px", fontSize: "10px" }}
                    type="button"
                  >
                    +
                  </button>
                ))}
              </div>
            </div>

            <ul className="item-list">
              {activeAssessment.items.map((item, idx) => (
                <li
                  key={item.id}
                  className={`item-card ${currentEditItemId === item.id ? "active" : ""}`}
                  onClick={() => setCurrentEditItemId(item.id)}
                >
                  <div className="item-card-title">{idx + 1}. {item.question}</div>
                  <div className="item-card-meta">
                    <span>{item.type.toUpperCase()}</span>
                    <span>{item.points} PTS</span>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn-section-ai"
                onClick={() => reorderItems(activeItemIdx, activeItemIdx - 1)}
                disabled={activeItemIdx <= 0}
                style={{ padding: "6px" }}
                type="button"
              >
                <ArrowUp size={12} />
              </button>
              <button
                className="btn-section-ai"
                onClick={() => reorderItems(activeItemIdx, activeItemIdx + 1)}
                disabled={activeItemIdx === -1 || activeItemIdx === activeAssessment.items.length - 1}
                style={{ padding: "6px" }}
                type="button"
              >
                <ArrowDown size={12} />
              </button>
              <button
                className="btn-section-ai undo-btn"
                onClick={() => removeItem(activeItem!.id)}
                disabled={activeAssessment.items.length <= 1 || !activeItem}
                style={{ padding: "6px", marginLeft: "auto" }}
                type="button"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </nav>

          {/* Center Panel: Exam Sheet Preview */}
          <main className="assessment-sheet-wrapper" aria-label="Exam Preview Sheet">
            {/* View Mode controls */}
            <div className="no-print" style={{ display: "flex", gap: "10px", borderBottom: "1px solid #dde2ec", paddingBottom: "10px" }}>
              <button
                className={`btn-section-ai ${viewMode === "student" ? "active" : ""}`}
                onClick={() => setViewMode("student")}
                type="button"
              >
                <Eye size={12} /> Student Version
              </button>
              <button
                className={`btn-section-ai ${viewMode === "answer_key" ? "active" : ""}`}
                onClick={() => setViewMode("answer_key")}
                type="button"
              >
                <Printer size={12} /> Teacher Answer Key
              </button>
            </div>

            <div className="assessment-sheet">
              <h1>{activeAssessment.title}</h1>
              <h2>{viewMode === "answer_key" ? "TEACHER ANSWER KEY" : "STUDENT QUESTION SHEET"}</h2>

              <div className="assessment-meta-grid">
                <div><strong>Student Name:</strong> ___________________________</div>
                <div><strong>Date:</strong> ___________________________</div>
                <div><strong>Grade &amp; Section:</strong> ${lesson.gradeLevel} - _________________</div>
                <div><strong>Subject Area:</strong> ${lesson.subject}</div>
              </div>

              <div className="assessment-instructions">
                <strong>General Instructions:</strong> {activeAssessment.instructions}
              </div>

              <div className="assessment-items-container">
                {activeAssessment.items.map((item, idx) => (
                  <div key={item.id} className="sheet-item">
                    <div className="sheet-item-header">
                      {idx + 1}. {item.question} <span style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b" }}>({item.points} pts)</span>
                    </div>

                    {(item.type === "multiple_choice" || item.type === "true_or_false") && item.choices && (
                      <div className="sheet-item-choices">
                        {item.choices.map((choice, cIdx) => (
                          <div key={cIdx} className="sheet-item-choice">
                            <span>({String.fromCharCode(65 + cIdx)})</span>
                            <span>{choice}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.type === "identification" && viewMode === "student" && (
                      <div style={{ marginTop: "12px" }}>
                        Answer: __________________________________________________
                      </div>
                    )}

                    {item.type === "essay" && viewMode === "student" && (
                      <div style={{ marginTop: "12px", border: "1px solid #e2e8f0", height: "80px", borderRadius: "6px" }} />
                    )}

                    {item.type === "performance_task" && viewMode === "student" && (
                      <div style={{ marginTop: "12px", border: "1px dashed #cbd5e1", padding: "12px", fontSize: "12px", color: "#64748b" }}>
                        (Perform the task as instructed by your teacher. Expected deliverables will be graded based on the rubric.)
                      </div>
                    )}

                    {viewMode === "answer_key" && (
                      <div>
                        <div className="sheet-item-answer">
                          Correct Answer / Key: {item.answer}
                        </div>
                        {item.rubric && (
                          <div className="sheet-item-rubric">
                            <strong>Grading Rubric:</strong> {item.rubric}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Panel: Item Editor */}
          {activeItem && (
            <aside className="assessment-editor-controls no-print" aria-label="Question Edit Panel">
              <h3 style={{ fontSize: "12px", fontWeight: "750", color: "#1a2238", marginBottom: "14px", borderBottom: "1px solid #edf0f6", paddingBottom: "8px" }}>
                Edit Question {activeItemIdx + 1}
              </h3>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="question-input">Question Statement</label>
                <textarea
                  id="question-input"
                  className="form-textarea"
                  value={activeItem.question}
                  onChange={(e) => updateItem(activeItem.id, { question: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="points-input">Points Value</label>
                <input
                  id="points-input"
                  type="number"
                  className="form-input"
                  value={activeItem.points}
                  onChange={(e) => updateItem(activeItem.id, { points: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
              </div>

              {(activeItem.type === "multiple_choice" || activeItem.type === "true_or_false") && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="field-label" style={{ margin: "0" }}>Option Choices</label>
                    {activeItem.type === "multiple_choice" && (
                      <button
                        className="btn-block-action"
                        style={{ width: "20px", height: "20px" }}
                        onClick={handleAddChoice}
                        title="Add Choice"
                        type="button"
                      >
                        <Plus size={11} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: "6px" }}>
                    {(activeItem.choices || []).map((choice, cIdx) => (
                      <div key={cIdx} style={{ display: "flex", gap: "6px" }}>
                        <span style={{ fontSize: "12px", alignSelf: "center" }}>({String.fromCharCode(65 + cIdx)})</span>
                        <input
                          className="form-input"
                          type="text"
                          value={choice}
                          onChange={(e) => handleChoiceChange(cIdx, e.target.value)}
                        />
                        {activeItem.type === "multiple_choice" && (activeItem.choices || []).length > 2 && (
                          <button
                            className="btn-block-action danger"
                            onClick={() => handleRemoveChoice(cIdx)}
                            type="button"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="answer-input">Correct Answer / Key</label>
                <input
                  id="answer-input"
                  className="form-input"
                  type="text"
                  value={activeItem.answer}
                  onChange={(e) => updateItem(activeItem.id, { answer: e.target.value })}
                />
              </div>

              {(activeItem.type === "essay" || activeItem.type === "performance_task") && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="field-label" htmlFor="rubric-input">Grading Rubric / Criteria</label>
                  <textarea
                    id="rubric-input"
                    className="form-textarea"
                    value={activeItem.rubric || ""}
                    onChange={(e) => updateItem(activeItem.id, { rubric: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
