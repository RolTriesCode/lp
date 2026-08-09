import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GlobalSearch } from "@/components/library/global-search";

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <DashboardShell currentPath=""><GlobalSearch query={typeof params.q === "string" ? params.q.slice(0, 120) : ""} /></DashboardShell>;
}
