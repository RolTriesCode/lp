"use client";

import { BookOpen } from "lucide-react";
import type { LessonPlan } from "@/schemas/lesson";

type SubjectMatterSectionProps = {
  lesson: LessonPlan;
  onChange: (updatedSubjectMatter: LessonPlan["subjectMatter"]) => void;
};

export function SubjectMatterSection({ lesson, onChange }: SubjectMatterSectionProps) {
  const sm = lesson.subjectMatter || { topic: "" };

  return (
    <section className="lesson-form-card" id="section-subject-matter">
      <div className="card-header">
        <div className="card-icon green">
          <BookOpen size={20} />
        </div>
        <div>
          <h2>2. Subject Matter & Resources</h2>
          <p>Topic focus, references, materials, and values integration.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-sm-topic">Topic</label>
          <input
            id="edit-sm-topic"
            className="form-input"
            type="text"
            value={sm.topic}
            onChange={(e) => onChange({ ...sm, topic: e.target.value })}
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-sm-values">Values Integration (comma separated)</label>
          <input
            id="edit-sm-values"
            className="form-input"
            type="text"
            value={(sm.valuesIntegration || []).join(", ")}
            onChange={(e) =>
              onChange({
                ...sm,
                valuesIntegration: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g. Environmental stewardship, Teamwork, Social responsibility"
          />
        </div>

        <div className="form-grid-2">
          <div className="form-group">
            <label className="field-label" htmlFor="edit-sm-materials">Teaching Materials (comma separated)</label>
            <input
              id="edit-sm-materials"
              className="form-input"
              type="text"
              value={(sm.materials || []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...sm,
                  materials: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>

          <div className="form-group">
            <label className="field-label" htmlFor="edit-sm-references">References (comma separated)</label>
            <input
              id="edit-sm-references"
              className="form-input"
              type="text"
              value={(sm.references || []).join(", ")}
              onChange={(e) =>
                onChange({
                  ...sm,
                  references: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}
