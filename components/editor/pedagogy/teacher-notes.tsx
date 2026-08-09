"use client";

import { LockKeyhole, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PrivateTeacherNoteSchema, PedagogySectionSchema, type PedagogySection, type PrivateTeacherNote } from "@/schemas/pedagogy";

type TeacherNotesProps = {
  notes: PrivateTeacherNote[];
  onChange: (notes: PrivateTeacherNote[]) => void;
  includeInExport: boolean;
  onIncludeInExportChange: (include: boolean) => void;
};

const sectionLabels: Record<PedagogySection, string> = {
  lesson: "Whole lesson",
  objectives: "Objectives",
  subjectMatter: "Subject matter",
  procedures: "Procedures",
  assessment: "Assessment",
  reflection: "Reflection",
};

export function TeacherNotes({ notes, onChange, includeInExport, onIncludeInExportChange }: TeacherNotesProps) {
  const [draftSection, setDraftSection] = useState<PedagogySection>("lesson");
  const [draftText, setDraftText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addNote() {
    const timestamp = new Date().toISOString();
    const parsed = PrivateTeacherNoteSchema.safeParse({
      id: crypto.randomUUID(),
      section: draftSection,
      text: draftText,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (!parsed.success || !parsed.data.text) {
      setError(parsed.success ? "Write a note before adding it." : parsed.error.issues[0]?.message ?? "Review the note.");
      return;
    }
    onChange([...notes, parsed.data]);
    setDraftText("");
    setError(null);
  }

  function updateNote(id: string, update: Partial<Pick<PrivateTeacherNote, "section" | "text">>) {
    const current = notes.find((note) => note.id === id);
    if (!current) return;
    const parsed = PrivateTeacherNoteSchema.safeParse({ ...current, ...update, updatedAt: new Date().toISOString() });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "That note could not be saved.");
      return;
    }
    setError(null);
    onChange(notes.map((note) => note.id === id ? parsed.data : note));
  }

  return (
    <section aria-labelledby="private-notes-heading" className="lesson-form-card teacher-notes" id="section-teacher-notes">
      <div className="card-header teacher-notes-header"><div className="card-icon green"><LockKeyhole aria-hidden="true" /></div><div><h2 id="private-notes-heading">Private teacher notes</h2><p>Planning reminders stay outside student-facing lesson sections and exports by default.</p></div><span>Private</span></div>
      <div className="teacher-note-composer">
        <label><span>Attach to</span><select onChange={(event) => setDraftSection(PedagogySectionSchema.parse(event.target.value))} value={draftSection}>{PedagogySectionSchema.options.map((section) => <option key={section} value={section}>{sectionLabels[section]}</option>)}</select></label>
        <label className="note-text"><span>New note</span><textarea maxLength={1_000} onChange={(event) => setDraftText(event.target.value)} placeholder="Example: Pause after the group task and ask which evidence changed their explanation." rows={3} value={draftText} /></label>
        <button disabled={!draftText.trim()} onClick={addNote} type="button"><Plus aria-hidden="true" /> Add private note</button>
      </div>
      {error ? <p className="teacher-note-error" role="alert">{error}</p> : null}
      <div className="teacher-note-list">
        {notes.length ? notes.map((note) => <article key={note.id}><select aria-label="Note section" onChange={(event) => updateNote(note.id, { section: PedagogySectionSchema.parse(event.target.value) })} value={note.section}>{PedagogySectionSchema.options.map((section) => <option key={section} value={section}>{sectionLabels[section]}</option>)}</select><textarea aria-label={`Private note for ${sectionLabels[note.section]}`} maxLength={1_000} onChange={(event) => updateNote(note.id, { text: event.target.value })} rows={3} value={note.text} /><button aria-label="Delete private note" onClick={() => onChange(notes.filter((item) => item.id !== note.id))} type="button"><Trash2 aria-hidden="true" /></button></article>) : <div className="teacher-note-empty"><LockKeyhole aria-hidden="true" /><span><strong>No private notes yet.</strong>Add reminders that are useful while preparing or teaching this lesson.</span></div>}
      </div>
      <label className="teacher-note-export"><input checked={includeInExport} onChange={(event) => onIncludeInExportChange(event.target.checked)} type="checkbox" /><span><strong>Include private notes in my next DOCX or PDF export</strong><small>This setting is temporary and off by default. Review notes before sharing the exported file.</small></span></label>
    </section>
  );
}
