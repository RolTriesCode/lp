import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PreferenceSettings } from "@/components/profile/preference-settings";
import { getTeacherPreferences, getTeacherProfile } from "@/lib/profile/repository";
import { requireAuthenticatedSupabase } from "@/lib/supabase/auth";

export default async function PreferencesPage() {
  const auth = await requireAuthenticatedSupabase();
  const [profile, preferences] = await Promise.all([
    getTeacherProfile(auth),
    getTeacherPreferences(auth),
  ]);
  return (
    <DashboardShell currentPath="/settings/preferences" profile={profile}>
      <PreferenceSettings preferences={preferences} />
    </DashboardShell>
  );
}
