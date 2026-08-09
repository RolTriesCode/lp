import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ArtifactLibrary } from "@/components/library/artifact-library";

export default async function AssessmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <DashboardShell currentPath="/assessments"><ArtifactLibrary initialLessonId={typeof params.lessonId === "string" ? params.lessonId : ""} initialQuery={typeof params.q === "string" ? params.q : ""} initialStatus={typeof params.status === "string" ? params.status : "all"} kind="assessments" /></DashboardShell>;
}
