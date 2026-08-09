import { MapPinOff } from "lucide-react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function NotFound() {
  return <DashboardShell currentPath=""><main className="route-terminal panel"><MapPinOff aria-hidden="true" /><h1>This workspace page was not found</h1><p>The address may be outdated, or the linked teaching record may have been removed.</p><div><Link className="library-primary-action" href="/dashboard">Return to dashboard</Link><Link className="library-secondary-action" href="/lesson">Open lesson plans</Link></div></main></DashboardShell>;
}
