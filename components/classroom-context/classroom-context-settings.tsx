"use client";

import { Check, Info, Loader2, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import {
  ClassroomContextRequestError,
  defaultClassroomContextRepository,
  type ClassroomContextEnvelope,
} from "@/lib/classroom-context/repository";
import {
  ClassroomContextApplicationSchema,
  type ClassroomContextApplication,
} from "@/schemas/classroom-context";

const resourceOptions = [
  ["printables", "Printed materials"],
  ["chalkboard", "Board and basic materials"],
  ["projector", "Projector or shared display"],
  ["tech_lab", "Learner devices or computer lab"],
] as const;

const learnerNeedOptions = [
  ["reading_scaffolds", "Reading scaffolds"],
  ["language_scaffolds", "Language scaffolds"],
  ["visual_supports", "Visual supports"],
  ["step_by_step_instructions", "Step-by-step instructions"],
  ["extension_activities", "Extension activities"],
  ["movement_breaks", "Movement breaks"],
] as const;

export function ClassroomContextSettings({ initial }: { initial: ClassroomContextEnvelope }) {
  const [record, setRecord] = useState(initial);
  const [value, setValue] = useState<ClassroomContextApplication>(initial.value);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error" | "conflict">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function update<K extends keyof ClassroomContextApplication>(key: K, next: ClassroomContextApplication[K]) {
    setValue((current) => ({ ...current, [key]: next }));
    setState("idle");
  }

  function toggleList(key: "availableResources" | "learnerNeeds", item: string, checked: boolean) {
    const current = value[key] as string[];
    update(key, (checked ? [...current, item] : current.filter((value) => value !== item)) as never);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = ClassroomContextApplicationSchema.safeParse(value);
    if (!parsed.success) {
      setState("error");
      setMessage(parsed.error.issues[0]?.message ?? "Review the classroom defaults and try again.");
      return;
    }
    setState("saving");
    setMessage(null);
    try {
      const saved = await defaultClassroomContextRepository.save(parsed.data, record.revision);
      setRecord(saved);
      setValue(saved.value);
      setState("saved");
      setMessage("Classroom defaults saved. They are only used when you explicitly apply them.");
    } catch (error) {
      if (error instanceof ClassroomContextRequestError && error.remote) {
        setRecord(error.remote);
        setValue(error.remote.value);
        setState("conflict");
        setMessage(`${error.message} The form now shows the latest saved version.`);
      } else {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Classroom defaults could not be saved.");
      }
    }
  }

  return (
    <div className="context-settings-page">
      <header className="profile-page-heading"><div><h1>Classroom Context</h1><p>Keep reusable, general teaching conditions ready without attaching them to every AI request.</p></div><span>Applied by choice</span></header>
      <div className="context-settings-layout">
        <form className="context-form panel" noValidate onSubmit={save}>
          <div className="profile-section-heading"><h2>Teaching defaults</h2><p>These values can populate relevant lesson fields and guide selected AI actions.</p></div>
          <div className="context-field-grid">
            <label><span>Typical class size</span><select onChange={(event) => update("classSize", event.target.value as ClassroomContextApplication["classSize"])} value={value.classSize}><option value="small">Small · up to 20 learners</option><option value="standard">Standard · 21–40 learners</option><option value="large">Large · 41–55 learners</option><option value="overcrowded">Overcrowded · 56+ learners</option></select></label>
            <label><span>Preferred lesson duration</span><select onChange={(event) => update("preferredDuration", event.target.value as ClassroomContextApplication["preferredDuration"])} value={value.preferredDuration}><option>45 mins</option><option>50 mins</option><option>60 mins</option><option>90 mins</option><option>2 hours</option></select></label>
            <label><span>Medium of instruction</span><select onChange={(event) => update("language", event.target.value as ClassroomContextApplication["language"])} value={value.language}><option value="english">English</option><option value="filipino">Filipino</option><option value="bilingual">Bilingual · English and Filipino</option><option value="regional">Regional language support</option></select></label>
          </div>
          <fieldset className="context-options"><legend>Available classroom resources</legend><p>Select at least one resource that is typically available.</p><div>{resourceOptions.map(([id, label]) => <label key={id}><input checked={value.availableResources.includes(id)} onChange={(event) => toggleList("availableResources", id, event.target.checked)} type="checkbox" /><span><Check aria-hidden="true" />{label}</span></label>)}</div></fieldset>
          <fieldset className="context-options"><legend>General learner support</legend><p>Use broad instructional patterns, never individual learner records.</p><div>{learnerNeedOptions.map(([id, label]) => <label key={id}><input checked={value.learnerNeeds.includes(id)} onChange={(event) => toggleList("learnerNeeds", id, event.target.checked)} type="checkbox" /><span><Check aria-hidden="true" />{label}</span></label>)}</div></fieldset>
          <label className="context-notes"><span>General teacher notes <em>optional</em></span><textarea aria-describedby="context-note-guidance" maxLength={400} onChange={(event) => update("teacherNotes", event.target.value)} placeholder="Example: Prefer collaborative tasks with clear group roles and low-cost materials." rows={4} value={value.teacherNotes} /><small id="context-note-guidance">{value.teacherNotes.length}/400 · Describe teaching approaches only. Do not include learner names, contact details, diagnoses, medical information, addresses, or behavior records.</small></label>
          {message ? <div className={`context-message ${state}`} role={state === "error" ? "alert" : "status"}>{message}</div> : null}
          <div className="context-save-row"><button className="profile-save" disabled={state === "saving"} type="submit">{state === "saving" ? <Loader2 className="profile-spinner" aria-hidden="true" /> : <Save aria-hidden="true" />}{state === "saving" ? "Saving defaults…" : "Save classroom defaults"}</button>{record.updatedAt ? <span>Last saved {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(record.updatedAt))}</span> : <span>Not saved yet</span>}</div>
        </form>
        <aside className="context-safety panel"><ShieldCheck aria-hidden="true" /><div><h2>Safe classroom context</h2><p>Keep this record broad enough to describe a class, not a child.</p></div><ul><li>Use instructional needs such as visual supports or reading scaffolds.</li><li>Leave out names, diagnoses, medical needs, contact details, and identifiable incidents.</li><li>Review the values before applying them to lesson generation.</li></ul><div><Info aria-hidden="true" /><span>Saved context is never sent automatically. Lesson creation and relevant AI tools require an explicit choice.</span></div></aside>
      </div>
    </div>
  );
}

