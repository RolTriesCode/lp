"use client";

import { BookOpen } from "lucide-react";
import type { LessonPlan } from "@/schemas/lesson";

type MetadataSectionProps = {
  lesson: LessonPlan;
  onChange: (updated: Partial<LessonPlan>) => void;
};

export function MetadataSection({ lesson, onChange }: MetadataSectionProps) {
  return (
    <section className="lesson-form-card" id="section-metadata">
      <div className="card-header">
        <div className="card-icon violet">
          <BookOpen size={20} />
        </div>
        <div>
          <h2>Lesson Overview & Metadata</h2>
          <p>Title, grade level, subject area, and framework settings.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-title">
            Lesson Title <span className="required">*</span>
          </label>
          <input
            id="edit-title"
            className="form-input"
            type="text"
            value={lesson.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="Lesson Title"
          />
        </div>

        <div className="form-grid-3">
          <div className="form-group">
            <label className="field-label" htmlFor="edit-grade">Grade Level</label>
            <input
              id="edit-grade"
              className="form-input"
              type="text"
              value={lesson.gradeLevel}
              onChange={(e) => onChange({ gradeLevel: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label" htmlFor="edit-subject">Subject Area</label>
            <input
              id="edit-subject"
              className="form-input"
              type="text"
              value={lesson.subject}
              onChange={(e) => onChange({ subject: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label" htmlFor="edit-quarter">Quarter / Term</label>
            <input
              id="edit-quarter"
              className="form-input"
              type="text"
              value={lesson.quarter}
              onChange={(e) => onChange({ quarter: e.target.value })}
            />
          </div>
        </div>

        <div className="form-grid-2" style={{ marginTop: "16px" }}>
          <div className="form-group">
            <label className="field-label" htmlFor="edit-duration">Duration</label>
            <input
              id="edit-duration"
              className="form-input"
              type="text"
              value={lesson.duration}
              onChange={(e) => onChange({ duration: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="field-label">Educational Framework</label>
            <div className="form-input" style={{ background: "#f8f9fc", color: "#5637f5", fontWeight: "650" }}>
              {lesson.curriculum} ({lesson.lessonType})
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
