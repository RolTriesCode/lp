"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Copy,
  ExternalLink,
  FilePenLine,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLessonStore } from "@/stores/lesson-store";
import type { LessonPlan } from "@/schemas/lesson";
import { mockLessonPlans } from "@/lib/mock-lessons";

function LessonActions({ lesson, onOpen, onDuplicate, onDelete }: {
  lesson: LessonPlan | any;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="row-menu"
          type="button"
          aria-label={`Actions for ${lesson.title}`}
        >
          <MoreVertical aria-hidden="true" size={16} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          className="lesson-menu-content"
          collisionPadding={12}
          sideOffset={6}
        >
          <DropdownMenu.Item className="lesson-menu-item" onClick={onOpen}>
            <ExternalLink aria-hidden="true" size={14} strokeWidth={1.8} />
            Open Editor
          </DropdownMenu.Item>
          <DropdownMenu.Item className="lesson-menu-item" onClick={onDuplicate}>
            <Copy aria-hidden="true" size={14} strokeWidth={1.8} />
            Duplicate Copy
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="lesson-menu-separator" />
          <DropdownMenu.Item className="lesson-menu-item destructive" onClick={onDelete}>
            <Trash2 aria-hidden="true" size={14} strokeWidth={1.8} />
            Delete Draft
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function RecentLessonPlans() {
  const router = useRouter();
  const { lessonsList, listAllLessons, duplicateLesson, deleteLesson } = useLessonStore();

  useEffect(() => {
    listAllLessons();
  }, [listAllLessons]);

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

  // Display top 5 most recent active lessons; fallback to mocks if empty
  const activeLessons = lessonsList.slice(0, 5);
  const displayLessons = activeLessons.length > 0 ? activeLessons : null;

  return (
    <section className="recent panel">
      <div className="section-heading">
        <h2>Recent Lesson Plans</h2>
        <button type="button" onClick={() => router.push("/lesson")}>
          View all
        </button>
      </div>
      <div className="plans-table" role="table" aria-label="Recent lesson plans">
        <div className="plans-row plans-header" role="row">
          <span role="columnheader">LESSON PLAN</span>
          <span role="columnheader">GRADE &amp; SUBJECT</span>
          <span role="columnheader">CURRICULUM</span>
          <span role="columnheader">UPDATED</span>
          <span role="columnheader">STATUS</span>
          <span role="columnheader" aria-label="Actions" />
        </div>

        {displayLessons ? (
          displayLessons.map((lesson) => (
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
              <div role="cell">
                <span className="status draft">Local Draft</span>
              </div>
              <div className="plan-actions-cell" role="cell">
                <LessonActions
                  lesson={lesson}
                  onOpen={() => router.push(`/lesson/${lesson.id}`)}
                  onDuplicate={() => handleDuplicate(lesson.id!)}
                  onDelete={() => handleDelete(lesson.id!, lesson.title)}
                />
              </div>
            </div>
          ))
        ) : (
          mockLessonPlans.map((lesson) => (
            <div className="plans-row" key={lesson.id} role="row">
              <div className="plan-title" role="cell">
                <div className={`file-icon ${lesson.tone}`}>
                  <FilePenLine aria-hidden="true" size={16} />
                </div>
                <div>
                  <strong>{lesson.title}</strong>
                  <span>{lesson.lessonType}</span>
                </div>
              </div>
              <div className="plan-secondary" role="cell">
                {lesson.grade}<b>•</b>{lesson.subject}
              </div>
              <div role="cell">
                <span className="curriculum">{lesson.curriculum}</span>
              </div>
              <div className="plan-date" role="cell">
                <span>{lesson.updatedDate}</span>
                <span>{lesson.updatedTime}</span>
              </div>
              <div role="cell">
                <span className={`status ${lesson.status.toLowerCase()}`}>{lesson.status}</span>
              </div>
              <div className="plan-actions-cell" role="cell">
                <button
                  className="row-menu"
                  type="button"
                  onClick={() => alert("This is a demo mockup lesson. Create a new lesson to enable full editing actions.")}
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
