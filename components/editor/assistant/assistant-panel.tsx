"use client";

import {
  AlertCircle,
  Brain,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import type { SectionActionType } from "@/lib/ai/rewrite-section";
import { useLessonStore } from "@/stores/lesson-store";

export function AssistantPanel() {
  const { activeLesson, selectedSectionType, updateSection } = useLessonStore();
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [proposedSuggestion, setProposedSuggestion] = useState<any | null>(null);

  if (!activeLesson) return null;

  const currentSectionContent = selectedSectionType
    ? activeLesson[selectedSectionType as keyof typeof activeLesson]
    : null;

  const isEnabled =
    selectedSectionType &&
    selectedSectionType !== "metadata" &&
    selectedSectionType !== "standards" &&
    selectedSectionType !== "subjectMatter";

  async function handleExecuteAction(action: SectionActionType, promptText?: string) {
    if (!activeLesson || !selectedSectionType) return;

    setIsLoading(true);
    setErrorMsg(null);
    setProposedSuggestion(null);

    const curriculum = activeLesson.curriculum;
    const lessonType = activeLesson.lessonType;
    const gradeLevel = activeLesson.gradeLevel;
    const subject = activeLesson.subject;
    const topic = activeLesson.subjectMatter.topic;

    const payload = {
      action,
      sectionType: selectedSectionType,
      currentContent: currentSectionContent,
      curriculum,
      lessonType,
      gradeLevel,
      subject,
      topic,
      customPrompt: promptText || customPrompt,
    };

    try {
      const response = await fetch("/api/ai/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setProposedSuggestion(data.updatedContent);
        setCustomPrompt("");
      } else {
        setErrorMsg(data.error?.message || "Assistant suggestion generation failed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }

  function handleApplySuggestion() {
    if (selectedSectionType && proposedSuggestion) {
      updateSection(selectedSectionType as any, proposedSuggestion);
      setProposedSuggestion(null);
    }
  }

  function handleDiscardSuggestion() {
    setProposedSuggestion(null);
  }

  return (
    <aside className="assistant-panel" aria-label="Contextual AI Assistant">
      <div className="assistant-header">
        <Brain className="brain-icon" size={18} />
        <div>
          <h3>Contextual AI Assistant</h3>
          <p>
            {selectedSectionType
              ? `Focused on: ${selectedSectionType.toUpperCase()}`
              : "Select a section card to begin"}
          </p>
        </div>
      </div>

      {!isEnabled ? (
        <div className="assistant-empty-state">
          <p>
            Select an editable card (Objectives, Procedures, Assessment, or Reflection) to enable focused AI assistant actions.
          </p>
        </div>
      ) : (
        <div className="assistant-content">
          {/* Quick Actions List */}
          <div className="assistant-actions-list">
            <span className="action-list-header">Quick Assistant Tools</span>

            <button
              className="btn-assistant-tool"
              onClick={() => handleExecuteAction("simplify")}
              disabled={isLoading}
              type="button"
            >
              <Sparkles size={13} />
              <span>Simplify Vocabulary & Scope</span>
            </button>

            <button
              className="btn-assistant-tool"
              onClick={() =>
                handleExecuteAction(
                  "regenerate",
                  "Differentiate for learners of varying abilities: include support scaffoldings for struggling learners and extension questions for advanced learners."
                )
              }
              disabled={isLoading}
              type="button"
            >
              <Sparkles size={13} />
              <span>Differentiate for Learners</span>
            </button>

            {selectedSectionType === "procedures" && (
              <button
                className="btn-assistant-tool"
                onClick={() => handleExecuteAction("add_activity")}
                disabled={isLoading}
                type="button"
              >
                <Sparkles size={13} />
                <span>Add Differentiated Group Activity</span>
              </button>
            )}

            {selectedSectionType === "assessment" && (
              <button
                className="btn-assistant-tool"
                onClick={() => handleExecuteAction("create_assessment")}
                disabled={isLoading}
                type="button"
              >
                <Sparkles size={13} />
                <span>Generate Extra Quiz Items</span>
              </button>
            )}

            <button
              className="btn-assistant-tool"
              onClick={() => handleExecuteAction("formalize")}
              disabled={isLoading}
              type="button"
            >
              <Sparkles size={13} />
              <span>Improve Clarity & Academic Rigor</span>
            </button>
          </div>

          {/* Custom Instruction Box */}
          <div className="assistant-custom-box">
            <label className="field-label">Custom Instruction for Section</label>
            <textarea
              className="form-textarea custom-instruction-input"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Translate key student responses to Filipino; make the motivation step a game..."
              rows={3}
              disabled={isLoading}
            />
            <button
              className="btn-primary-generate"
              style={{ width: "100%", padding: "8px", fontSize: "11px", marginTop: "8px" }}
              onClick={() => handleExecuteAction("regenerate")}
              disabled={isLoading || !customPrompt.trim()}
              type="button"
            >
              Apply Context Custom Rule
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="assistant-loading-box">
              <span className="spinner-dot" />
              <span>Assistant is generating proposed changes...</span>
            </div>
          )}

          {/* Error Inline */}
          {errorMsg && (
            <div className="section-error-inline" style={{ marginTop: "12px" }}>
              <AlertCircle size={14} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Suggested Diff Review Panel */}
          {proposedSuggestion && (
            <div className="suggestion-review-card" role="dialog" aria-labelledby="suggestion-title">
              <h4 id="suggestion-title">Proposed Suggestion Review</h4>
              <p className="review-hint">Verify changes before applying to the lesson card.</p>

              <div className="suggestion-diff-container">
                <div className="diff-view-panel">
                  <span className="diff-view-label proposed">PROPOSED SUGGESTION:</span>
                  <pre className="diff-raw-text">
                    {typeof proposedSuggestion === "string"
                      ? proposedSuggestion
                      : JSON.stringify(proposedSuggestion, null, 2)}
                  </pre>
                </div>
              </div>

              <div className="suggestion-action-footer">
                <button
                  className="btn-assistant-action discard"
                  onClick={handleDiscardSuggestion}
                  type="button"
                >
                  <X size={13} /> Discard
                </button>
                <button
                  className="btn-assistant-action apply"
                  onClick={handleApplySuggestion}
                  type="button"
                >
                  <Check size={13} /> Apply Suggestion
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
