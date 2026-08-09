"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowDown, ArrowUp, Loader2, Plus, Save, Sparkles, Trash2, Download } from "lucide-react";
import { usePresentationStore } from "@/stores/presentation-store";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import type { LessonPlan } from "@/schemas/lesson";
import type { PresentationTheme, SlideLayout } from "@/schemas/presentation";
import "@/components/presentation/presentation.css";
import { LinkedLessonUnavailable } from "@/components/library/library-states";
import { trackProductEvent } from "@/lib/monitoring/analytics";

type PresentPageProps = {
  params: Promise<{ id: string }>;
};

export default function PresentPage({ params }: PresentPageProps) {
  const router = useRouter();
  const { id: lessonId } = use(params);

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<PresentationTheme>("classroom");
  const [isExporting, setIsExporting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const {
    activePresentation,
    currentSlideIndex,
    isLoading,
    isDirty,
    errorState,
    loadPresentation,
    generatePresentationFromLesson,
    updateSlide,
    reorderSlides,
    addSlide,
    removeSlide,
    savePresentation,
    setCurrentSlideIndex,
    clearError,
  } = usePresentationStore();

  useEffect(() => {
    if (lessonId) {
      void (async () => {
        try {
          const match = await defaultStorageAdapter.getLesson(lessonId);
          if (!match) return setLoadError("The lesson may have been removed, or this account no longer has access to it.");
          setLesson(match);
          await loadPresentation(lessonId);
        } catch { setLoadError("The lesson and presentation repository could not be reached. Try again from My Lesson Plans."); }
      })();
    }
  }, [lessonId, loadPresentation, router]);

  if (loadError) return <LinkedLessonUnavailable message={loadError} />;
  if (!lesson) {
    return (
      <div className="fullscreen-loading">
        <Loader2 className="spinner" />
        <span>Loading lesson details...</span>
      </div>
    );
  }

  const activeSlide = activePresentation?.slides[currentSlideIndex] || null;

  async function handleExportPptx() {
    if (!activePresentation) return;
    setIsExporting(true);

    try {
      const response = await fetch("/api/presentation/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activePresentation),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const cleanTitle = activePresentation.title.replace(/[^a-zA-Z0-9-_]/g, "_") || "presentation";
        a.download = `${cleanTitle}.pptx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        trackProductEvent("export_completed", { format: "pptx" });
      } else {
        alert("Failed to export PowerPoint presentation.");
      }
    } catch {
      alert("Error occurred during PowerPoint generation.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleStartGeneration() {
    if (lesson) {
      await generatePresentationFromLesson(lesson, selectedTheme);
    }
  }

  function handleBulletChange(bulletIdx: number, val: string) {
    if (!activeSlide) return;
    const bullets = [...(activeSlide.bullets || [])];
    bullets[bulletIdx] = val;
    updateSlide(currentSlideIndex, { bullets });
  }

  function handleAddBullet() {
    if (!activeSlide) return;
    const bullets = [...(activeSlide.bullets || [])];
    if (bullets.length >= 5) return;
    bullets.push("New bullet item text");
    updateSlide(currentSlideIndex, { bullets });
  }

  function handleRemoveBullet(bulletIdx: number) {
    if (!activeSlide) return;
    const bullets = (activeSlide.bullets || []).filter((_, idx) => idx !== bulletIdx);
    updateSlide(currentSlideIndex, { bullets });
  }

  return (
    <div className="lesson-create-container" style={{ maxWidth: "1280px", padding: "20px" }}>
      {/* Top Header bar */}
      <div className="lesson-create-header-nav" style={{ marginBottom: "16px" }}>
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

          {activePresentation && (
            <>
              <button
                className="btn-section-ai"
                onClick={handleExportPptx}
                disabled={isExporting}
                style={{ padding: "8px 14px", fontSize: "12px", border: "1px solid #dde2ec", color: "#4a5874" }}
                type="button"
              >
                {isExporting ? <Loader2 className="spinner" size={13} /> : <Download size={14} />} Download PowerPoint
              </button>
              <button
                className="btn-primary-generate"
                onClick={savePresentation}
                style={{ padding: "8px 16px", fontSize: "12px" }}
                type="button"
              >
                <Save size={14} /> Save Presentation
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Title Block */}
      <div className="lesson-create-title-block" style={{ marginBottom: "20px" }}>
        <h1>AI Slide Deck Builder</h1>
        <p>Transform your structured lesson plan &quot;{lesson.title}&quot; into classroom slides.</p>
      </div>

      {errorState && (
        <div className="section-error-inline" style={{ marginBottom: "16px" }}>
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
          <strong style={{ fontSize: "16px", color: "#1a2238" }}>Generating Presentation Slides...</strong>
          <span style={{ fontSize: "12px", color: "#7b88a2", marginTop: "4px" }}>
            Converting structured lesson beats to slide deck pages via primary AI router pipeline
          </span>
        </div>
      ) : !activePresentation ? (
        /* Setup / Theme selection screen */
        <div className="panel" style={{ padding: "30px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <Sparkles size={36} color="#5637f5" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "18px", fontWeight: "750", color: "#151928", marginBottom: "8px" }}>
            Select Slide Theme &amp; Style
          </h2>
          <p style={{ color: "#54627e", fontSize: "12px", marginBottom: "24px" }}>
            Choose a visual style suitable for your topic and student group before generating slides.
          </p>

          <div className="form-group" style={{ marginBottom: "24px", textAlign: "left" }}>
            <label className="field-label" htmlFor="select-theme">Widescreen Presentation Theme</label>
            <select
              id="select-theme"
              className="form-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value as PresentationTheme)}
            >
              <option value="classroom">Classroom (Vibrant &amp; Colorful)</option>
              <option value="elementary">Elementary (Friendly warm tones)</option>
              <option value="academic">Academic (Classic navy serif)</option>
              <option value="minimal">Minimal (Clean black &amp; white)</option>
              <option value="science">Science (Cool dark cyan style)</option>
              <option value="mathematics">Mathematics (Graph paper layout)</option>
            </select>
          </div>

          <button
            className="btn-primary-generate"
            style={{ width: "100%", padding: "12px" }}
            onClick={handleStartGeneration}
            type="button"
          >
            <Sparkles size={16} /> Generate Slides with AI
          </button>
        </div>
      ) : (
        /* Active Presentation Builder Workspace */
        <div className="presentation-workspace">
          {/* Left panel: Slide Thumbnails */}
          <nav className="slide-thumbnail-rail" aria-label="Slide list">
            <div className="rail-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Slides List</span>
              <button
                className="btn-block-action"
                style={{ width: "20px", height: "20px" }}
                onClick={() => addSlide(currentSlideIndex)}
                title="Add Slide"
                type="button"
              >
                <Plus size={12} />
              </button>
            </div>

            <ul className="thumbnail-list">
              {activePresentation.slides.map((slide, idx) => (
                <li
                  key={slide.id || idx}
                  className={`thumbnail-card ${currentSlideIndex === idx ? "active" : ""}`}
                  onClick={() => setCurrentSlideIndex(idx)}
                >
                  <span className="thumbnail-number">Slide {idx + 1}</span>
                  <span className="thumbnail-title">{slide.title}</span>
                  <span className="thumbnail-badge">{slide.layout}</span>
                </li>
              ))}
            </ul>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                className="btn-section-ai"
                onClick={() => reorderSlides(currentSlideIndex, currentSlideIndex - 1)}
                disabled={currentSlideIndex === 0}
                style={{ padding: "6px" }}
                title="Move Slide Up"
                type="button"
              >
                <ArrowUp size={12} /> Up
              </button>
              <button
                className="btn-section-ai"
                onClick={() => reorderSlides(currentSlideIndex, currentSlideIndex + 1)}
                disabled={currentSlideIndex === activePresentation.slides.length - 1}
                style={{ padding: "6px" }}
                title="Move Slide Down"
                type="button"
              >
                <ArrowDown size={12} /> Down
              </button>
              <button
                className="btn-section-ai undo-btn"
                onClick={() => removeSlide(currentSlideIndex)}
                disabled={activePresentation.slides.length <= 1}
                style={{ padding: "6px", marginLeft: "auto" }}
                title="Delete Slide"
                type="button"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </nav>

          {/* Center Panel: Widescreen slide preview canvas */}
          <main className="slide-canvas-wrapper" aria-label="Slide Preview Canvas">
            <div className="slide-canvas-container">
              {activeSlide && (
                <div className={`theme-${activePresentation.theme} layout-${activeSlide.layout}`}>
                  {activeSlide.layout === "title" && (
                    <div className="layout-title">
                      <h2>{activeSlide.title}</h2>
                      {activeSlide.subtitle && <p>{activeSlide.subtitle}</p>}
                    </div>
                  )}

                  {activeSlide.layout === "bullets" && (
                    <div className="layout-bullets">
                      <h2>{activeSlide.title}</h2>
                      {activeSlide.bullets && (
                        <ul>
                          {activeSlide.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {activeSlide.layout === "two_column" && (
                    <div className="layout-two_column">
                      <div>
                        <h2>{activeSlide.title}</h2>
                        {activeSlide.body && <p style={{ fontSize: "13px", marginTop: "10px" }}>{activeSlide.body}</p>}
                      </div>
                      <div>
                        {activeSlide.bullets && (
                          <ul style={{ paddingLeft: "20px", fontSize: "13px" }}>
                            {activeSlide.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {activeSlide.layout === "quote" && (
                    <div className="layout-quote">
                      <h2>&ldquo;{activeSlide.title}&rdquo;</h2>
                      {activeSlide.subtitle && <p style={{ fontSize: "14px", marginTop: "12px", color: "#64748b" }}>— {activeSlide.subtitle}</p>}
                    </div>
                  )}

                  {activeSlide.layout === "big_stat" && (
                    <div className="layout-big_stat">
                      <div className="stat-number">{activeSlide.title}</div>
                      {activeSlide.subtitle && <p style={{ fontSize: "15px", marginTop: "8px", fontWeight: "600" }}>{activeSlide.subtitle}</p>}
                    </div>
                  )}

                  {activeSlide.layout === "interactive_qa" && (
                    <div className="layout-interactive_qa">
                      <h2 style={{ fontSize: "18px" }}>Question: {activeSlide.title}</h2>
                      {activeSlide.bullets && (
                        <ul style={{ listStyle: "circle", paddingLeft: "20px", marginTop: "12px", fontSize: "13px" }}>
                          {activeSlide.bullets.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-Canvas Metadata details */}
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span className="summary-pill highlight">Active Layout: {activeSlide?.layout.toUpperCase()}</span>
              <span className="summary-pill">Total Slides: {activePresentation.slides.length}</span>
              <span className="summary-pill">Active Theme: {activePresentation.theme.toUpperCase()}</span>
            </div>
          </main>

          {/* Right Panel: slide editor controls */}
          {activeSlide && (
            <aside className="slide-editor-controls" aria-label="Slide Edit Panel">
              <h3 style={{ fontSize: "12px", fontWeight: "750", color: "#1a2238", marginBottom: "14px", borderBottom: "1px solid #edf0f6", paddingBottom: "8px" }}>
                Edit Slide {currentSlideIndex + 1}
              </h3>

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="slide-title-input">Slide Main Title</label>
                <input
                  id="slide-title-input"
                  className="form-input"
                  type="text"
                  value={activeSlide.title || ""}
                  onChange={(e) => updateSlide(currentSlideIndex, { title: e.target.value })}
                />
              </div>

              {(activeSlide.layout === "title" || activeSlide.layout === "quote" || activeSlide.layout === "big_stat") && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="field-label" htmlFor="slide-subtitle-input">Subtitle / Secondary Text</label>
                  <input
                    id="slide-subtitle-input"
                    className="form-input"
                    type="text"
                    value={activeSlide.subtitle || ""}
                    onChange={(e) => updateSlide(currentSlideIndex, { subtitle: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group" style={{ marginBottom: "12px" }}>
                <label className="field-label" htmlFor="slide-layout-select">Slide Layout Format</label>
                <select
                  id="slide-layout-select"
                  className="form-select"
                  value={activeSlide.layout}
                  onChange={(e) => updateSlide(currentSlideIndex, { layout: e.target.value as SlideLayout })}
                >
                  <option value="title">Title Layout</option>
                  <option value="bullets">Bullets List</option>
                  <option value="two_column">Two Columns Layout</option>
                  <option value="quote">Quote Layout</option>
                  <option value="big_stat">Big Stat / Word Callout</option>
                  <option value="interactive_qa">Interactive Q&amp;A Game</option>
                </select>
              </div>

              {activeSlide.layout === "two_column" && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <label className="field-label" htmlFor="slide-body-input">Column A Body Text</label>
                  <textarea
                    id="slide-body-input"
                    className="form-textarea"
                    value={activeSlide.body || ""}
                    onChange={(e) => updateSlide(currentSlideIndex, { body: e.target.value })}
                    rows={3}
                  />
                </div>
              )}

              {(activeSlide.layout === "bullets" || activeSlide.layout === "two_column" || activeSlide.layout === "interactive_qa") && (
                <div className="form-group" style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="field-label" style={{ margin: "0" }}>Bullet points list (max 5)</label>
                    {(activeSlide.bullets || []).length < 5 && (
                      <button
                        className="btn-block-action"
                        style={{ width: "20px", height: "20px" }}
                        onClick={handleAddBullet}
                        title="Add Bullet Point"
                        type="button"
                      >
                        <Plus size={11} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: "grid", gap: "6px" }}>
                    {(activeSlide.bullets || []).map((bullet, bIdx) => (
                      <div key={bIdx} style={{ display: "flex", gap: "6px" }}>
                        <input
                          className="form-input"
                          type="text"
                          value={bullet}
                          onChange={(e) => handleBulletChange(bIdx, e.target.value)}
                        />
                        <button
                          className="btn-block-action danger"
                          onClick={() => handleRemoveBullet(bIdx)}
                          title="Remove Bullet"
                          type="button"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group" style={{ borderTop: "1px solid #edf0f6", paddingTop: "12px", marginTop: "12px" }}>
                <label className="field-label" htmlFor="slide-notes-input">Teacher Speaker Notes</label>
                <textarea
                  id="slide-notes-input"
                  className="form-textarea"
                  value={activeSlide.speakerNotes || ""}
                  onChange={(e) => updateSlide(currentSlideIndex, { speakerNotes: e.target.value })}
                  rows={4}
                  placeholder="Talking points or recitation cues..."
                />
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
