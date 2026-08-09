"use client";

import { ArrowLeft, ArrowRight, Eye, EyeOff, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { defaultStorageAdapter } from "@/lib/persistence/remote-adapter";
import { buildTeachingSlides } from "@/lib/pedagogy/presentation";
import { normalizeLessonPlan, type LessonPlan } from "@/schemas/lesson";

export function LessonTeachingMode({ lessonId }: { lessonId: string }) {
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    let active = true;
    void defaultStorageAdapter.getLesson(lessonId).then((value) => {
      if (!active) return;
      if (!value) {
        setMessage("This lesson is unavailable or you no longer have access.");
        setState("error");
        return;
      }
      setLesson(normalizeLessonPlan(value));
      setState("ready");
    }).catch((error) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : "The lesson could not be loaded.");
      setState("error");
    });
    return () => { active = false; };
  }, [lessonId]);

  const slides = useMemo(() => lesson ? buildTeachingSlides(lesson) : [], [lesson]);
  const goTo = useCallback((next: number) => {
    setIndex(Math.min(Math.max(next, 0), Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, a")) return;
      if (["ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goTo(index + 1);
      } else if (["ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goTo(index - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(slides.length - 1);
      } else if (event.key === "Escape") {
        router.push(`/lesson/${lessonId}`);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goTo, index, lessonId, router, slides.length]);

  async function enterFullscreen() {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen().catch(() => undefined);
    else await document.exitFullscreen().catch(() => undefined);
  }

  if (state === "loading") return <main className="teaching-mode-state"><strong>Preparing teaching mode…</strong><span>The saved lesson is being validated. No lesson data will be changed.</span></main>;
  if (state === "error" || !lesson || !slides.length) return <main className="teaching-mode-state"><strong>Teaching mode could not open</strong><span>{message ?? "The lesson has no presentable sections."}</span><Link href={`/lesson/${lessonId}`}>Return to editor</Link></main>;

  const slide = slides[index];
  const notes = (lesson.privateTeacherNotes ?? []).filter((note) => note.text && (note.section === "lesson" || note.section === slide.section));

  return (
    <main className="teaching-mode-shell">
      <header className="teaching-mode-toolbar">
        <Link href={`/lesson/${lessonId}`}><X aria-hidden="true" /> Exit teaching mode</Link>
        <div><strong>{lesson.title}</strong><span aria-live="polite">{index + 1} of {slides.length}</span></div>
        <div><button aria-pressed={showNotes} onClick={() => setShowNotes((value) => !value)} type="button">{showNotes ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{showNotes ? "Hide notes" : "Teacher notes"}</button><button onClick={() => void enterFullscreen()} type="button"><Maximize2 aria-hidden="true" /> Full screen</button></div>
      </header>

      <div className={`teaching-mode-stage${showNotes ? " notes-open" : ""}`}>
        <article aria-labelledby="teaching-slide-title" className={`teaching-slide ${slide.kind}`} key={slide.id}>
          <h1 id="teaching-slide-title">{slide.title}</h1>
          {slide.lines.length ? <ul>{slide.lines.map((line, lineIndex) => <li key={`${slide.id}-${lineIndex}`}>{line}</li>)}</ul> : null}
          <footer><span>{slide.eyebrow}</span><span>{lesson.gradeLevel} · {lesson.subject}</span></footer>
        </article>
        {showNotes ? <aside className="teaching-notes-tray" aria-label="Private teacher notes"><header><strong>Private teacher notes</strong><span>Hide before sharing the screen</span></header>{notes.length ? notes.map((note) => <p key={note.id}>{note.text}</p>) : <p>No private notes are attached to this section.</p>}</aside> : null}
      </div>

      <footer className="teaching-mode-controls">
        <button disabled={index === 0} onClick={() => goTo(index - 1)} type="button"><ArrowLeft aria-hidden="true" /> Previous</button>
        <div aria-label="Slide position">{slides.map((item, itemIndex) => <button aria-label={`Go to slide ${itemIndex + 1}: ${item.title}`} aria-current={itemIndex === index ? "step" : undefined} key={item.id} onClick={() => goTo(itemIndex)} type="button" />)}</div>
        <button disabled={index === slides.length - 1} onClick={() => goTo(index + 1)} type="button">Next <ArrowRight aria-hidden="true" /></button>
      </footer>
      <p className="teaching-mode-shortcuts">Arrow keys or Space to navigate · Home and End to jump · Esc to return</p>
    </main>
  );
}
