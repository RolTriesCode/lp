"use client";

import { BookOpen, FileText, FolderOpen, Search, SearchX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import { defaultResourceRepository } from "@/lib/resources/repository";
import { defaultTemplateRepository } from "@/lib/templates/repository";
import type { LessonPlan } from "@/schemas/lesson";
import type { TeachingResource } from "@/schemas/resource";
import type { LessonTemplate } from "@/schemas/template";
import { LibraryErrorState, LibraryLoadingState } from "./library-states";

export function GlobalSearch({ query }: { query: string }) {
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [templates, setTemplates] = useState<LessonTemplate[]>([]);
  const [resources, setResources] = useState<TeachingResource[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  async function load() {
    setState("loading");
    try {
      const [nextLessons, nextTemplates, nextResources] = await Promise.all([
        defaultStorageAdapter.listLessons(),
        defaultTemplateRepository.list(),
        defaultResourceRepository.list(),
      ]);
      setLessons(nextLessons);
      setTemplates(nextTemplates);
      setResources(nextResources);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search sources could not be loaded.");
      setState("error");
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const normalized = query.trim().toLowerCase();
  const matchingLessons = lessons.filter((lesson) => `${lesson.title} ${lesson.subject} ${lesson.subjectMatter.topic}`.toLowerCase().includes(normalized));
  const matchingTemplates = templates.filter((template) => `${template.name} ${template.description} ${template.defaults.subject}`.toLowerCase().includes(normalized));
  const matchingResources = resources.filter((resource) => `${resource.name} ${resource.extractedText.slice(0, 1_000)}`.toLowerCase().includes(normalized));
  const total = matchingLessons.length + matchingTemplates.length + matchingResources.length;

  return (
    <div className="library-page global-search-page">
      <header className="library-page-header"><div><h1>Workspace Search</h1><p>Find lesson plans, reusable templates, and private teaching resources from one place.</p></div></header>
      <form action="/search" className="global-search-form" method="get"><Search aria-hidden="true" /><label className="sr-only" htmlFor="workspace-search">Search workspace</label><input autoFocus defaultValue={query} id="workspace-search" name="q" placeholder="Search lesson titles, subjects, templates, or resources" type="search" /><button type="submit">Search</button></form>
      {state === "loading" ? <LibraryLoadingState label="Searching your workspace…" /> : null}
      {state === "error" ? <LibraryErrorState message={message} onRetry={() => void load()} /> : null}
      {state === "ready" && !normalized ? <div className="search-guidance panel"><Search aria-hidden="true" /><div><h2>Search across your teaching workspace</h2><p>Try a lesson topic, subject, template name, or uploaded filename.</p></div><div><Link href="/lesson">Browse lessons</Link><Link href="/templates">Browse templates</Link><Link href="/resources">Browse resources</Link></div></div> : null}
      {state === "ready" && normalized ? <><div className="search-result-summary"><strong>{total} result{total === 1 ? "" : "s"}</strong><span>for “{query.trim()}”</span></div>{total === 0 ? <div className="library-empty-state"><SearchX aria-hidden="true" /><h2>No workspace records match</h2><p>Try fewer words, check the spelling, or browse a library directly.</p><Link href="/lesson">Browse lesson plans</Link></div> : <div className="search-result-groups"><SearchGroup icon={BookOpen} label="Lesson plans" viewAllHref={`/lesson?q=${encodeURIComponent(query)}`}><ul>{matchingLessons.slice(0, 6).map((lesson) => <li key={lesson.id}><Link href={`/lesson/${lesson.id}`}><strong>{lesson.title}</strong><span>{lesson.gradeLevel} · {lesson.subject} · {lesson.subjectMatter.topic}</span></Link></li>)}</ul></SearchGroup><SearchGroup icon={FolderOpen} label="Templates" viewAllHref="/templates"><ul>{matchingTemplates.slice(0, 6).map((template) => <li key={template.id}><Link href={`/templates?selected=${encodeURIComponent(template.id)}`}><strong>{template.name}</strong><span>{template.defaults.curriculum} · Grade {template.defaults.grade} · {template.defaults.subject}</span></Link></li>)}</ul></SearchGroup><SearchGroup icon={FileText} label="Resources" viewAllHref="/resources"><ul>{matchingResources.slice(0, 6).map((resource) => <li key={resource.id}><Link href={`/resources?selected=${encodeURIComponent(resource.id)}`}><strong>{resource.name}</strong><span>{resource.mimeType} · {resource.extractedText.length.toLocaleString()} context characters</span></Link></li>)}</ul></SearchGroup></div>}</> : null}
    </div>
  );
}

function SearchGroup({ icon: Icon, label, viewAllHref, children }: { icon: typeof BookOpen; label: string; viewAllHref: string; children: React.ReactNode }) {
  return <section className="search-result-group panel"><header><span><Icon aria-hidden="true" /><strong>{label}</strong></span><Link href={viewAllHref}>View library</Link></header>{children}</section>;
}
