"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Link2,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RemoteEntityRepository } from "@/lib/persistence/remote-repository";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import {
  ScheduleRequestError,
  defaultScheduleRepository,
} from "@/lib/schedule/repository";
import {
  addDays,
  addMonths,
  calendarRange,
  fromDateKey,
  startOfMonthGrid,
  startOfWeek,
  toDateKey,
  toLocalDateTimeValue,
} from "@/lib/schedule/date";
import { AssessmentSchema } from "@/schemas/assessment";
import {
  ScheduleEntryInputSchema,
  type ScheduleEntry,
  type ScheduleEntryInput,
  type ScheduleEntryKind,
  type ScheduleEntryStatus,
} from "@/schemas/schedule";

type CalendarView = "week" | "month";
type KindFilter = ScheduleEntryKind | "all";
type StatusFilter = ScheduleEntryStatus | "all";
type LinkOption = { id: string; label: string };

type CalendarPlannerProps = {
  initialDate: string;
  initialView: CalendarView;
  initialKind: KindFilter;
  initialStatus: StatusFilter;
};

const kinds: Array<{ value: ScheduleEntryKind; label: string }> = [
  { value: "lesson", label: "Lesson" },
  { value: "assessment", label: "Assessment" },
  { value: "teaching_pack", label: "Teaching pack" },
  { value: "other", label: "Other" },
];

