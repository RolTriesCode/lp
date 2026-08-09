"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Layers, Presentation, FileText, CheckSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { getDraftRubric } from "@/lib/draft-store";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import { SupabaseArtifactRepository } from "@/lib/persistence/artifact-repository";
import { PresentationSchema } from "@/schemas/presentation";
import { AssessmentSchema } from "@/schemas/assessment";
import { WorksheetSchema } from "@/schemas/worksheet";
import type { LessonPlan } from "@/schemas/lesson";
import "@/components/rubric/rubric.css";
import { LinkedLessonUnavailable } from "@/components/library/library-states";

type PackPageProps = {
  params: Promise<{ id: string }>;
};

const presentationRepository = new SupabaseArtifactRepository("presentations", PresentationSchema);
const assessmentRepository = new SupabaseArtifactRepository("assessments", AssessmentSchema);
const worksheetRepository = new SupabaseArtifactRepository("worksheets", WorksheetSchema);

export default function PackPage({ params }: PackPageProps) {
  const router = useRouter();
  const { id: lessonId } = use(params);

  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [hasPresentation, setHasPresentation] = useState(false);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [hasWorksheet, setHasWorksheet] = useState(false);
  const [hasRubric, setHasRubric] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (lessonId) {
      void (async () => {
        try {
          const match = await defaultStorageAdapter.getLesson(lessonId);
          if (!match) return setLoadError("The lesson may have been removed, or this account no longer has access to it.");
          setLesson(match);
          const [presentation, assessment, worksheet] = await Promise.all([
            presentationRepository.getForLesson(lessonId),
            assessmentRepository.getForLesson(lessonId),
            worksheetRepository.getForLesson(lessonId),
          ]);
          setHasPresentation(Boolean(presentation));
          setHasAssessment(Boolean(assessment));
          setHasWorksheet(Boolean(worksheet));
          setHasRubric(Boolean(getDraftRubric(lessonId)));
        } catch { setLoadError("The teaching-pack records could not be loaded. Open the lesson and try again."); }
      })();
    }
  }, [lessonId, router]);

  if (loadError) return <LinkedLessonUnavailable message={loadError} />;
  if (!lesson) {
    return (
      <div className="fullscreen-loading">
        <Loader2 className="spinner" />
        <span>Loading lesson teaching pack...</span>
      </div>
    );
  }

  const artifacts = [
    {
      title: "Detailed Lesson Plan",
      description: "Structured content flow, MATATAG/ILAW procedures, objectives, and standards.",
      icon: <BookOpen color="#5637f5" size={24} />,
      status: "available",
      actionText: "Edit Lesson Plan",
      href: `/lesson/${lessonId}`,
    },
    {
      title: "Classroom Widescreen Slides",
      description: "Widescreen HTML slide deck rendered dynamically based on selected theme templates.",
      icon: <Presentation color="#3b82f6" size={24} />,
      status: hasPresentation ? "available" : "missing",
      actionText: hasPresentation ? "Launch Slide Builder" : "Generate Slide Deck",
      href: `/lesson/${lessonId}/present`,
    },
    {
      title: "Formative Assessment",
      description: "Quiz questions, true/false checks, essay items, rubrics, and answer keys.",
      icon: <CheckSquare color="#10b981" size={24} />,
      status: hasAssessment ? "available" : "missing",
      actionText: hasAssessment ? "Open Quiz Editor" : "Generate Assessment Quiz",
      href: `/lesson/${lessonId}/assessment`,
    },
    {
      title: "Learner Worksheet",
      description: "Printable activity sheets with response areas, directives, and hints.",
      icon: <FileText color="#f59e0b" size={24} />,
      status: hasWorksheet ? "available" : "missing",
      actionText: hasWorksheet ? "Edit Activity Worksheet" : "Generate Activity Worksheet",
      href: `/lesson/${lessonId}/worksheet`,
    },
    {
      title: "Grading Rubric Table",
      description: "Performance criteria weights and scale level descriptors for target deliverables.",
      icon: <Layers color="#ec4899" size={24} />,
      status: hasRubric ? "available" : "missing",
      actionText: hasRubric ? "Open Rubric Builder" : "Generate Rubric Table",
      href: `/lesson/${lessonId}/rubric`,
    },
  ];

  return (
    <div className="lesson-create-container" style={{ maxWidth: "1080px", padding: "20px" }}>
      {/* Top Header bar */}
      <div className="lesson-create-header-nav" style={{ marginBottom: "16px" }}>
        <button
          className="lesson-back-btn"
          onClick={() => router.push(`/lesson/${lessonId}`)}
          type="button"
        >
          <ArrowLeft size={16} /> Back to Editor
        </button>
      </div>

      {/* Main Title Block */}
      <div className="lesson-create-title-block" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span className="summary-pill highlight">{lesson.curriculum}</span>
          <span className="summary-pill">{lesson.gradeLevel}</span>
          <span className="summary-pill">{lesson.subject}</span>
        </div>
        <h1>Lesson Teaching Pack Assembler</h1>
        <p>Review, generate, coordinate, and export all teaching materials linked to this lesson topic.</p>
      </div>

      <div className="pack-grid">
        {artifacts.map((item, idx) => (
          <div key={idx} className="pack-card">
            <div>
              <div className="pack-card-header">
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {item.icon}
                  <h3 className="pack-card-title">{item.title}</h3>
                </div>
                <span className={`pack-card-badge ${item.status}`}>
                  {item.status.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#54627e", lineHeight: "1.5", marginBottom: "16px" }}>
                {item.description}
              </p>
            </div>
            <Link
              href={item.href}
              className={`btn-primary-generate`}
              style={{ width: "100%", padding: "8px", fontSize: "12px", textAlign: "center", textDecoration: "none", display: "inline-block", background: item.status === "missing" ? "#5637f5" : "#1a2238" }}
            >
              {item.actionText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// Local mock loader to satisfy client router import needs
function Loader2({ className, size }: { className?: string; size?: number }) {
  return <Sparkles className={className} size={size} />;
}
