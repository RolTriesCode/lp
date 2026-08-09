import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LessonCreateForm } from "@/components/lesson/lesson-create-form";
import { parseLessonPlanSearchParams } from "@/lib/lesson-plan-schema";

export default async function LessonCreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const initialValues = parseLessonPlanSearchParams(rawParams);

  return (
    <DashboardShell currentPath="/lesson/create">
      <LessonCreateForm initialValues={initialValues} />
    </DashboardShell>
  );
}
