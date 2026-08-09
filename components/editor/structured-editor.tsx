"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CloudOff,
  Clock,
  FileCheck2,
  Layers,
  Save,
  Sparkles,
  Target,
  Download,
  Loader2,
  Paperclip,
  RefreshCw,
  Brain,
  LockKeyhole,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AssistantPanel } from "@/components/editor/assistant/assistant-panel";
import { AssessmentSection } from "@/components/editor/sections/assessment-section";
import { MetadataSection } from "@/components/editor/sections/metadata-section";
import { ObjectivesSection } from "@/components/editor/sections/objectives-section";
import { ProceduresSection } from "@/components/editor/sections/procedures-section";
import { ReflectionSection } from "@/components/editor/sections/reflection-section";
import { StandardsSection } from "@/components/editor/sections/standards-section";
import { SubjectMatterSection } from "@/components/editor/sections/subject-matter-section";
import { useLessonStore } from "@/stores/lesson-store";
import { ReferenceUpload } from "@/components/lesson/reference-upload";
import { PedagogyTools } from "@/components/editor/pedagogy/pedagogy-tools";
import { TeacherNotes } from "@/components/editor/pedagogy/teacher-notes";
import "@/components/editor/editor.css";
import { trackProductEvent } from "@/lib/monitoring/analytics";

