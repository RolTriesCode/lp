import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LessonViewer } from "@/components/lesson/lesson-viewer";

export default async function LessonViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [resolvedParams, query] = await Promise.all([params, searchParams]);
  const sectionValue = Array.isArray(query.section) ? query.section[0] : query.section;
  const initialSection = ["objectives", "procedures", "assessment", "pedagogy"].includes(sectionValue ?? "") ? sectionValue : undefined;

  return (
    <DashboardShell currentPath="/lesson">
      <LessonViewer initialSection={initialSection} lessonId={resolvedParams.id} />
    </DashboardShell>
  );
}
