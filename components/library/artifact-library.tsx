"use client";

import {
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Plus,
  Presentation,
  SearchX,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteArtifactLibraryItem,
  listArtifactLibrary,
  type ArtifactLibraryItem,
  type ArtifactLibraryKind,
} from "@/lib/library/artifacts";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import type { LessonPlan } from "@/schemas/lesson";
import { LibraryEmptyState, LibraryErrorState, LibraryLoadingState } from "./library-states";

type ArtifactLibraryProps = {
  kind: ArtifactLibraryKind;
  initialQuery: string;
  initialStatus: string;
  initialLessonId: string;
};

const configurations = {
  presentations: {
    title: "Presentations",
    description: "Open, review, and continue slide decks connected to your saved lessons.",
    singular: "presentation",
    icon: Presentation,
    builderSegment: "present",
  },
  assessments: {
    title: "Assessments",
    description: "Manage formative checks and answer keys without separating them from lesson context.",
    singular: "assessment",
    icon: ClipboardCheck,
    builderSegment: "assessment",
  },
  worksheets: {
    title: "Worksheets",
    description: "Prepare, edit, and print learner practice linked to the lesson that produced it.",
    singular: "worksheet",
    icon: FileCheck2,
    builderSegment: "worksheet",
  },
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function ArtifactLibrary({ kind, initialQuery, initialStatus, initialLessonId }: ArtifactLibraryProps) {
  const config = configurations[kind];
  const [items, setItems] = useState<ArtifactLibraryItem[]>([]);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [createLessonId, setCreateLessonId] = useState(initialLessonId);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function load() {
    setState("loading");
    setMessage(null);
    try {
      const [nextItems, nextLessons] = await Promise.all([
        listArtifactLibrary(kind),
        defaultStorageAdapter.listLessons(),
      ]);
      setItems(nextItems.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setLessons(nextLessons);
      setCreateLessonId((current) => current || nextLessons[0]?.id || "");
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `Your saved ${config.title.toLowerCase()} are temporarily unavailable.`);
      setState("error");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [kind]);

  const lessonById = useMemo(() => new Map(lessons.map((lesson) => [lesson.id, lesson])), [lessons]);
  const filtered = items.filter((item) => {
    const lesson = lessonById.get(item.lessonId);
    const haystack = `${item.title} ${lesson?.title ?? ""} ${lesson?.subject ?? ""}`.toLowerCase();
    return (!initialQuery || haystack.includes(initialQuery.toLowerCase()))
      && (!initialStatus || initialStatus === "all" || item.status === initialStatus)
      && (!initialLessonId || item.lessonId === initialLessonId);
  });

  async function remove(item: ArtifactLibraryItem) {
    try {
      await deleteArtifactLibraryItem(kind, item.id);
      setPendingDeleteId(null);
      setMessage(`“${item.title}” was removed.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : `The ${config.singular} could not be removed.`);
    }
  }

  const builderHref = createLessonId ? `/lesson/${createLessonId}/${config.builderSegment}` : "/lesson/create";

  return (
    <div className="library-page artifact-library-page">
      <header className="library-page-header">
        <div><h1>{config.title}</h1><p>{config.description}</p></div>
        <Link className="library-primary-action" href={builderHref}><Plus aria-hidden="true" size={15} /> New {config.singular}</Link>
      </header>

      <section aria-labelledby={`${kind}-create-heading`} className="artifact-create-strip">
        <div><strong id={`${kind}-create-heading`}>Start from a lesson</strong><span>Artifact builders preserve the lesson link for reopening and editing.</span></div>
        {lessons.length ? <label><span>Source lesson</span><select onChange={(event) => setCreateLessonId(event.target.value)} value={createLessonId}>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label> : <p>Create a lesson first, then return here to build its {config.singular}.</p>}
        <Link href={builderHref}>{lessons.length ? `Open ${config.singular} builder` : "Create a lesson"}<ExternalLink aria-hidden="true" size={14} /></Link>
      </section>

      <form action={`/${kind}`} className="artifact-filter-bar" method="get">
        <label><span>Search</span><input defaultValue={initialQuery} name="q" placeholder={`Search ${config.title.toLowerCase()} or lessons`} type="search" /></label>
        <label><span>Status</span><select defaultValue={initialStatus || "all"} name="status"><option value="all">All statuses</option><option value="draft">Draft</option><option value="ready">Ready</option><option value="archived">Archived</option><option value="error">Needs attention</option></select></label>
        <label><span>Lesson</span><select defaultValue={initialLessonId} name="lessonId"><option value="">All lessons</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label>
        <button type="submit">Apply filters</button>
        <Link href={`/${kind}`}>Clear</Link>
      </form>

      {message && state !== "error" ? <p className="library-message" role="status">{message}</p> : null}
      <section aria-label={`Saved ${config.title.toLowerCase()}`} className="artifact-results panel">
        <div className="resource-list-heading"><h2>Saved {config.title.toLowerCase()}</h2><span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span></div>
        {state === "loading" ? <LibraryLoadingState label={`Loading ${config.title.toLowerCase()}…`} /> : null}
        {state === "error" ? <LibraryErrorState message={message ?? "The repository did not respond."} onRetry={() => void load()} /> : null}
        {state === "ready" && filtered.length === 0 ? <LibraryEmptyState actionHref={lessons.length ? builderHref : "/lesson/create"} actionLabel={items.length ? "Clear filters or create another" : `Create your first ${config.singular}`} body={items.length ? "No saved record matches the current URL filters." : `Choose a saved lesson and create a ${config.singular}; it will appear here automatically.`} icon={items.length ? SearchX : config.icon} title={items.length ? "No matching records" : `No saved ${config.title.toLowerCase()} yet`} /> : null}
        {state === "ready" && filtered.length ? <div className="artifact-table-wrap"><table className="artifact-table"><thead><tr><th scope="col">{config.singular}</th><th scope="col">Source lesson</th><th scope="col">Details</th><th scope="col">Updated</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((item) => { const lesson = lessonById.get(item.lessonId); return <tr key={item.id}><td data-label={config.singular}><span className="artifact-title-cell"><span className={`artifact-symbol ${kind}`}><config.icon aria-hidden="true" /></span><span><strong>{item.title}</strong><small className={`artifact-status ${item.status}`}>{item.status}</small></span></span></td><td data-label="Source lesson"><strong>{lesson?.title ?? "Lesson unavailable"}</strong><small>{lesson ? `${lesson.gradeLevel} · ${lesson.subject}` : "The linked lesson may have been removed."}</small></td><td data-label="Details"><span className="artifact-detail">{item.count} {item.countLabel} · {item.detail}</span></td><td data-label="Updated"><time dateTime={item.updatedAt}>{formatDate(item.updatedAt)}</time></td><td data-label="Actions"><div className="artifact-row-actions"><Link href={`/lesson/${item.lessonId}/${config.builderSegment}`}>Open</Link>{pendingDeleteId === item.id ? <><button className="confirm-delete" onClick={() => void remove(item)} type="button">Confirm</button><button onClick={() => setPendingDeleteId(null)} type="button">Keep</button></> : <button aria-label={`Delete ${item.title}`} onClick={() => setPendingDeleteId(item.id)} type="button"><Trash2 aria-hidden="true" /></button>}</div></td></tr>; })}</tbody></table></div> : null}
      </section>
    </div>
  );
}
