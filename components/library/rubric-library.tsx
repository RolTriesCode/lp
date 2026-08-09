"use client";

import { ExternalLink, SearchX, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getDraftRubric } from "@/lib/draft-store";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import type { LessonPlan } from "@/schemas/lesson";
import type { Rubric } from "@/schemas/rubric";
import { LibraryEmptyState, LibraryErrorState, LibraryLoadingState } from "./library-states";

export function RubricLibrary({ initialQuery, initialState }: { initialQuery: string; initialState: string }) {
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [rubrics, setRubrics] = useState<Map<string, Rubric>>(new Map());
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [sourceLessonId, setSourceLessonId] = useState("");

  async function load() {
    setState("loading");
    try {
      const nextLessons = await defaultStorageAdapter.listLessons();
      setLessons(nextLessons);
      setSourceLessonId((current) => current || nextLessons[0]?.id || "");
      setRubrics(new Map(nextLessons.flatMap((lesson) => {
        const rubric = lesson.id ? getDraftRubric(lesson.id) : null;
        return rubric && lesson.id ? [[lesson.id, rubric] as const] : [];
      })));
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Lesson records could not be loaded.");
      setState("error");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const filtered = lessons.filter((lesson) => {
    const hasRubric = Boolean(lesson.id && rubrics.has(lesson.id));
    const queryMatches = `${lesson.title} ${lesson.subject} ${lesson.subjectMatter.topic}`.toLowerCase().includes(initialQuery.toLowerCase());
    return queryMatches && (initialState !== "saved" || hasRubric);
  });
  const builderHref = sourceLessonId ? `/lesson/${sourceLessonId}/rubric` : "/lesson/create";

  return (
    <div className="library-page artifact-library-page">
      <header className="library-page-header"><div><h1>Rubrics</h1><p>Build transparent grading criteria from a saved lesson and reopen local rubric drafts.</p></div><Link className="library-primary-action" href={builderHref}>New rubric</Link></header>
      <section className="artifact-create-strip"><div><strong>Start from a lesson</strong><span>Rubrics remain linked to the task and learning objectives they evaluate.</span></div>{lessons.length ? <label><span>Source lesson</span><select onChange={(event) => setSourceLessonId(event.target.value)} value={sourceLessonId}>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}</select></label> : <p>Create a lesson before generating a rubric.</p>}<Link href={builderHref}>{lessons.length ? "Open rubric builder" : "Create a lesson"}<ExternalLink aria-hidden="true" /></Link></section>
      <form action="/rubrics" className="artifact-filter-bar" method="get"><label><span>Search</span><input defaultValue={initialQuery} name="q" placeholder="Search lessons or topics" type="search" /></label><label><span>Rubric state</span><select defaultValue={initialState || "all"} name="state"><option value="all">All eligible lessons</option><option value="saved">Saved rubric drafts</option></select></label><button type="submit">Apply filters</button><Link href="/rubrics">Clear</Link></form>
      <section className="artifact-results panel"><div className="resource-list-heading"><h2>Lesson-linked rubrics</h2><span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span></div>{state === "loading" ? <LibraryLoadingState label="Loading rubric workspace…" /> : null}{state === "error" ? <LibraryErrorState message={message} onRetry={() => void load()} /> : null}{state === "ready" && filtered.length === 0 ? <LibraryEmptyState actionHref={lessons.length ? "/rubrics" : "/lesson/create"} actionLabel={lessons.length ? "Clear filters" : "Create your first lesson"} body={lessons.length ? "No lesson-linked rubric matches this search." : "Rubrics begin with a lesson so criteria stay aligned to a real classroom task."} icon={lessons.length ? SearchX : Target} title={lessons.length ? "No matching rubrics" : "No lessons available"} /> : null}{state === "ready" && filtered.length ? <ul className="rubric-launch-list">{filtered.map((lesson) => { const rubric = lesson.id ? rubrics.get(lesson.id) : null; return <li key={lesson.id}><span className="artifact-symbol rubrics"><Target aria-hidden="true" /></span><div><strong>{rubric?.title ?? lesson.title}</strong><span>{lesson.gradeLevel} · {lesson.subject} · {lesson.subjectMatter.topic}</span><small>{rubric ? `${rubric.criteria.length} criteria · Saved locally` : "No rubric draft yet"}</small></div><span className={`artifact-status ${rubric ? "ready" : "draft"}`}>{rubric ? "saved" : "not started"}</span><Link href={`/lesson/${lesson.id}/rubric`}>{rubric ? "Open rubric" : "Create rubric"}</Link></li>; })}</ul> : null}</section>
    </div>
  );
}