export function StructuredEditor({ initialSection }: { initialSection?: string }) {
  const [activeRailId, setActiveRailId] = useState("section-metadata");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [includePrivateNotesInExport, setIncludePrivateNotesInExport] = useState(false);
  const {
    activeLesson,
    isDirty,
    autosaveStatus,
    lastSavedAt,
    saveError,
    conflictRemote,
    updateSection,
    updateActiveLesson,
    saveActiveLesson,
    retrySave,
    acceptRemoteVersion,
    overwriteRemoteVersion,
    markOffline,
    setSelectedSection,
  } = useLessonStore();

  useEffect(() => {
    trackProductEvent("editor_opened", { surface: "structured_editor" });
  }, []);

  useEffect(() => {
    if (
      !activeLesson ||
      !isDirty ||
      autosaveStatus === "saving" ||
      autosaveStatus === "offline" ||
      autosaveStatus === "conflict" ||
      autosaveStatus === "failed"
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      void saveActiveLesson();
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activeLesson, autosaveStatus, isDirty, saveActiveLesson]);

  useEffect(() => {
    const handleOffline = () => markOffline();
    const handleOnline = () => {
      const state = useLessonStore.getState();
      if (state.isDirty && state.autosaveStatus !== "conflict") void retrySave();
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!useLessonStore.getState().isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [markOffline, retrySave]);

  useEffect(() => {
    if (!initialSection || !activeLesson) return;
    const targetId = initialSection === "pedagogy" ? "section-pedagogy" : `section-${initialSection}`;
    const sectionType = initialSection === "pedagogy" ? null : initialSection as Parameters<typeof setSelectedSection>[0];
    const frame = window.requestAnimationFrame(() => {
      setActiveRailId(targetId);
      setSelectedSection(sectionType);
      document.getElementById(targetId)?.scrollIntoView({ block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeLesson, initialSection, setSelectedSection]);

  if (!activeLesson) return null;

  async function handleExportDocx() {
    if (!activeLesson) return;
    setIsExporting(true);

    try {
      const response = await fetch("/api/lesson/export/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson: activeLesson, includePrivateNotes: includePrivateNotesInExport }),
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
        trackProductEvent("export_completed", { format: "docx" });
        setIncludePrivateNotesInExport(false);
      } else {
        alert("Failed to export Word document.");
      }
    } catch {
      alert("Error occurred during Word document generation.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleExportPdf() {
    if (!activeLesson) return;
    setIsExportingPdf(true);

    try {
      const response = await fetch("/api/lesson/export/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lesson: activeLesson, includePrivateNotes: includePrivateNotesInExport }),
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
        trackProductEvent("export_completed", { format: "pdf" });
        setIncludePrivateNotesInExport(false);
      } else {
        alert("Failed to export PDF document.");
      }
    } catch {
      alert("Error occurred during PDF generation.");
    } finally {
      setIsExportingPdf(false);
    }
  }

  function handleSectionFocus(id: string, type: Parameters<typeof setSelectedSection>[0]) {
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
        <div style={{ display: "flex", gap: "10px" }}>
          <Link className="lesson-back-btn" href="/lesson/create">
            <ArrowLeft aria-hidden="true" size={16} />
            <span>Back to Generator</span>
          </Link>
          <Link className="lesson-back-btn" href={`/lesson/${activeLesson.id}/pack`}>
            <span>Teaching Pack</span>
          </Link>
          <Link className="lesson-back-btn" href="/curriculum">Curriculum</Link>
          <Link className="lesson-back-btn" href="/resources">Resources</Link>
          <Link className="lesson-back-btn" href={`/templates?lessonId=${activeLesson.id ?? ""}`}>
            Save as Template
          </Link>
          <Link className="lesson-back-btn" href={`/lesson/${activeLesson.id}/teaching-mode`}>
            <Presentation aria-hidden="true" size={15} /> Teach lesson
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            aria-live="polite"
            className={`autosave-indicator ${autosaveStatus}`}
            role={autosaveStatus === "failed" || autosaveStatus === "conflict" ? "alert" : "status"}
          >
            {autosaveStatus === "saving" ? <Loader2 aria-hidden="true" className="spinner" size={13} /> : null}
            {autosaveStatus === "saved" ? <CheckCircle2 aria-hidden="true" size={13} /> : null}
            {autosaveStatus === "offline" ? <CloudOff aria-hidden="true" size={13} /> : null}
            {autosaveStatus === "conflict" || autosaveStatus === "failed" ? <AlertTriangle aria-hidden="true" size={13} /> : null}
            {autosaveStatus === "idle" ? <Clock aria-hidden="true" size={13} /> : null}
            {autosaveStatus === "saving"
              ? "Saving…"
              : autosaveStatus === "saved"
                ? `Saved${lastSavedAt ? ` ${new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(lastSavedAt))}` : ""}`
                : autosaveStatus === "offline"
                  ? "Offline — keep this tab open"
                  : autosaveStatus === "conflict"
                    ? "Save conflict"
                    : autosaveStatus === "failed"
                      ? "Save failed"
                      : isDirty
                        ? "Changes pending"
                        : "Ready"}
          </span>

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
            disabled={autosaveStatus === "saving" || autosaveStatus === "conflict"}
            onClick={() => void (autosaveStatus === "failed" ? retrySave() : saveActiveLesson())}
            style={{ padding: "8px 18px", fontSize: "12px" }}
            type="button"
          >
            {autosaveStatus === "saving" ? <Loader2 aria-hidden="true" className="spinner" size={14} /> : autosaveStatus === "failed" ? <RefreshCw aria-hidden="true" size={14} /> : <Save aria-hidden="true" size={14} />}
            {autosaveStatus === "failed" ? "Retry save" : "Save now"}
          </button>
        </div>
      </div>

      {autosaveStatus === "conflict" ? (
        <section aria-labelledby="save-conflict-heading" className="save-conflict-panel" role="alert">
          <AlertTriangle aria-hidden="true" size={20} />
          <div>
            <h2 id="save-conflict-heading">A newer version is already saved</h2>
            <p>
              This tab still has your changes. Review the remote save from{conflictRemote?.updatedAt ? ` ${new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(conflictRemote.updatedAt))}` : " another session"}, then choose which version to keep.
            </p>
          </div>
          <div className="save-conflict-actions">
            <button onClick={acceptRemoteVersion} type="button">Load newer version</button>
            <button className="primary" onClick={() => void overwriteRemoteVersion()} type="button">
              Keep my changes
            </button>
          </div>
        </section>
      ) : autosaveStatus === "failed" && saveError ? (
        <div className="save-failure-banner" role="alert">
          <span>{saveError} Your open changes were not discarded.</span>
          <button onClick={() => void retrySave()} type="button">Try again</button>
        </div>
      ) : null}

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
      <div className="editor-layout">
        {/* Section Navigation Rail */}
        <nav className="section-nav-rail" aria-label="Section Navigation">
          <div className="rail-title">Lesson Sections</div>
          <ul className="rail-list">
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-pedagogy" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-pedagogy", null)}
                type="button"
              >
                <Brain aria-hidden="true" size={14} /> Pedagogy Tools
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-teacher-notes" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-teacher-notes", null)}
                type="button"
              >
                <LockKeyhole aria-hidden="true" size={14} /> Private Notes
              </button>
            </li>
            <li>
              <button
                className={`rail-item-btn ${activeRailId === "section-references" ? "active" : ""}`}
                onClick={() => handleSectionFocus("section-references", null)}
                type="button"
              >
                <Paperclip aria-hidden="true" size={14} /> References
              </button>
            </li>
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
              if (type) setSelectedSection(type);
            }
          }}
          style={{ display: "grid", gap: "22px" }}
        >
          <PedagogyTools />
          <TeacherNotes
            includeInExport={includePrivateNotesInExport}
            notes={activeLesson.privateTeacherNotes ?? []}
            onChange={(privateTeacherNotes) =>
              updateActiveLesson((lesson) => ({ ...lesson, privateTeacherNotes }))
            }
            onIncludeInExportChange={setIncludePrivateNotesInExport}
          />
          <section
            aria-labelledby="editor-reference-heading"
            className="lesson-form-card"
            id="section-references"
          >
            <div className="card-header">
              <div className="card-icon violet">
                <Paperclip aria-hidden="true" size={20} />
              </div>
              <div>
                <h2 id="editor-reference-heading">Source References</h2>
                <p>Inspect, remove, or add bounded source context for assistant edits.</p>
              </div>
            </div>
            <div className="card-body">
              <ReferenceUpload
                onChange={(uploadedReferences) =>
                  updateActiveLesson((lesson) => ({ ...lesson, uploadedReferences }))
                }
                onReferenceUploaded={() => undefined}
                references={activeLesson.uploadedReferences ?? []}
              />
            </div>
          </section>
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
          disabled={autosaveStatus === "saving" || autosaveStatus === "conflict"}
          onClick={() => void (autosaveStatus === "failed" ? retrySave() : saveActiveLesson())}
          type="button"
        >
          <Sparkles size={16} /> {autosaveStatus === "failed" ? "Retry save" : "Save all changes"}
        </button>
      </div>
    </div>
  );
}
