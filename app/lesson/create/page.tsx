import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LessonCreateForm } from "@/components/lesson/lesson-create-form";
import { parseLessonPlanSearchParams } from "@/lib/lesson-plan-schema";
import { applyVerifiedCurriculumRecord } from "@/lib/curriculum/adapter";
import { getVerifiedCurriculumRecordById } from "@/lib/curriculum/lookup";
import { getTeacherPreferences } from "@/lib/profile/repository";

export default async function LessonCreatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [rawParams, preferences] = await Promise.all([searchParams, getTeacherPreferences()]);
  const parsedValues = parseLessonPlanSearchParams(rawParams);
  const recordId = typeof rawParams.curriculumRecordId === "string" ? rawParams.curriculumRecordId : "";
  const verifiedRecord = getVerifiedCurriculumRecordById(recordId);
  const hasParam = (key: string) => typeof rawParams[key] === "string";
  const preferredValues = {
    ...parsedValues,
    curriculum: hasParam("curriculum") ? parsedValues.curriculum : preferences.defaultCurriculum,
    type: hasParam("type") ? parsedValues.type : preferences.defaultLessonType,
    duration: hasParam("duration") ? parsedValues.duration : preferences.defaultDuration,
    language: hasParam("language") ? parsedValues.language : preferences.defaultLanguage,
  };
  const initialValues = verifiedRecord
    ? applyVerifiedCurriculumRecord(preferredValues, verifiedRecord)
    : preferredValues;
  const initialTemplateId = typeof rawParams.templateId === "string" ? rawParams.templateId : undefined;
  const initialResourceId = typeof rawParams.resourceId === "string" ? rawParams.resourceId : undefined;

  return (
    <DashboardShell currentPath="/lesson/create">
      <LessonCreateForm
        initialCurriculumRecord={verifiedRecord}
        initialResourceId={initialResourceId}
        initialTemplateId={initialTemplateId}
        initialValues={initialValues}
      />
    </DashboardShell>
  );
}
