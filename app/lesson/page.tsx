"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useEffect, useState } from "react";
import { useLessonStore } from "@/stores/lesson-store";
import { LessonViewer } from "@/components/lesson/lesson-viewer";
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

export default function LessonLibraryPage() {
  const router = useRouter();
  const { lessonsList, listAllLessons, duplicateLesson, deleteLesson, isLoading } =
    useLessonStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    listAllLessons();
  }, [listAllLessons]);

  const filteredLessons = lessonsList.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.subjectMatter.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleDuplicate(id: string) {
    const newId = await duplicateLesson(id);
    if (newId) {
      router.push(`/lesson/${newId}`);
    }
  }

  function handleDelete(id: string, title: string) {
    if (confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteLesson(id);
    }
  }

  return (
    <DashboardShell currentPath="/dashboard">
      <div className="dashboard-content" style={{ padding: "0 0 40px" }}>
        <div className="section-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "750", color: "#151928", margin: "0 0 4px" }}>
              My Lesson Library
            </h1>
            <p style={{ color: "#54627e", fontSize: "12px", margin: "0" }}>
              Manage, edit, duplicate, and delete your generated structured lesson drafts.
            </p>
          </div>
          <Link href="/lesson/create" className="btn-primary-generate" style={{ padding: "8px 18px", fontSize: "12px" }}>
            <Plus size={15} /> Create New Lesson
          </Link>
        </div>

        {/* Search Filter Bar */}
        <div className="panel" style={{ padding: "12px 18px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
          <Search size={16} color="#7b88a2" />
          <input
            type="text"
            className="form-input"
            style={{ border: "0", padding: "4px", fontSize: "13px", outline: "none", boxShadow: "none" }}
            placeholder="Search by lesson title or topic focus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Lesson List Table */}
        <section className="recent panel">
          <div className="plans-table" role="table" aria-label="Lesson plans library">
            <div className="plans-row plans-header" role="row">
              <span role="columnheader">LESSON PLAN</span>
              <span role="columnheader">GRADE &amp; SUBJECT</span>
              <span role="columnheader">CURRICULUM</span>
              <span role="columnheader">UPDATED</span>
              <span role="columnheader" aria-label="Actions" />
            </div>

            {isLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#7b88a2" }}>
                <span>Loading lesson library...</span>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#7b88a2" }}>
                <BookOpen size={24} style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: "13px", margin: "0" }}>
                  {searchQuery ? "No matching lessons found." : "No lesson plan drafts created yet."}
                </p>
              </div>
            ) : (
              filteredLessons.map((lesson) => (
                <div className="plans-row" key={lesson.id} role="row">
                  <div className="plan-title" role="cell">
                    <div className="file-icon blue">
                      <FilePenLine aria-hidden="true" size={16} />
                    </div>
                    <div>
                      <strong style={{ cursor: "pointer" }} onClick={() => router.push(`/lesson/${lesson.id}`)}>
                        {lesson.title}
                      </strong>
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
                  <div className="plan-actions-cell" role="cell">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <button className="row-menu" type="button" aria-label={`Actions for ${lesson.title}`}>
                          <MoreVertical size={16} />
                        </button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content align="end" className="lesson-menu-content" sideOffset={6}>
                          <DropdownMenu.Item className="lesson-menu-item" onClick={() => router.push(`/lesson/${lesson.id}`)}>
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
