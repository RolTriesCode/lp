"use client";

import { Target } from "lucide-react";
import type { LessonPlan } from "@/schemas/lesson";

type StandardsSectionProps = {
  lesson: LessonPlan;
  onChange: (updatedStandards: LessonPlan["standards"]) => void;
};

export function StandardsSection({ lesson, onChange }: StandardsSectionProps) {
  const standards = lesson.standards || {};

  return (
    <section className="lesson-form-card" id="section-standards">
      <div className="card-header">
        <div className="card-icon violet">
          <Target size={20} />
        </div>
        <div>
          <h2>1. Standards & Learning Competency</h2>
          <p>DepEd Content Standards, Performance Standards, and Learning Competency Code.</p>
        </div>
      </div>
      <div className="card-body">
        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-competency">
            Learning Competency Statement
          </label>
          <textarea
            id="edit-competency"
            className="form-textarea"
            rows={2}
            value={standards.learningCompetency || ""}
            onChange={(e) =>
              onChange({
                ...standards,
                learningCompetency: e.target.value,
              })
            }
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-competency-code">
            Official Competency Code
          </label>
          <input
            id="edit-competency-code"
            className="form-input"
            type="text"
            value={standards.competencyCode || ""}
            onChange={(e) =>
              onChange({
                ...standards,
                competencyCode: e.target.value,
              })
            }
            placeholder="e.g. S7LT-IIg-7 or leave blank if unverified"
          />
        </div>

        <div className="form-group" style={{ marginBottom: "16px" }}>
          <label className="field-label" htmlFor="edit-content-standard">
            Content Standard
          </label>
          <textarea
            id="edit-content-standard"
            className="form-textarea"
            rows={2}
            value={standards.contentStandard || ""}
            onChange={(e) =>
              onChange({
                ...standards,
                contentStandard: e.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="edit-performance-standard">
            Performance Standard
          </label>
          <textarea
            id="edit-performance-standard"
            className="form-textarea"
            rows={2}
            value={standards.performanceStandard || ""}
            onChange={(e) =>
              onChange({
                ...standards,
                performanceStandard: e.target.value,
              })
            }
          />
        </div>
      </div>
    </section>
  );
}
