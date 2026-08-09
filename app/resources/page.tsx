import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ResourceLibrary } from "@/components/library/resource-library";

export default async function ResourcesPage({ searchParams }: PageProps<"/resources">) {
  const params = await searchParams;
  return (
    <DashboardShell currentPath="/resources">
      <ResourceLibrary initialQuery={typeof params.q === "string" ? params.q.slice(0, 120) : ""} initialSelectedId={typeof params.selected === "string" ? params.selected : ""} initialStatus={typeof params.status === "string" ? params.status : "all"} initialType={typeof params.type === "string" ? params.type : "all"} />
    </DashboardShell>
  );
}
