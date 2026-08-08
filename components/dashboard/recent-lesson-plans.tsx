"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Copy,
  Download,
  ExternalLink,
  FilePenLine,
  MoreVertical,
  Presentation,
  Trash2,
} from "lucide-react";
import { mockLessonPlans, type MockLessonPlan } from "@/lib/mock-lessons";

const menuActions = [
  { label: "Open", icon: ExternalLink },
  { label: "Duplicate", icon: Copy },
  { label: "Generate PPT", icon: Presentation },
  { label: "Export", icon: Download },
] as const;

function LessonActions({ lesson }: { lesson: MockLessonPlan }) {
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
          {menuActions.map(({ label, icon: Icon }) => (
            <DropdownMenu.Item className="lesson-menu-item" key={label}>
              <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
              {label}
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="lesson-menu-separator" />
          <DropdownMenu.Item className="lesson-menu-item destructive">
            <Trash2 aria-hidden="true" size={14} strokeWidth={1.8} />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function LessonRow({ lesson }: { lesson: MockLessonPlan }) {
  return (
    <div className="plans-row" role="row">
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
      <div role="cell"><span className="curriculum">{lesson.curriculum}</span></div>
      <div className="plan-date" role="cell">
        <span>{lesson.updatedDate}</span>
        <span>{lesson.updatedTime}</span>
      </div>
      <div role="cell">
        <span className={`status ${lesson.status.toLowerCase()}`}>{lesson.status}</span>
      </div>
      <div className="plan-actions-cell" role="cell">
        <LessonActions lesson={lesson} />
      </div>
    </div>
  );
}

export function RecentLessonPlans() {
  return (
    <section className="recent panel">
      <div className="section-heading">
        <h2>Recent Lesson Plans</h2>
        <button type="button">View all</button>
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
        {mockLessonPlans.map((lesson) => (
          <LessonRow key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
