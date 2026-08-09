"use client";

import {
  AlertCircle,
  BookOpen,
  Loader2,
  Maximize2,
  RefreshCw,
  Sparkles,
  Undo,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import type { SectionActionType, SectionType } from "@/lib/ai/rewrite-section";
import { useLessonStore } from "@/stores/lesson-store";

type SectionActionBarProps = {
  sectionType: SectionType;
  currentContent: any;
  onApplyResult: (updatedContent: any) => void;
  previousContent?: any;
  onUndo?: () => void;
};

export function SectionActionBar({
  sectionType,
  currentContent,
  onApplyResult,
  previousContent,
  onUndo,
}: SectionActionBarProps) {
  const { activeLesson } = useLessonStore();
  const [isLoading, setIsLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!activeLesson) return null;

  async function handleExecuteAction(action: SectionActionType, promptText?: string) {
    if (!activeLesson) return;

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      action,
      sectionType,
      currentContent,
      curriculum: activeLesson.curriculum,
      lessonType: activeLesson.lessonType,
      gradeLevel: activeLesson.gradeLevel,
      subject: activeLesson.subject,
      topic: activeLesson.subjectMatter.topic,
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
        onApplyResult(data.updatedContent);
        setCustomPrompt("");
        setShowCustomInput(false);
      } else {
        setErrorMsg(data.error?.message || "Section rewrite failed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="section-ai-action-bar">
      <div className="action-buttons-group">
        <span className="action-bar-label">
          <Sparkles size={12} color="#5637f5" /> Section AI Actions:
        </span>

        <button
          type="button"
          className="btn-section-ai"
          onClick={() => handleExecuteAction("simplify")}
          disabled={isLoading}
          title="Simplify language for struggling learners"
        >
          <Wand2 size={12} /> Simplify
        </button>

        <button
          type="button"
          className="btn-section-ai"
          onClick={() => handleExecuteAction("expand")}
          disabled={isLoading}
          title="Expand with more detail and Philippine classroom examples"
        >
          <Maximize2 size={12} /> Expand
        </button>

        <button
          type="button"
          className="btn-section-ai"
          onClick={() => handleExecuteAction("formalize")}
          disabled={isLoading}
          title="Formalize language for DepEd compliance"
        >
          <BookOpen size={12} /> Formalize
        </button>

        <button
          type="button"
          className="btn-section-ai"
          onClick={() => handleExecuteAction("regenerate")}
          disabled={isLoading}
          title="Regenerate this section with fresh ideas"
        >
          <RefreshCw size={12} /> Regenerate
        </button>

        <button
          type="button"
          className="btn-section-ai secondary"
          onClick={() => setShowCustomInput(!showCustomInput)}
          disabled={isLoading}
        >
          {showCustomInput ? "Hide Custom" : "Custom Rule..."}
        </button>

        {previousContent && onUndo && (
          <button
            type="button"
            className="btn-section-ai undo-btn"
            onClick={onUndo}
            disabled={isLoading}
            title="Restore previous section content"
          >
            <Undo size={12} /> Undo Edit
          </button>
        )}

        {isLoading && (
          <span className="section-loading-indicator">
            <Loader2 className="spinner" size={13} /> Rewriting section...
          </span>
        )}
      </div>

      {showCustomInput && (
        <div className="custom-prompt-input-block">
          <input
            type="text"
            className="form-input custom-input"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Include a 5-minute group recitation game..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleExecuteAction("regenerate", customPrompt);
              }
            }}
          />
          <button
            type="button"
            className="btn-primary-generate"
            style={{ padding: "6px 14px", fontSize: "11px" }}
            onClick={() => handleExecuteAction("regenerate", customPrompt)}
            disabled={isLoading || !customPrompt.trim()}
          >
            Apply Instruction
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="section-error-inline" role="alert">
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
