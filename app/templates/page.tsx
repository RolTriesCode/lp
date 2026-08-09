import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TemplateManager } from "@/components/library/template-manager";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const initialLessonId = typeof params.lessonId === "string" ? params.lessonId : undefined;
  const initialSelectedId = typeof params.selected === "string" ? params.selected : undefined;
  const initialQuery = typeof params.q === "string" ? params.q.slice(0, 120) : "";
  const initialCurriculum = params.curriculum === "MATATAG" || params.curriculum === "ILAW" ? params.curriculum : "";
  return (
    <DashboardShell currentPath="/templates">
      <TemplateManager initialCurriculum={initialCurriculum} initialLessonId={initialLessonId} initialQuery={initialQuery} initialSelectedId={initialSelectedId} />
    </DashboardShell>
  );
}
