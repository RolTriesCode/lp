import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LessonViewer } from "@/components/lesson/lesson-viewer";

export default async function LessonViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;

  return (
    <DashboardShell currentPath="/lesson/create">
      <LessonViewer lessonId={resolvedParams.id} />
    </DashboardShell>
  );
}
