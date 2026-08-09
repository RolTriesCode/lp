"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowDown, ArrowUp, Loader2, Plus, Save, Sparkles, Trash2, Eye, Printer } from "lucide-react";
import { useWorksheetStore } from "@/stores/worksheet-store";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import type { LessonPlan } from "@/schemas/lesson";
import "@/components/worksheet/worksheet.css";
import { LinkedLessonUnavailable } from "@/components/library/library-states";

type WorksheetPageProps = {
  params: Promise<{ id: string }>;
};

export default function WorksheetPage({ params }: WorksheetPageProps) {
  const router = useRouter();
  const { id: lessonId } = use(params);

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "average" | "difficult">("average");
  const [itemCount, setItemCount] = useState<number>(5);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [viewMode, setViewMode] = useState<"student" | "answer_key">("answer_key");
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    activeWorksheet,
    currentEditItemId,
    isLoading,
    isDirty,
    errorState,
    loadWorksheet,
    generateWorksheetFromLesson,
    updateItem,
    reorderItems,
    addItem,
    removeItem,
    saveWorksheet,
    setCurrentEditItemId,
    clearError,
  } = useWorksheetStore();

  useEffect(() => {
    if (lessonId) {
      void (async () => {
        try {
          const match = await defaultStorageAdapter.getLesson(lessonId);
          if (!match) return setLoadError("The lesson may have been removed, or this account no longer has access to it.");
          setLesson(match);
          await loadWorksheet(lessonId);
        } catch { setLoadError("The lesson and worksheet repository could not be reached. Try again from My Lesson Plans."); }
      })();
    }
  }, [lessonId, loadWorksheet, router]);

  if (loadError) return <LinkedLessonUnavailable message={loadError} />;
  if (!lesson) {
    return (
      <div className="fullscreen-loading">
        <Loader2 className="spinner" />
        <span>Loading lesson details...</span>
      </div>
    );
  }

  const activeItem = activeWorksheet?.items.find((i) => i.id === currentEditItemId) || null;
  const activeItemIdx = activeWorksheet ? activeWorksheet.items.findIndex((i) => i.id === currentEditItemId) : -1;

  async function handleStartGeneration() {
    if (lesson) {
      await generateWorksheetFromLesson(lesson, selectedDifficulty, itemCount, additionalInstructions);
    }
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

          {activeWorksheet && (
            <>
              <button
                className="btn-section-ai"
                onClick={() => window.print()}
                style={{ padding: "8px 14px", fontSize: "12px", border: "1px solid #dde2ec", color: "#4a5874" }}
                type="button"
              >
                <Printer size={14} /> Print Worksheet
              </button>
              <button
                className="btn-primary-generate"
                onClick={saveWorksheet}
                style={{ padding: "8px 16px", fontSize: "12px" }}
                type="button"
              >
                <Save size={14} /> Save Worksheet
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Title Block */}
      <div className="lesson-create-title-block no-print" style={{ marginBottom: "20px" }}>
        <h1>AI Worksheet Generator</h1>
        <p>Generate learner study sheets, activity pages, and exercises for &quot;{lesson.title}&quot;.</p>
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
          <strong style={{ fontSize: "16px", color: "#1a2238" }}>Generating Worksheet Activities...</strong>
          <span style={{ fontSize: "12px", color: "#7b88a2", marginTop: "4px" }}>
            Extracting topics and compiling exercises matching curriculum focus...
          </span>
        </div>
      ) : !activeWorksheet ? (
        /* Configuration Parameters panel */
        <div className="panel" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
          <Sparkles size={36} color="#5637f5" style={{ margin: "0 auto 16px", display: "block" }} />
          <h2 style={{ fontSize: "18px", fontWeight: "750", color: "#151928", marginBottom: "8px", textAlign: "center" }}>
            Worksheet Configuration
          </h2>
          <p style={{ color: "#54627e", fontSize: "12px", marginBottom: "24px", textAlign: "center" }}>
            Choose difficulty settings and task targets matching your student capabilities.
          </p>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="field-label" htmlFor="select-diff">Difficulty Level</label>
            <select
              id="select-diff"
              className="form-select"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as "easy" | "average" | "difficult")}
            >
              <option value="easy">Easy (Reinforcement Activities)</option>
              <option value="average">Average (Standard Exercises)</option>
              <option value="difficult">Difficult (Critical Analysis / Extension)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="field-label" htmlFor="input-count">Number of Activity Tasks</label>
            <input
              id="input-count"
              type="number"
              className="form-input"
              value={itemCount}
              onChange={(e) => setItemCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 5)))}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="field-label" htmlFor="input-teacher-instr">Additional Teacher Instructions (Optional)</label>
            <textarea
              id="input-teacher-instr"
              className="form-textarea"
              placeholder="e.g. Include a word bank for terms, or add visual drawing prompts..."
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
            <Sparkles size={16} /> Generate Worksheet with AI
          </button>
        </div>
      ) : (
        /* Workspace Editor */
        <div className="worksheet-workspace">
          {/* Left panel: Thumbnail rail */}
          <nav className="worksheet-thumbnail-rail no-print" aria-label="Activity list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="field-label" style={{ margin: "0" }}>Activity Tasks</span>
              <button
                className="btn-block-action"
                onClick={addItem}
                title="Add New Task Item"
                style={{ width: "20px", height: "20px" }}
                type="button"
              >
                <Plus size={11} />
              </button>
            </div>

            <ul className="worksheet-item-list">
              {activeWorksheet.items.map((item, idx) => (
                <li
                  key={item.id}
                  className={`worksheet-item-card ${currentEditItemId === item.id ? "active" : ""}`}
                  onClick={() => setCurrentEditItemId(item.id)}
                >
                  <div className="worksheet-item-card-title">{idx + 1}. {item.question}</div>
                  <div className="worksheet-item-card-meta">
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
                disabled={activeItemIdx === -1 || activeItemIdx === activeWorksheet.items.length - 1}
                style={{ padding: "6px" }}
                type="button"
              >
                <ArrowDown size={12} />
              </button>
              <button
                className="btn-section-ai undo-btn"
                onClick={() => removeItem(activeItem!.id)}
                disabled={activeWorksheet.items.length <= 1 || !activeItem}
                style={{ padding: "6px", marginLeft: "auto" }}
                type="button"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </nav>

          {/* Center Panel: Printable sheet */}
          <main className="worksheet-sheet-wrapper" aria-label="Worksheet Preview Sheet">
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

            <div className="worksheet-sheet">
              <h1>{activeWorksheet.title}</h1>
              <h2>{viewMode === "answer_key" ? "TEACHER ANSWER KEY" : "LEARNER ACTIVITY WORKSHEET"}</h2>

              <div className="worksheet-meta-grid">
                <div><strong>Learner Name:</strong> ___________________________</div>
                <div><strong>Date:</strong> ___________________________</div>
                <div><strong>Grade Level:</strong> ${lesson.gradeLevel}</div>
                <div><strong>Learning Area:</strong> ${lesson.subject}</div>
              </div>

              <div className="worksheet-instructions">
                <strong>Directions:</strong> {activeWorksheet.instructions}
              </div>

              <div className="worksheet-items-container">
                {activeWorksheet.items.map((item, idx) => (
                  <div key={item.id} className="sheet-worksheet-item">
                    <div className="sheet-worksheet-item-header">
                      Activity {idx + 1}: {item.question} <span style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b" }}>({item.points} pts)</span>
                    </div>

                    {item.hint && viewMode === "student" && (
                      <div className="sheet-worksheet-item-hint">
                        Hint: {item.hint}
                      </div>
                    )}

                    {viewMode === "student" && (
                      <div style={{ marginTop: "16px", borderBottom: "1px solid #cbd5e1", height: "40px" }} />
                    )}

                    {viewMode === "answer_key" && (
                      <div>
                        <div className="sheet-worksheet-item-answer">
                          Expected Answer / Solution: {item.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Panel: Item Editor */}
          {activeItem && (
            <aside className="worksheet-editor-controls no-print" aria-label="Activity Item Edit Panel">
              <h3 style={{ fontSize: "12px", fontWeight: "750", color: "#1a2238", marginBottom: "14px", borderBottom: "1px solid #edf0f6", paddingBottom: "8px" }}>
                Edit Task {activeItemIdx + 1}
              </h3>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="task-prompt-input">Task Prompt / Question</label>
                <textarea
                  id="task-prompt-input"
                  className="form-textarea"
                  value={activeItem.question}
                  onChange={(e) => updateItem(activeItem.id, { question: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="task-points-input">Points Value</label>
                <input
                  id="task-points-input"
                  type="number"
                  className="form-input"
                  value={activeItem.points}
                  onChange={(e) => updateItem(activeItem.id, { points: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="task-hint-input">Learner Hint / Scaffolding Tip</label>
                <input
                  id="task-hint-input"
                  className="form-input"
                  type="text"
                  value={activeItem.hint || ""}
                  onChange={(e) => updateItem(activeItem.id, { hint: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="task-answer-input">Expected Answer / Solution</label>
                <textarea
                  id="task-answer-input"
                  className="form-textarea"
                  value={activeItem.answer}
                  onChange={(e) => updateItem(activeItem.id, { answer: e.target.value })}
                  rows={4}
                />
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
