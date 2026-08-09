import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return <DashboardShell currentPath=""><main aria-label="Loading workspace" className="route-loading"><div className="route-loading-heading" /><div className="route-loading-subheading" /><div className="route-loading-toolbar" /><div className="route-loading-list">{Array.from({ length: 5 }, (_, index) => <span key={index} />)}</div></main></DashboardShell>;
}
