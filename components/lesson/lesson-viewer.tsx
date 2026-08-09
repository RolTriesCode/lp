"use client";

import { AlertTriangle, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { StructuredEditor } from "@/components/editor/structured-editor";
import { useLessonStore } from "@/stores/lesson-store";

type LessonViewerProps = {
  lessonId: string;
};

export function LessonViewer({ lessonId }: LessonViewerProps) {
  const [hasMounted, setHasMounted] = useState(false);

  const {
    activeLesson: lesson,
    isLoading,
    errorState,
    loadLesson,
  } = useLessonStore();

  useEffect(() => {
    setHasMounted(true);
    loadLesson(lessonId);
  }, [lessonId, loadLesson]);

  // Prevent SSR/CSR hydration mismatches by rendering loading state until mounted
  if (!hasMounted || isLoading) {
    return (
      <div className="lesson-create-container">
        <div className="lesson-form-card" style={{ padding: "40px", textAlign: "center" }}>
          <Sparkles className="sparkle-spin" size={28} color="#5637f5" />
          <p style={{ marginTop: "12px", color: "#54627e", fontSize: "13px" }}>
            Rehydrating and validating structured lesson draft...
          </p>
        </div>
      </div>
    );
  }

  if (errorState || !lesson) {
    return (
      <div className="lesson-create-container">
        <div className="lesson-form-card" style={{ padding: "32px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <AlertTriangle size={28} color="#e44b66" style={{ flexShrink: 0 }} />
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: "18px", color: "#1a2238" }}>
                Lesson Draft Recovery Required
              </h2>
              <p style={{ margin: "0 0 16px", color: "#5c6983", fontSize: "12px", lineHeight: "1.5" }}>
                {errorState || "The requested lesson draft could not be loaded or is in an incompatible schema version."}
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <Link className="btn-secondary" href="/lesson/create">
                  <ArrowLeft size={15} /> Return to Generator
                </Link>
                <button
                  className="btn-retry-generation"
                  onClick={() => loadLesson(lessonId)}
                  type="button"
                >
                  Reload Draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <StructuredEditor />;
}
