import { ArrowLeft, BookOpen, Check, FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { parseLessonPlanSearchParams } from "@/lib/lesson-plan-schema";

const lessonTypeLabels = {
  detailed: "Detailed Lesson Plan",
  "semi-detailed": "Semi-Detailed Lesson Plan",
  "daily-log": "Daily Lesson Log",
} as const;

export default async function LessonCreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const result = parseLessonPlanSearchParams(await searchParams);

  if (!result.success) {
    return (
      <main className="lesson-create-page">
        <div className="lesson-create-topbar">
          <div className="lesson-create-brand"><BookOpen size={27} /> AralAI</div>
        </div>
        <section className="lesson-create-empty" aria-labelledby="setup-heading">
          <div className="lesson-create-empty-icon"><FileText size={25} /></div>
          <h1 id="setup-heading">Lesson setup is incomplete</h1>
          <p>Return to the dashboard and complete the lesson details before opening the generator.</p>
          <Link href="/dashboard"><ArrowLeft size={16} /> Back to dashboard</Link>
        </section>
      </main>
    );
  }

  const lesson = result.data;
  const details = [
    ["Curriculum", lesson.curriculum],
    ["Grade level", `Grade ${lesson.grade}`],
    ["Learning area", lesson.subject],
    ["Lesson type", lessonTypeLabels[lesson.type]],
  ];

  return (
    <main className="lesson-create-page">
      <div className="lesson-create-topbar">
        <div className="lesson-create-brand"><BookOpen size={27} /> AralAI</div>
        <span>Lesson Generator</span>
      </div>
      <div className="lesson-create-content">
        <Link className="lesson-back-link" href="/dashboard"><ArrowLeft size={15} /> Dashboard</Link>
        <header className="lesson-create-heading">
          <div className="lesson-create-heading-icon"><Sparkles size={22} /></div>
          <div>
            <p>Lesson Generator</p>
            <h1>{lesson.topic}</h1>
            <span>Your lesson setup is ready for the next development stage.</span>
          </div>
        </header>
        <section className="lesson-setup-panel" aria-labelledby="lesson-setup-heading">
          <div className="lesson-setup-title">
            <div><Check size={17} /></div>
            <div>
              <h2 id="lesson-setup-heading">Lesson details received</h2>
              <p>These validated values are ready to be passed to the future generation API.</p>
            </div>
          </div>
          <dl className="lesson-detail-list">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="lesson-generator-notice">
            AI generation is not connected in this prototype stage.
          </div>
        </section>
      </div>
    </main>
  );
}
