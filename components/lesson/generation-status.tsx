"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

type GenerationStatusProps = {
  isGenerating: boolean;
  curriculum: string;
  errorMessage: string | null;
  errorCategory: string | null;
  onCancel: () => void;
  onRetry: () => void;
};

export function GenerationStatusRegion({
  isGenerating,
  curriculum,
  errorMessage,
  errorCategory,
  onCancel,
  onRetry,
}: GenerationStatusProps) {
  return (
    <div className="generation-status-region" id="generation-status-region">
      {/* Header Bar */}
      <div className="status-region-header">
        <div className={`status-pulse-dot ${isGenerating ? "active-pulse" : errorMessage ? "error-dot" : ""}`} />
        <div>
          <strong>
            {isGenerating
              ? "Generating AI Lesson Plan..."
              : errorMessage
              ? "Generation Interrupted"
              : "Generation Pipeline Status"}
          </strong>
          <p>
            {isGenerating
              ? `Assembling structured ${curriculum} lesson plan. Please wait a moment.`
              : errorMessage
              ? "An error occurred while generating your lesson. Your inputs are preserved."
              : "Form inputs validated and ready for structured AI generation payload assembly."}
          </p>
        </div>
      </div>

      {/* Honest Staged Progress Checklist */}
      <ul className="status-checklist">
        {/* Stage 1: Preflight Setup */}
        <li className="status-check-item done">
          <CheckCircle2 className="check" size={15} />
          <span>Reading lesson setup & parameters (Zod schema verified)</span>
        </li>

        {/* Stage 2: Curriculum Context */}
        <li className="status-check-item done">
          <CheckCircle2 className="check" size={15} />
          <span>Curriculum framework context loaded ({curriculum})</span>
        </li>

        {/* Stage 3: Objectives & Procedures (Indeterminate Progress during AI request) */}
        <li className={`status-check-item ${isGenerating ? "active" : errorMessage ? "pending" : "pending"}`}>
          {isGenerating ? (
            <Loader2 className="spinner" size={15} />
          ) : (
            <span className="dot-idle" />
          )}
          <span>
            {isGenerating
              ? "Generating learning objectives, procedures & dialogues..."
              : "Creating learning objectives & procedure steps"}
          </span>
        </li>

        {/* Stage 4: Assessment & Synthesis */}
        <li className="status-check-item pending">
          <span className="dot-idle" />
          <span>Building assessment items & values synthesis</span>
        </li>

        {/* Stage 5: Finalizing Structure */}
        <li className="status-check-item pending">
          <span className="dot-idle" />
          <span>Finalizing lesson plan structure & standards</span>
        </li>
      </ul>

      {/* Active Generation Controls */}
      {isGenerating && (
        <div className="generation-active-bar">
          <div className="generating-indicator">
            <Sparkles className="sparkle-spin" size={16} />
            <span>AI model is generating your structured lesson...</span>
          </div>
          <button
            className="btn-cancel-generation"
            onClick={onCancel}
            type="button"
          >
            <XCircle aria-hidden="true" size={15} />
            <span>Cancel Generation</span>
          </button>
        </div>
      )}

      {/* Actionable Error Alert & Retry Button */}
      {errorMessage && (
        <div className="generation-error-alert" role="alert">
          <div className="error-alert-header">
            <AlertCircle className="error-icon" size={18} />
            <div>
              <strong>Lesson Generation Failed ({errorCategory || "ERROR"})</strong>
              <p>{errorMessage}</p>
            </div>
          </div>
          <div className="error-alert-actions">
            <button
              className="btn-retry-generation"
              onClick={onRetry}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={15} />
              <span>Retry Generation</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
