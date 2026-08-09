"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Sparkles, Trash2, Printer } from "lucide-react";
import { useRubricStore } from "@/stores/rubric-store";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import type { LessonPlan } from "@/schemas/lesson";
import "@/components/rubric/rubric.css";
import { LinkedLessonUnavailable } from "@/components/library/library-states";

type RubricPageProps = {
  params: Promise<{ id: string }>;
};

export default function RubricPage({ params }: RubricPageProps) {
  const router = useRouter();
  const { id: lessonId } = use(params);

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [taskDescription, setTaskDescription] = useState<string>("");
  const [levelsText, setLevelsText] = useState<string>("Excellent, Good, Basic");
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    activeRubric,
    currentEditCriterionId,
    isLoading,
    isDirty,
    errorState,
    loadRubric,
    generateRubricFromLesson,
    updateCriterion,
    addCriterion,
    removeCriterion,
    saveRubric,
    setCurrentEditCriterionId,
    clearError,
  } = useRubricStore();

  useEffect(() => {
    if (lessonId) {
      void (async () => {
        try {
          const match = await defaultStorageAdapter.getLesson(lessonId);
          if (!match) return setLoadError("The lesson may have been removed, or this account no longer has access to it.");
          setLesson(match);
          loadRubric(lessonId);
        } catch { setLoadError("The lesson could not be reached. Try again from My Lesson Plans."); }
      })();
    }
  }, [lessonId, loadRubric, router]);

  if (loadError) return <LinkedLessonUnavailable message={loadError} />;
  if (!lesson) {
    return (
      <div className="fullscreen-loading">
        <Loader2 className="spinner" />
        <span>Loading lesson details...</span>
      </div>
    );
  }

  const activeCriterion = activeRubric?.criteria.find((c) => c.id === currentEditCriterionId) || null;

  async function handleStartGeneration() {
    if (lesson && taskDescription) {
      const scaleLevels = levelsText.split(",").map((l) => l.trim()).filter(Boolean);
      await generateRubricFromLesson(lesson, taskDescription, scaleLevels);
    }
  }

  function handleDescriptorChange(level: string, val: string) {
    if (!activeCriterion) return;
    const descriptors = { ...(activeCriterion.descriptors || {}) };
    descriptors[level] = val;
    updateCriterion(activeCriterion.id, { descriptors });
  }

  return (
    <div className="lesson-create-container" style={{ maxWidth: "1280px", padding: "20px" }}>
      {/* Top Header bar */}
      <div className="lesson-create-header-nav no-print" style={{ marginBottom: "16px" }}>
        <button
          className="lesson-back-btn"
          onClick={() => router.push(`/lesson/${lessonId}/pack`)}
          type="button"
        >
          <ArrowLeft size={16} /> Back to Teaching Pack
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

          {activeRubric && (
            <>
              <button
                className="btn-section-ai"
                onClick={() => window.print()}
                style={{ padding: "8px 14px", fontSize: "12px", border: "1px solid #dde2ec", color: "#4a5874" }}
                type="button"
              >
                <Printer size={14} /> Print Rubric Table
              </button>
              <button
                className="btn-primary-generate"
                onClick={saveRubric}
                style={{ padding: "8px 16px", fontSize: "12px" }}
                type="button"
              >
                <Save size={14} /> Save Rubric
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Title Block */}
      <div className="lesson-create-title-block no-print" style={{ marginBottom: "20px" }}>
        <h1>AI Rubric Generator</h1>
        <p>Create transparent performance assessment rubrics for &quot;{lesson.title}&quot;.</p>
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
          <strong style={{ fontSize: "16px", color: "#1a2238" }}>Generating Grading Rubric Table...</strong>
          <span style={{ fontSize: "12px", color: "#7b88a2", marginTop: "4px" }}>
            Writing proficiency descriptors matching task grading target criteria...
          </span>
        </div>
      ) : !activeRubric ? (
        /* Configuration Parameters panel */
        <div className="panel" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}>
          <Sparkles size={36} color="#5637f5" style={{ margin: "0 auto 16px", display: "block" }} />
          <h2 style={{ fontSize: "18px", fontWeight: "750", color: "#151928", marginBottom: "8px", textAlign: "center" }}>
            Rubric Configuration
          </h2>
          <p style={{ color: "#54627e", fontSize: "12px", marginBottom: "24px", textAlign: "center" }}>
            Define the task to grade and achievement headers for grading.
          </p>

          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label className="field-label" htmlFor="input-task-desc">Task / Performance Deliverable to Evaluate</label>
            <textarea
              id="input-task-desc"
              className="form-textarea"
              placeholder="e.g. Graded Essay on Cell Functions, or Oral Presentation on Plant Cell structures..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "24px" }}>
            <label className="field-label" htmlFor="input-levels">Grading Scale Levels (Comma-separated)</label>
            <input
              id="input-levels"
              type="text"
              className="form-input"
              value={levelsText}
              onChange={(e) => setLevelsText(e.target.value)}
            />
          </div>

          <button
            className="btn-primary-generate"
            style={{ width: "100%", padding: "12px" }}
            onClick={handleStartGeneration}
            disabled={!taskDescription}
            type="button"
          >
            <Sparkles size={16} /> Generate Rubric Table with AI
          </button>
        </div>
      ) : (
        /* Workspace Editor */
        <div className="rubric-workspace">
          {/* Left panel: Thumbnail rail */}
          <nav className="rubric-thumbnail-rail no-print" aria-label="Criteria list">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span className="field-label" style={{ margin: "0" }}>Criteria Focus</span>
              <button
                className="btn-block-action"
                onClick={addCriterion}
                title="Add Criterion"
                style={{ width: "20px", height: "20px" }}
                type="button"
              >
                <Plus size={11} />
              </button>
            </div>

            <ul className="rubric-item-list">
              {activeRubric.criteria.map((crit) => (
                <li
                  key={crit.id}
                  className={`rubric-item-card ${currentEditCriterionId === crit.id ? "active" : ""}`}
                  onClick={() => setCurrentEditCriterionId(crit.id)}
                >
                  <div className="rubric-item-card-title">{crit.name}</div>
                  <div className="rubric-item-card-meta">
                    <span>{crit.weight} PTS / Weight</span>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn-section-ai undo-btn"
                onClick={() => removeCriterion(activeCriterion!.id)}
                disabled={activeRubric.criteria.length <= 1 || !activeCriterion}
                style={{ padding: "6px", width: "100%" }}
                type="button"
              >
                <Trash2 size={12} /> Remove Selected
              </button>
            </div>
          </nav>

          {/* Center Panel: Printable Rubric Grid Table */}
          <main className="rubric-sheet-wrapper" aria-label="Rubric Table Preview">
            <div className="rubric-sheet">
              <h1>{activeRubric.title}</h1>
              <h2>GRADING CRITERIA &amp; EVALUATION SCALE</h2>

              <div className="rubric-instructions" style={{ marginBottom: "20px" }}>
                <strong>Evaluator Directions:</strong> {activeRubric.instructions}
              </div>

              <table className="rubric-table">
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>Criterion</th>
                    {activeRubric.levels.map((lvl) => (
                      <th key={lvl} style={{ width: `${75 / activeRubric.levels.length}%` }}>
                        {lvl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeRubric.criteria.map((crit) => (
                    <tr
                      key={crit.id}
                      className={currentEditCriterionId === crit.id ? "active-row" : ""}
                      onClick={() => setCurrentEditCriterionId(crit.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>{crit.name}</strong>
                        <div style={{ fontSize: "10px", color: "#64748b", marginTop: "4px" }}>
                          Max Score: {crit.weight} pts
                        </div>
                      </td>
                      {activeRubric.levels.map((lvl) => (
                        <td key={lvl}>{(crit.descriptors as Record<string, string>)[lvl] || "N/A"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </main>

          {/* Right Panel: Item Editor */}
          {activeCriterion && (
            <aside className="rubric-editor-controls no-print" aria-label="Rubric Criterion Editor">
              <h3 style={{ fontSize: "12px", fontWeight: "750", color: "#1a2238", marginBottom: "14px", borderBottom: "1px solid #edf0f6", paddingBottom: "8px" }}>
                Edit Selected Criterion
              </h3>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="criterion-name-input">Criterion Focus Title</label>
                <input
                  id="criterion-name-input"
                  className="form-input"
                  type="text"
                  value={activeCriterion.name}
                  onChange={(e) => updateCriterion(activeCriterion.id, { name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="criterion-weight-input">Points Weight</label>
                <input
                  id="criterion-weight-input"
                  type="number"
                  className="form-input"
                  value={activeCriterion.weight}
                  onChange={(e) => updateCriterion(activeCriterion.id, { weight: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
              </div>

              <div style={{ borderTop: "1px solid #edf0f6", paddingTop: "12px", marginTop: "12px" }}>
                <strong style={{ fontSize: "11px", color: "#1a2238", display: "block", marginBottom: "8px" }}>
                  Level Performance Descriptors
                </strong>

                {activeRubric.levels.map((lvl) => (
                  <div key={lvl} className="form-group" style={{ marginBottom: "10px" }}>
                    <label className="field-label">{lvl} Descriptor</label>
                    <textarea
                      className="form-textarea"
                      value={(activeCriterion.descriptors as Record<string, string>)[lvl] || ""}
                      onChange={(e) => handleDescriptorChange(lvl, e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
