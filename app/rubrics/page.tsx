import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RubricLibrary } from "@/components/library/rubric-library";

export default async function RubricsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <DashboardShell currentPath="/rubrics"><RubricLibrary initialQuery={typeof params.q === "string" ? params.q : ""} initialState={typeof params.state === "string" ? params.state : "all"} /></DashboardShell>;
}
