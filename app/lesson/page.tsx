"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { use, useEffect } from "react";
import { useLessonStore } from "@/stores/lesson-store";
import { LocalLessonImport } from "@/components/lesson/local-lesson-import";
import Link from "next/link";
import {
  BookOpen,
  Copy,
  ExternalLink,
  FilePenLine,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import "@/components/dashboard/dashboard.css";

type LessonLibrarySearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function LessonLibraryPage({ searchParams }: { searchParams: LessonLibrarySearchParams }) {
  const router = useRouter();
  const params = use(searchParams);
  const { lessonsList, listAllLessons, duplicateLesson, deleteLesson, isLoading, errorState } =
    useLessonStore();
  const searchQuery = first(params.q).slice(0, 120);
  const curriculumFilter = first(params.curriculum);
  const typeFilter = first(params.type);
  const requestedSection = ["objectives", "procedures", "assessment", "pedagogy"].includes(first(params.section)) ? first(params.section) : "";

  useEffect(() => {
    listAllLessons();
  }, [listAllLessons]);

  const filteredLessons = lessonsList.filter((lesson) => {
    const matchesQuery = `${lesson.title} ${lesson.subject} ${lesson.subjectMatter.topic}`.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesQuery
      && (!curriculumFilter || lesson.curriculum === curriculumFilter)
      && (!typeFilter || lesson.lessonType === typeFilter);
  });

  const lessonHref = (id: string | undefined) => id ? `/lesson/${id}${requestedSection ? `?section=${requestedSection}` : ""}` : "/lesson";

  async function handleDuplicate(id: string) {
    const newId = await duplicateLesson(id);
    if (newId) {
      router.push(`/lesson/${newId}`);
    }
  }

  function handleDelete(id: string, title: string) {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      void deleteLesson(id);
    }
  }

  return (
    <DashboardShell currentPath="/lesson">
      <div className="library-page lesson-library-page">
        <header className="library-page-header">
          <div>
            <h1>My Lesson Plans</h1>
            <p>{requestedSection ? `Choose a lesson to open its ${requestedSection} tools.` : "Manage, edit, duplicate, and organize your saved structured lesson plans."}</p>
          </div>
          <Link href="/lesson/create" className="library-primary-action">
            <Plus size={15} /> Create new lesson
          </Link>
        </header>

        <LocalLessonImport onImported={listAllLessons} />

        <form action="/lesson" className="artifact-filter-bar lesson-filter-bar" method="get">
          {requestedSection ? <input name="section" type="hidden" value={requestedSection} /> : null}
          <label><span>Search</span><span className="filter-input-with-icon"><Search aria-hidden="true" /><input defaultValue={searchQuery} name="q" placeholder="Search title, topic, or subject" type="search" /></span></label>
          <label><span>Curriculum</span><select defaultValue={curriculumFilter} name="curriculum"><option value="">All curricula</option><option value="MATATAG">MATATAG</option><option value="ILAW">ILAW</option></select></label>
          <label><span>Lesson format</span><select defaultValue={typeFilter} name="type"><option value="">All formats</option><option value="DETAILED">Detailed</option><option value="SEMI_DETAILED">Semi-detailed</option><option value="DAILY_LOG">Daily lesson log</option></select></label>
          <button type="submit">Apply filters</button><Link href={requestedSection ? `/lesson?section=${requestedSection}` : "/lesson"}>Clear</Link>
        </form>

        {/* Lesson List Table */}
        <section className="recent panel">
          <div className="plans-table" role="table" aria-label="Lesson plans library">
            <div className="plans-row plans-header" role="row">
              <span role="columnheader">LESSON PLAN</span>
              <span role="columnheader">GRADE &amp; SUBJECT</span>
              <span role="columnheader">CURRICULUM</span>
              <span role="columnheader">UPDATED</span>
              <span role="columnheader">STATUS</span>
              <span role="columnheader" aria-label="Actions" />
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#7b88a2" }}>
                <span>Loading lesson library...</span>
              </div>
            ) : errorState ? (
              <div className="plans-empty-row error" role="alert">
                <span>{errorState}</span>
                <button onClick={() => void listAllLessons()} type="button">Try again</button>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#7b88a2" }}>
                <BookOpen size={24} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", margin: "0" }}>
                  {searchQuery || curriculumFilter || typeFilter ? "No lessons match these filters. Clear a filter and try again." : "No lesson plans have been saved yet."}
                </p>
                <Link className="lesson-empty-action" href={searchQuery || curriculumFilter || typeFilter ? "/lesson" : "/lesson/create"}>{searchQuery || curriculumFilter || typeFilter ? "Clear filters" : "Create your first lesson"}</Link>
              </div>
            ) : (
              filteredLessons.map((lesson) => (
                <div className="plans-row" key={lesson.id} role="row">
                  <div className="plan-title" role="cell">
                    <div className="file-icon blue">
                      <FilePenLine aria-hidden="true" size={16} />
                    </div>
                    <div>
                      <Link href={lessonHref(lesson.id)}>{lesson.title}</Link>
                      <span>{lesson.lessonType}</span>
                    </div>
                  </div>
                  <div className="plan-secondary" role="cell">
                    {lesson.gradeLevel} <b>•</b> {lesson.subject}
                  </div>
                  <div role="cell">
                    <span className="curriculum">{lesson.curriculum}</span>
                  </div>
                  <div className="plan-date" role="cell">
                    <span>{new Date(lesson.updatedAt || "").toLocaleDateString()}</span>
                    <span>{new Date(lesson.updatedAt || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div role="cell"><span className="status draft">Saved draft</span></div>
                  <div className="plan-actions-cell" role="cell">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="row-menu" type="button" aria-label={`Actions for ${lesson.title}`}>
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="lesson-menu-content" sideOffset={6}>
                          <DropdownMenu.Item className="lesson-menu-item" onClick={() => router.push(lessonHref(lesson.id))}>
                            <ExternalLink size={13} style={{ marginRight: "8px" }} /> Open Editor
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="lesson-menu-item" onClick={() => handleDuplicate(lesson.id!)}>
                            <Copy size={13} style={{ marginRight: "8px" }} /> Duplicate Copy
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="lesson-menu-separator" />
                          <DropdownMenu.Item className="lesson-menu-item destructive" onClick={() => handleDelete(lesson.id!, lesson.title)}>
                            <Trash2 size={13} style={{ marginRight: "8px" }} /> Delete Draft
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
