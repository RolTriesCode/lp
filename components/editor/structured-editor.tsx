"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  Layers,
  Save,
  Sparkles,
  Target,
  Download,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AssistantPanel } from "@/components/editor/assistant/assistant-panel";
import { AssessmentSection } from "@/components/editor/sections/assessment-section";
import { MetadataSection } from "@/components/editor/sections/metadata-section";
import { ObjectivesSection } from "@/components/editor/sections/objectives-section";
import { ProceduresSection } from "@/components/editor/sections/procedures-section";
import { ReflectionSection } from "@/components/editor/sections/reflection-section";
import { StandardsSection } from "@/components/editor/sections/standards-section";
import { SubjectMatterSection } from "@/components/editor/sections/subject-matter-section";
import { useLessonStore } from "@/stores/lesson-store";
import "@/components/editor/editor.css";

export function StructuredEditor() {
  const [activeRailId, setActiveRailId] = useState("section-metadata");
  const {
    activeLesson,
    isDirty,
    updateSection,
    updateActiveLesson,
    saveActiveLesson,
    setSelectedSection,
  } = useLessonStore();

  if (!activeLesson) return null;

  const [isExporting, setIsExporting] = useState(false);

  async function handleExportDocx() {
    if (!activeLesson) return;
    setIsExporting(true);

    try {
      const response = await fetch("/api/lesson/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeLesson),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanTitle = activeLesson.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "lesson_plan";
        a.download = `${cleanTitle}.docx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export Word document.");
      }
    } catch {
      alert("Error occurred during Word document generation.");
    } finally {
      setIsExporting(false);
    }
  }

  const [isExportingPdf, setIsExportingPdf] = useState(false);

  async function handleExportPdf() {
    if (!activeLesson) return;
    setIsExportingPdf(true);

    try {
      const response = await fetch("/api/lesson/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeLesson),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanTitle = activeLesson.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "lesson_plan";
        a.download = `${cleanTitle}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to export PDF document.");
      }
    } catch {
      alert("Error occurred during PDF generation.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  function handleSectionFocus(id: string, type: any) {
    setActiveRailId(id);
    setSelectedSection(type);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="lesson-create-container" style={{ maxWidth: "1280px" }}>
      {/* Top Header Navigation */}
      <div className="lesson-create-header-nav">
        <Link className="lesson-back-btn" href="/lesson/create">
          <ArrowLeft aria-hidden="true" size={16} />
          <span>Back to Generator</span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isDirty ? (
            <span
              className="lesson-step-badge"
              style={{ background: "#fff5f7", color: "#e44b66", border: "1px solid #f8c8d1" }}
            >
              <AlertTriangle size={12} />
              Unsaved Draft Changes
            </span>
          ) : (
            <span className="lesson-step-badge">
              <CheckCircle2 aria-hidden="true" size={13} />
              All Draft Changes Saved
            </span>
          )}

          <button
            className="btn-section-ai"
            onClick={handleExportDocx}
            disabled={isExporting}
            style={{ padding: "8px 14px", fontSize: "12px", border: "1px solid #dde2ec", color: "#4a5874" }}
            type="button"
          >
            {isExporting ? <Loader2 className="spinner" size={13} /> : <Download size={14} />} Download Word DOCX
          </button>
          <button
            className="btn-section-ai"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            style={{ padding: "8px 14px", fontSize: "12px", border: "1px solid #dde2ec", color: "#4a5874" }}
            type="button"
          >
            {isExportingPdf ? <Loader2 className="spinner" size={13} /> : <Download size={14} />} Download PDF
          </button>
          <button
            className="btn-primary-generate"
            onClick={() => saveActiveLesson()}
            style={{ padding: "8px 18px", fontSize: "12px" }}
            type="button"
          >
            <Save size={14} /> Save Draft
          </button>
        </div>
      </div>

      {/* Main Title Block */}
      <div className="lesson-create-title-block">
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span className="summary-pill highlight">{activeLesson.curriculum}</span>
          <span className="summary-pill">{activeLesson.gradeLevel}</span>
          <span className="summary-pill">{activeLesson.subject}</span>
          <span className="summary-pill">{activeLesson.lessonType}</span>
          <span className="summary-pill">{activeLesson.duration}</span>
        </div>
        <h1>Structured Lesson Editor</h1>
        <p>Edit metadata, DepEd standards, objectives, procedures, and assessment items.</p>
      </div>

      {/* Main Three-Column Editor Layout */}
      <div className="editor-layout" style={{ gridTemplateColumns: "200px 1fr 300px" }}>
        {/* Section Navigation Rail */}
        <nav className="section-nav-rail" aria-label="Section Navigation">
          <div className="rail-title">Lesson Sections</div>
          <ul className="rail-list">
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-metadata" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-metadata", "metadata")}
                type="button"
              >
                <BookOpen size={14} /> Overview
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-standards" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-standards", "standards")}
                type="button"
              >
                <Target size={14} /> Standards
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-objectives" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-objectives", "objectives")}
                type="button"
              >
                <Target size={14} /> Objectives
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-subject-matter" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-subject-matter", "subjectMatter")}
                type="button"
              >
                <BookOpen size={14} /> Subject Matter
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-procedures" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-procedures", "procedures")}
                type="button"
              >
                <Clock size={14} /> Procedures
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-assessment" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-assessment", "assessment")}
                type="button"
              >
                <FileCheck2 size={14} /> Assessment
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-reflection" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-reflection", "reflection")}
                type="button"
              >
                <Layers size={14} /> Reflection
              </button>
            </li>
          </ul>
        </nav>

        {/* Section Cards */}
        <div
          onClick={(e) => {
            const target = e.target as HTMLElement;
            const card = target.closest(".lesson-form-card");
            if (card && card.id) {
              const secId = card.id;
              const type =
                secId === "section-metadata"
                  ? "metadata"
                  : secId === "section-standards"
                  ? "standards"
                  : secId === "section-objectives"
                  ? "objectives"
                  : secId === "section-subject-matter"
                  ? "subjectMatter"
                  : secId === "section-procedures"
                  ? "procedures"
                  : secId === "section-assessment"
                  ? "assessment"
                  : secId === "section-reflection"
                  ? "reflection"
                  : null;
              if (type) setSelectedSection(type as any);
            }
          }}
          style={{ display: "grid", gap: "22px" }}
        >
          <MetadataSection
            lesson={activeLesson}
            onChange={(updated) => updateActiveLesson((prev) => ({ ...prev, ...updated }))}
          />
          <StandardsSection
            lesson={activeLesson}
            onChange={(standards) => updateSection("standards", standards)}
          />
          <ObjectivesSection
            lesson={activeLesson}
            onChange={(objectives) => updateSection("objectives", objectives)}
          />
          <SubjectMatterSection
            lesson={activeLesson}
            onChange={(sm) => updateSection("subjectMatter", sm)}
          />
          <ProceduresSection
            lesson={activeLesson}
            onChange={(procedures) => updateSection("procedures", procedures)}
          />
          <AssessmentSection
            lesson={activeLesson}
            onChange={(assessment) => updateSection("assessment", assessment)}
          />
          <ReflectionSection
            lesson={activeLesson}
            onChange={(updated) => updateActiveLesson((prev) => ({ ...prev, ...updated }))}
          />
        </div>

        {/* Contextual AI Assistant Panel sidebar */}
        <AssistantPanel />
      </div>

      {/* Action Footer */}
      <div className="form-action-bar" style={{ marginTop: "24px", borderRadius: "14px", border: "1px solid #e1e5ee" }}>
        <Link className="btn-secondary" href="/lesson/create">
          <ArrowLeft size={16} /> Back to Generator
        </Link>
        <button
          className="btn-primary-generate"
          onClick={() => saveActiveLesson()}
          type="button"
        >
          <Sparkles size={16} /> Save All Changes
        </button>
      </div>
    </div>
  );
}