const statuses: Array<{ value: ScheduleEntryStatus; label: string }> = [
  { value: "planned", label: "Planned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function defaultDraft(date: Date): ScheduleEntryInput {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1_000);
  return {
    title: "",
    kind: "lesson",
    status: "planned",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    subject: null,
    notes: "",
    lessonPlanId: null,
    assessmentId: null,
    teachingPackLessonId: null,
  };
}

function draftFromEntry(entry: ScheduleEntry): ScheduleEntryInput {
  const { id: _id, revision: _revision, createdAt: _created, updatedAt: _updated, ...draft } = entry;
  void _id; void _revision; void _created; void _updated;
  return draft;
}

function formatRange(date: Date, view: CalendarView): string {
  if (view === "month") return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(date);
  const start = startOfWeek(date);
  const end = addDays(start, 6);
  const formatter = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
  return `${formatter.format(start)} – ${formatter.format(end)}, ${end.getFullYear()}`;
}

function entryTime(entry: ScheduleEntry): string {
  return `${new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(entry.startsAt))}–${new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(entry.endsAt))}`;
}

function eventDay(entry: ScheduleEntry): string {
  return toDateKey(new Date(entry.startsAt));
}

export function CalendarPlanner({ initialDate, initialView, initialKind, initialStatus }: CalendarPlannerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const selectedDate = useMemo(() => fromDateKey(initialDate) ?? new Date(), [initialDate]);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleEntry | null>(null);
  const [draft, setDraft] = useState<ScheduleEntryInput>(() => defaultDraft(selectedDate));
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lessonLinks, setLessonLinks] = useState<LinkOption[]>([]);
  const [assessmentLinks, setAssessmentLinks] = useState<LinkOption[]>([]);

  const range = useMemo(() => calendarRange(selectedDate, initialView), [initialView, selectedDate]);

  const updateUrl = useCallback((updates: Partial<{ date: string; view: CalendarView; kind: KindFilter; status: StatusFilter }>) => {
    const params = new URLSearchParams();
    const next = {
      date: updates.date ?? initialDate,
      view: updates.view ?? initialView,
      kind: updates.kind ?? initialKind,
      status: updates.status ?? initialStatus,
    };
    params.set("date", next.date);
    params.set("view", next.view);
    if (next.kind !== "all") params.set("kind", next.kind);
    if (next.status !== "all") params.set("status", next.status);
    router.push(`${pathname}?${params.toString()}`);
  }, [initialDate, initialKind, initialStatus, initialView, pathname, router]);

  const loadEntries = useCallback(async () => {
    setLoadState("loading");
    try {
      const data = await defaultScheduleRepository.list({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        kind: initialKind === "all" ? undefined : initialKind,
        status: initialStatus === "all" ? undefined : initialStatus,
      });
      setEntries(data);
      setLoadState("ready");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The schedule could not be loaded.");
      setLoadState("error");
    }
  }, [initialKind, initialStatus, range.end, range.start]);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      defaultStorageAdapter.listLessons(),
      new RemoteEntityRepository("assessments", AssessmentSchema).list({ limit: 100 }),
    ]).then(([lessons, assessments]) => {
      if (!active) return;
      setLessonLinks(lessons.flatMap((lesson) => lesson.id ? [{ id: lesson.id, label: lesson.title }] : []));
      setAssessmentLinks(assessments.map((record) => ({ id: record.id, label: record.value.title })));
    }).catch(() => {
      if (active) setNotice("Schedule loaded, but linked lesson choices are temporarily unavailable.");
    });
    return () => { active = false; };
  }, []);

  function openNew(date: Date = selectedDate) {
    setEditing(null);
    setDraft(defaultDraft(date));
    setFormErrors({});
    setConfirmDelete(false);
    setEditorOpen(true);
  }

  function openEdit(entry: ScheduleEntry) {
    setEditing(entry);
    setDraft(draftFromEntry(entry));
    setFormErrors({});
    setConfirmDelete(false);
    setEditorOpen(true);
  }

  function updateDraft<K extends keyof ScheduleEntryInput>(key: K, value: ScheduleEntryInput[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function changeKind(kind: ScheduleEntryKind) {
    setDraft((current) => ({
      ...current,
      kind,
      lessonPlanId: null,
      assessmentId: null,
      teachingPackLessonId: null,
    }));
  }

  function updateDateTime(key: "startsAt" | "endsAt", value: string) {
    const date = new Date(value);
    updateDraft(key, Number.isNaN(date.getTime()) ? "" : date.toISOString());
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const parsed = ScheduleEntryInputSchema.safeParse(draft);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const saved = editing
        ? await defaultScheduleRepository.update(editing.id, parsed.data, editing.revision)
        : await defaultScheduleRepository.create(parsed.data);
      if (!saved) throw new Error("This schedule entry no longer exists.");
      setEntries((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setEditing(saved);
      setDraft(draftFromEntry(saved));
      setNotice(editing ? "Schedule entry saved." : "Schedule entry added.");
      setEditorOpen(false);
    } catch (error) {
      if (error instanceof ScheduleRequestError && error.remote) {
        setEntries((current) => [...current.filter((item) => item.id !== error.remote?.id), error.remote!].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
        setEditing(error.remote);
        setDraft(draftFromEntry(error.remote));
        setNotice(`${error.message} The editor now shows the latest saved version.`);
      } else {
        setNotice(error instanceof Error ? error.message : "The schedule entry could not be saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function move(entry: ScheduleEntry, days: number) {
    setNotice(null);
    const next = draftFromEntry(entry);
    next.startsAt = new Date(Date.parse(next.startsAt) + days * 86_400_000).toISOString();
    next.endsAt = new Date(Date.parse(next.endsAt) + days * 86_400_000).toISOString();
    try {
      const saved = await defaultScheduleRepository.update(entry.id, next, entry.revision);
      if (!saved) throw new Error("This schedule entry no longer exists.");
      setEntries((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      setNotice(`Moved “${saved.title}” ${days < 0 ? "one day earlier" : "one day later"}.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The schedule entry could not be moved.");
      void loadEntries();
    }
  }

  async function remove() {
    if (!editing) return;
    setSaving(true);
    try {
      await defaultScheduleRepository.delete(editing.id);
      setEntries((current) => current.filter((item) => item.id !== editing.id));
      setEditorOpen(false);
      setEditing(null);
      setNotice("Schedule entry deleted.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The schedule entry could not be deleted.");
    } finally {
      setSaving(false);
    }
  }

  const days = useMemo(() => {
    const start = initialView === "week" ? startOfWeek(selectedDate) : startOfMonthGrid(selectedDate);
    return Array.from({ length: initialView === "week" ? 7 : 42 }, (_, index) => addDays(start, index));
  }, [initialView, selectedDate]);

  const adjacentDate = (amount: number) => initialView === "week" ? addDays(selectedDate, amount * 7) : addMonths(selectedDate, amount);
  const linkOptions = draft.kind === "assessment" ? assessmentLinks : lessonLinks;
  const linkValue = draft.kind === "assessment" ? draft.assessmentId : draft.kind === "teaching_pack" ? draft.teachingPackLessonId : draft.lessonPlanId;

  return (
    <div className="calendar-page">
      <header className="calendar-heading">
        <div><span className="calendar-eyebrow">Teaching plan</span><h1>Calendar</h1><p>Shape the week, keep the month in view, and connect each session to saved teaching work.</p></div>
        <button className="calendar-primary" onClick={() => openNew()} type="button"><CalendarPlus aria-hidden="true" /> Add to plan</button>
      </header>

      <section className="calendar-toolbar panel" aria-label="Calendar controls">
        <div className="calendar-date-navigation">
          <button aria-label={`Previous ${initialView}`} onClick={() => updateUrl({ date: toDateKey(adjacentDate(-1)) })} type="button"><ChevronLeft aria-hidden="true" /></button>
          <button onClick={() => updateUrl({ date: toDateKey(new Date()) })} type="button">Today</button>
          <button aria-label={`Next ${initialView}`} onClick={() => updateUrl({ date: toDateKey(adjacentDate(1)) })} type="button"><ChevronRight aria-hidden="true" /></button>
          <strong>{formatRange(selectedDate, initialView)}</strong>
        </div>
        <div className="calendar-filters">
          <label><span>View</span><select aria-label="Calendar view" onChange={(event) => updateUrl({ view: event.target.value as CalendarView })} value={initialView}><option value="week">Week</option><option value="month">Month</option></select></label>
          <label><span>Type</span><select aria-label="Filter by type" onChange={(event) => updateUrl({ kind: event.target.value as KindFilter })} value={initialKind}><option value="all">All types</option>{kinds.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label><span>Status</span><select aria-label="Filter by status" onChange={(event) => updateUrl({ status: event.target.value as StatusFilter })} value={initialStatus}><option value="all">All statuses</option>{statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        </div>
      </section>

      {notice ? <div className="calendar-notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={() => setNotice(null)} type="button"><X aria-hidden="true" /></button></div> : null}

      <div className={`calendar-workspace${editorOpen ? " editor-visible" : ""}`}>
        <section className="calendar-board panel" aria-busy={loadState === "loading"}>
          {loadState === "loading" ? <div className="calendar-state"><Clock3 aria-hidden="true" /><strong>Loading your teaching plan…</strong><span>Your lesson form and editor work remain unchanged.</span></div> : null}
          {loadState === "error" ? <div className="calendar-state"><RotateCcw aria-hidden="true" /><strong>The schedule is unavailable.</strong><span>Your saved plan was not changed.</span><button onClick={() => void loadEntries()} type="button">Try again</button></div> : null}
          {loadState === "ready" && initialView === "week" ? (
            <div className="week-view" aria-label={`Week of ${formatRange(selectedDate, "week")}`}>
              {days.map((day) => {
                const key = toDateKey(day);
                const dayEntries = entries.filter((entry) => eventDay(entry) === key);
                return <section className={`week-day${key === toDateKey(new Date()) ? " today" : ""}`} key={key} aria-labelledby={`day-${key}`}><header><div><span>{new Intl.DateTimeFormat("en-PH", { weekday: "short" }).format(day)}</span><strong id={`day-${key}`}>{day.getDate()}</strong></div><button aria-label={`Add an entry on ${new Intl.DateTimeFormat("en-PH", { dateStyle: "full" }).format(day)}`} onClick={() => openNew(day)} type="button"><CalendarPlus aria-hidden="true" /></button></header><div className="week-day-events">{dayEntries.length ? dayEntries.map((entry) => <article className={`calendar-event ${entry.kind} ${entry.status}`} key={entry.id}><button className="event-main" onClick={() => openEdit(entry)} type="button"><span>{entryTime(entry)}</span><strong>{entry.title}</strong><small>{kinds.find((item) => item.value === entry.kind)?.label}{entry.subject ? ` · ${entry.subject}` : ""}</small></button><div className="event-actions"><button aria-label={`Move ${entry.title} one day earlier`} onClick={() => void move(entry, -1)} type="button"><ArrowLeft aria-hidden="true" /></button><button aria-label={`Edit ${entry.title}`} onClick={() => openEdit(entry)} type="button"><Pencil aria-hidden="true" /></button><button aria-label={`Move ${entry.title} one day later`} onClick={() => void move(entry, 1)} type="button"><ArrowRight aria-hidden="true" /></button></div></article>) : <button className="day-empty" onClick={() => openNew(day)} type="button">Open · add a session</button>}</div></section>;
              })}
            </div>
          ) : null}
          {loadState === "ready" && initialView === "month" ? (
            <div className="month-view" role="grid" aria-label={formatRange(selectedDate, "month")}>
              <div className="month-weekdays" role="row">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <span key={day} role="columnheader">{day}</span>)}</div>
              <div className="month-grid">{days.map((day) => { const key = toDateKey(day); const dayEntries = entries.filter((entry) => eventDay(entry) === key); const inMonth = day.getMonth() === selectedDate.getMonth(); return <div className={`month-day${inMonth ? "" : " outside"}${key === toDateKey(new Date()) ? " today" : ""}`} key={key} role="gridcell"><button aria-label={`Plan ${new Intl.DateTimeFormat("en-PH", { dateStyle: "full" }).format(day)}${dayEntries.length ? `, ${dayEntries.length} entries` : ""}`} onClick={() => { updateUrl({ date: key }); openNew(day); }} type="button"><strong>{day.getDate()}</strong>{dayEntries.slice(0, 3).map((entry) => <span className={entry.kind} key={entry.id}>{entry.title}</span>)}{dayEntries.length > 3 ? <small>+{dayEntries.length - 3} more</small> : null}</button></div>; })}</div>
            </div>
          ) : null}
          {loadState === "ready" && entries.length === 0 ? <div className="calendar-empty"><CalendarPlus aria-hidden="true" /><div><strong>No entries match this view.</strong><p>Add a teaching session or clear a filter to see the full plan.</p></div><button onClick={() => openNew()} type="button">Add first entry</button></div> : null}
        </section>

        {editorOpen ? <aside className="calendar-editor panel" aria-label={editing ? "Edit schedule entry" : "Create schedule entry"}><form noValidate onSubmit={save}><header><div><span>{editing ? "Plan details" : "New plan item"}</span><h2>{editing ? "Edit schedule entry" : "Add to teaching plan"}</h2></div><button aria-label="Close editor" onClick={() => setEditorOpen(false)} type="button"><X aria-hidden="true" /></button></header><div className="calendar-editor-fields">
          <label className="field-wide"><span>Title</span><input autoFocus maxLength={160} onChange={(event) => updateDraft("title", event.target.value)} placeholder="e.g. Fractions review" value={draft.title} />{formErrors.title ? <small role="alert">{formErrors.title}</small> : null}</label>
          <label><span>Type</span><select onChange={(event) => changeKind(event.target.value as ScheduleEntryKind)} value={draft.kind}>{kinds.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
          <label><span>Status</span><select onChange={(event) => updateDraft("status", event.target.value as ScheduleEntryStatus)} value={draft.status}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          <label><span>Starts</span><input onChange={(event) => updateDateTime("startsAt", event.target.value)} type="datetime-local" value={draft.startsAt ? toLocalDateTimeValue(new Date(draft.startsAt)) : ""} />{formErrors.startsAt ? <small role="alert">{formErrors.startsAt}</small> : null}</label>
          <label><span>Ends</span><input onChange={(event) => updateDateTime("endsAt", event.target.value)} type="datetime-local" value={draft.endsAt ? toLocalDateTimeValue(new Date(draft.endsAt)) : ""} />{formErrors.endsAt ? <small role="alert">{formErrors.endsAt}</small> : null}</label>
          <label className="field-wide"><span>Subject <em>optional</em></span><input maxLength={120} onChange={(event) => updateDraft("subject", event.target.value || null)} placeholder="Learning area" value={draft.subject ?? ""} /></label>
          {draft.kind !== "other" ? <label className="field-wide"><span><Link2 aria-hidden="true" /> Link saved {draft.kind === "assessment" ? "assessment" : "lesson"} <em>optional</em></span><select onChange={(event) => { const id = event.target.value || null; if (draft.kind === "assessment") updateDraft("assessmentId", id); else if (draft.kind === "teaching_pack") updateDraft("teachingPackLessonId", id); else updateDraft("lessonPlanId", id); }} value={linkValue ?? ""}><option value="">No linked item</option>{linkOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label> : null}
          <label className="field-wide"><span>Planning notes <em>optional</em></span><textarea maxLength={500} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Materials to prepare or a brief teaching note" rows={4} value={draft.notes} /></label>
        </div><footer>{editing ? <div>{confirmDelete ? <><span>Delete this entry?</span><button className="danger" disabled={saving} onClick={() => void remove()} type="button">Yes, delete</button><button onClick={() => setConfirmDelete(false)} type="button">Keep it</button></> : <button className="delete-trigger" onClick={() => setConfirmDelete(true)} type="button"><Trash2 aria-hidden="true" /> Delete</button>}</div> : <span />}<button className="calendar-save" disabled={saving} type="submit"><Check aria-hidden="true" /> {saving ? "Saving…" : editing ? "Save changes" : "Add entry"}</button></footer></form></aside> : null}
      </div>

      <p className="calendar-footnote">Calendar dates and filters are kept in the URL, so you can bookmark the exact planning view. <Link href="/settings/classroom-context">Set classroom defaults</Link></p>
    </div>
  );
}
