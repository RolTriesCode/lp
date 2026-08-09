"use client";

import {
  BookOpenCheck,
  Check,
  Copy,
  FilePlus2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import { defaultTemplateRepository } from "@/lib/templates/repository";
import type { LessonPlan } from "@/schemas/lesson";
import type { LessonTemplate } from "@/schemas/template";

type TemplateManagerProps = {
  initialLessonId?: string;
  initialSelectedId?: string;
  initialQuery: string;
  initialCurriculum: string;
};

type OperationMessage = { tone: "success" | "error"; text: string };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function TemplateManager({ initialCurriculum, initialLessonId, initialQuery, initialSelectedId }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sourceLessonId, setSourceLessonId] = useState(initialLessonId ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<OperationMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh(preferredId?: string) {
    const [nextTemplates, nextLessons] = await Promise.all([
      defaultTemplateRepository.list(),
      defaultStorageAdapter.listLessons(),
    ]);
    setTemplates(nextTemplates);
    setLessons(nextLessons);
    setSelectedId((current) => {
      if (preferredId && nextTemplates.some((item) => item.id === preferredId)) return preferredId;
      if (current && nextTemplates.some((item) => item.id === current)) return current;
      return nextTemplates[0]?.id ?? null;
    });
    setIsLoading(false);
  }

  useEffect(() => {
    let active = true;
    async function loadInitialData() {
      try {
        const [nextTemplates, nextLessons] = await Promise.all([
          defaultTemplateRepository.list(),
          defaultStorageAdapter.listLessons(),
        ]);
        if (!active) return;
        setTemplates(nextTemplates);
        setLessons(nextLessons);
        setSelectedId(initialSelectedId && nextTemplates.some((item) => item.id === initialSelectedId) ? initialSelectedId : nextTemplates[0]?.id ?? null);
      } catch (error) {
        if (!active) return;
        setMessage({
          tone: "error",
          text: error instanceof Error ? error.message : "Saved templates could not be loaded.",
        });
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadInitialData();
    return () => {
      active = false;
    };
  }, [initialSelectedId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const lesson = lessons.find((item) => item.id === sourceLessonId);
    if (!lesson) {
      setMessage({ tone: "error", text: "Choose a saved lesson before creating a template." });
      return;
    }
    try {
      const template = await defaultTemplateRepository.createFromLesson(
        lesson,
        name.trim(),
        description.trim()
      );
      setName("");
      setDescription("");
      setMessage({ tone: "success", text: `“${template.name}” is ready to reuse.` });
      await refresh(template.id);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The template could not be created.",
      });
    }
  }

  async function handleRename(id: string) {
    try {
      const updated = await defaultTemplateRepository.rename(id, renameValue.trim());
      if (!updated) throw new Error("This template is no longer available.");
      setRenameId(null);
      setMessage({ tone: "success", text: `Renamed to “${updated.name}”.` });
      await refresh(updated.id);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The template could not be renamed.",
      });
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const duplicate = await defaultTemplateRepository.duplicate(id);
      if (!duplicate) throw new Error("This template is no longer available.");
      setMessage({ tone: "success", text: `Created “${duplicate.name}”.` });
      await refresh(duplicate.id);
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The template could not be duplicated.",
      });
    }
  }

  async function handleDelete(id: string) {
    try {
      await defaultTemplateRepository.delete(id);
      setDeleteId(null);
      setMessage({ tone: "success", text: "Template deleted from your saved library." });
      await refresh();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "The template could not be deleted. Try again.",
      });
    }
  }

  const selected = templates.find((template) => template.id === selectedId) ?? null;
  const visibleTemplates = templates.filter((template) => {
    const matchesQuery = `${template.name} ${template.description} ${template.defaults.subject}`.toLowerCase().includes(initialQuery.toLowerCase());
    return matchesQuery && (!initialCurriculum || template.defaults.curriculum === initialCurriculum);
  });

  return (
    <div className="library-page">
      <header className="library-page-header">
        <div>
          <h1>Lesson Templates</h1>
          <p>Reuse trusted lesson defaults and section patterns without locking teachers into one AI provider.</p>
        </div>
        <Link className="library-primary-action" href="/lesson/create">
          <FilePlus2 aria-hidden="true" size={16} /> New lesson
        </Link>
      </header>

      <form className="template-create-strip" onSubmit={handleCreate}>
        <div className="template-create-copy">
          <strong>Create from a saved lesson</strong>
          <span>The lesson remains unchanged. References and provider instructions are not copied.</span>
        </div>
        <label>
          <span>Source lesson</span>
          <select value={sourceLessonId} onChange={(event) => setSourceLessonId(event.target.value)}>
            <option value="">Choose a lesson</option>
            {lessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Template name</span>
          <input
            maxLength={80}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Grade 7 inquiry lesson"
            required
            value={name}
          />
        </label>
        <label className="template-description-field">
          <span>Description <small>Optional</small></span>
          <input
            maxLength={240}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="When this structure is most useful"
            value={description}
          />
        </label>
        <button disabled={!sourceLessonId || name.trim().length < 2} type="submit">
          Save template
        </button>
      </form>

      <form action="/templates" className="artifact-filter-bar template-filter-bar" method="get">
        <label><span>Search</span><input defaultValue={initialQuery} name="q" placeholder="Search template name, description, or subject" type="search" /></label>
        <label><span>Curriculum</span><select defaultValue={initialCurriculum} name="curriculum"><option value="">All curricula</option><option value="MATATAG">MATATAG</option><option value="ILAW">ILAW</option></select></label>
        <button type="submit">Apply filters</button><Link href="/templates">Clear</Link>
      </form>

      {message ? (
        <p className={`library-message ${message.tone}`} role={message.tone === "error" ? "alert" : "status"}>
          {message.text}
        </p>
      ) : null}

      {isLoading ? (
        <div className="library-loading" role="status">Loading saved templates…</div>
      ) : templates.length === 0 ? (
        <section className="library-empty-state">
          <BookOpenCheck aria-hidden="true" size={28} />
          <h2>No lesson templates yet</h2>
          <p>Create one from a saved lesson above. Its validated structure becomes a reusable starting point.</p>
          {lessons.length === 0 ? <Link href="/lesson/create">Create your first lesson</Link> : null}
        </section>
      ) : visibleTemplates.length === 0 ? (
        <section className="library-empty-state"><BookOpenCheck aria-hidden="true" size={28} /><h2>No templates match these filters</h2><p>Try a broader phrase or include both curricula.</p><Link href="/templates">Clear filters</Link></section>
      ) : (
        <div className="template-workspace">
          <section aria-label="Saved templates" className="template-list-panel">
            <div className="template-list-heading">
              <h2>Saved templates</h2>
              <span>{visibleTemplates.length}</span>
            </div>
            <ul className="template-list">
              {visibleTemplates.map((template) => (
                <li className={selectedId === template.id ? "selected" : ""} key={template.id}>
                  {renameId === template.id ? (
                    <div className="template-rename-row">
                      <label className="sr-only" htmlFor={`rename-${template.id}`}>New template name</label>
                      <input
                        autoFocus
                        id={`rename-${template.id}`}
                        maxLength={80}
                        onChange={(event) => setRenameValue(event.target.value)}
                        value={renameValue}
                      />
                      <button aria-label="Save template name" onClick={() => handleRename(template.id)} type="button">
                        <Check aria-hidden="true" size={14} />
                      </button>
                      <button aria-label="Cancel rename" onClick={() => setRenameId(null)} type="button">
                        <X aria-hidden="true" size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        aria-pressed={selectedId === template.id}
                        className="template-select-button"
                        onClick={() => setSelectedId(template.id)}
                        type="button"
                      >
                        <strong>{template.name}</strong>
                        <span>{template.defaults.curriculum} · Grade {template.defaults.grade} · {template.defaults.subject}</span>
                        <small>Updated {formatDate(template.updatedAt)}</small>
                      </button>
                      <div className="template-row-actions">
                        <button
                          aria-label={`Rename ${template.name}`}
                          onClick={() => {
                            setRenameId(template.id);
                            setRenameValue(template.name);
                          }}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={14} />
                        </button>
                        <button aria-label={`Duplicate ${template.name}`} onClick={() => handleDuplicate(template.id)} type="button">
                          <Copy aria-hidden="true" size={14} />
                        </button>
                        <button aria-label={`Delete ${template.name}`} onClick={() => setDeleteId(template.id)} type="button">
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </div>
                      {deleteId === template.id ? (
                        <div className="template-delete-confirm" role="alert">
                          <span>Delete this saved template?</span>
                          <button onClick={() => handleDelete(template.id)} type="button">Delete</button>
                          <button onClick={() => setDeleteId(null)} type="button">Keep</button>
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section aria-live="polite" className="template-preview-panel">
            {selected ? (
              <>
                <div className="template-preview-header">
                  <div>
                    <span className="library-status verified">Reusable pattern</span>
                    <h2>{selected.name}</h2>
                    <p>{selected.description || "No description added."}</p>
                  </div>
                  <Link href={`/lesson/create?templateId=${encodeURIComponent(selected.id)}`}>
                    Use for new lesson
                  </Link>
                </div>
                <dl className="template-defaults-grid">
                  <div><dt>Framework</dt><dd>{selected.defaults.curriculum}</dd></div>
                  <div><dt>Grade</dt><dd>Grade {selected.defaults.grade}</dd></div>
                  <div><dt>Subject</dt><dd>{selected.defaults.subject}</dd></div>
                  <div><dt>Format</dt><dd>{selected.defaults.type.replace("-", " ")}</dd></div>
                  <div><dt>Quarter</dt><dd>{selected.defaults.quarter}</dd></div>
                  <div><dt>Duration</dt><dd>{selected.defaults.duration}</dd></div>
                </dl>
                <div className="template-preview-section">
                  <h3>Objective pattern</h3>
                  <ol>{selected.sectionPatterns.objectives.map((item) => <li key={item}>{item}</li>)}</ol>
                </div>
                <div className="template-preview-section">
                  <h3>Procedure sequence</h3>
                  <ol>{selected.sectionPatterns.procedures.map((item) => <li key={item.title}>{item.title}</li>)}</ol>
                </div>
                <div className="template-preview-footer">
                  <span>{selected.sectionPatterns.assessment.length} assessment patterns</span>
                  <span>{selected.sectionPatterns.subjectMatter.materials.length} material defaults</span>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
