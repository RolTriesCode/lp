import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { getTeacherProfile } from "@/lib/profile/repository";

export default async function ProfilePage() {
  const profile = await getTeacherProfile();
  return <DashboardShell currentPath="/settings/profile" profile={profile}><ProfileSettings profile={profile} /></DashboardShell>;
}
