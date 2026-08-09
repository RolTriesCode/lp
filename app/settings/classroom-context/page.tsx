import { ClassroomContextSettings } from "@/components/classroom-context/classroom-context-settings";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SupabaseClassroomContextRepository } from "@/lib/classroom-context/server";
import { getTeacherProfile } from "@/lib/profile/repository";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";
import { ClassroomContextApplicationSchema } from "@/schemas/classroom-context";

export default async function ClassroomContextPage() {
  const [profile, auth] = await Promise.all([getTeacherProfile(), requireAuthenticatedSupabase()]);
  const repository = new SupabaseClassroomContextRepository(auth.client, auth.userId);
  const record = await repository.get();
  const initial = record
    ? { value: ClassroomContextApplicationSchema.parse(record), revision: record.revision, updatedAt: record.updatedAt }
    : { value: repository.defaults(), revision: null, updatedAt: null };

  return <DashboardShell currentPath="/settings/classroom-context" profile={profile}><ClassroomContextSettings initial={initial} /></DashboardShell>;
}

